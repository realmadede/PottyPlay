"use client";

// The engine shared by TabBar and SegmentedControl: a row of choices with one
// selected, under a selection that springs between them, follows a drag, and
// lifts into a lens while held. The two differ in what choosing means (a tab
// bar navigates; a segmented control picks a value), and so in their roles,
// and in how they look, which styles.css sets by their class.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
} from "react";

import { useControllable } from "./controllable";
import { cx } from "./cx";
import { held } from "./hold";
import { createBackdropLens, createLens, type LensOptions } from "./lens";
import { refractsBackdrop, useRefraction } from "./refraction";
import { createSpring } from "./spring";

/** One choice: a tab bar's tab, which may have an icon or a link, or a segment. */
export interface SegmentItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
}

export interface SegmentsProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  kind: "tab-bar" | "segmented";
  items: SegmentItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  link?: ElementType;
}

interface Parts {
  bar: HTMLElement;
  glass: HTMLElement;
  /** A segmented control's thumb, under the labels. A tab bar has none. */
  thumb: HTMLElement | null;
  labels: HTMLElement;
  lensed: HTMLElement;
  lens: HTMLElement;
  tint: HTMLElement;
  row: HTMLElement;
}

interface Controller {
  setActive(index: number): void;
  destroy(): void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
const REST = [1024, 58.9, 676, 47.8] as const;
// How far the lens lifts before it drops under the labels on a light page.
const UNDER = 0.5;
const DRAG = [2500, 94, 576, 44.2] as const;

// Lifted, the selection is a lens over the labels, bending them at its rim
// as iOS 26.1's tab bar lens does, measured at 3x through gradient and dot
// icons: what's 11px in is drawn out to the rim, pulled 7px at the edge, so
// what crosses the rim smears along it, softened, and split into colours
// 2 to 3px apart, red furthest out. The labels are ink (see lens.ts), so
// black and white labels split too. No dome, no splay.
// --lg-tab-bend overrides the strength, --lg-tab-dispersion the split.
const LENS: LensOptions = {
  strength: 0.2,
  strengthProperty: "--lg-tab-bend",
  dispersion: 2,
  dispersionProperty: "--lg-tab-dispersion",
  depth: 4,
  dome: 0,
  splay: 1,
  ink: true,
  blur: 2,
};

// A segmented control's lens bends its labels with Aave's toggle group's
// shape: a narrower band and a little dispersion.
// --lg-segment-bend overrides the strength.
const SEGMENT_LENS: LensOptions = {
  strength: 0.3,
  strengthProperty: "--lg-segment-bend",
  dispersion: 0.1,
  depth: 2.5,
  dome: 0,
  splay: 1,
};

function attach(
  { bar, glass, thumb, labels, lensed, lens, tint, row }: Parts,
  options: LensOptions,
  bendsBackdrop: boolean,
  select: (index: number) => void,
): Controller {
  const tabs = [...bar.querySelectorAll<HTMLElement>(".lg-tab")];
  let slot = 0;
  // The selection's size and its gap from its slot's edges, --lg-thumb-inset.
  let width = 0;
  let height = 0;
  let inset = 0;
  let padding = 0;
  let growX = 16;
  let growY = 12;
  let active = -1;
  let shown = false;
  let settleFrame = 0;
  let gesture: { id: number; x: number; anchor: number; moved: boolean; box: DOMRect; at: number } | null = null;
  const state = { x: 0, lift: 0 };
  // Through the lifted lens, the labels in full colour stand in for the tint,
  // refracted; at rest the tint shows the selected label.
  const refraction = createLens(lens, lensed, options, labels);
  // On a light page the lifted lens also bends what's behind it, the bar's
  // glass and the page, with the same lens, where the browser can.
  const backdrop = bendsBackdrop && refractsBackdrop() ? createBackdropLens(lens, options) : null;
  let lensing = false;

  // Whether the selection is off the selected tab (data-away). Over it,
  // lifted or not, the selection draws that tab's label: the tint at rest,
  // the lens's copy when lifted. The tab's own label then hides, as drawn
  // twice the two land a fraction of a pixel apart and fringe each other.
  const mark = () => bar.toggleAttribute("data-away", active < 0 || Math.abs(state.x - active * slot) > 0.5);

  const measure = () => {
    const style = getComputedStyle(bar);
    padding = parseFloat(style.paddingLeft) || 0;
    slot = (bar.clientWidth - padding - (parseFloat(style.paddingRight) || 0)) / tabs.length;
    inset = parseFloat(style.getPropertyValue("--lg-thumb-inset")) || 0;
    width = slot - 2 * inset;
    height = lens.offsetHeight;
    growX = parseFloat(style.getPropertyValue("--lg-lens-grow-x")) || 0;
    growY = parseFloat(style.getPropertyValue("--lg-lens-grow-y")) || 0;
  };

  const paint = () => {
    const { x, lift } = state;
    const sx = 1 + (growX / width) * lift;
    const sy = 1 + (growY / height) * lift;
    const transform = `translateX(${x}px) scale(${sx}, ${sy})`;
    lens.style.transform = tint.style.transform = transform;
    if (thumb) thumb.style.transform = transform;
    lens.style.setProperty("--lg-lift", String(clamp(lift, 0, 1)));
    lens.style.setProperty("--lg-lift-y", String(sy));
    // The tint's row of labels sits where the labels do, against the tint's
    // scale about its centre and its inset in its slot.
    row.style.transform = `scale(${1 / sx}, ${1 / sy}) translate(${-x + (sx - 1) * (inset + width / 2)}px, ${(sy - 1) * (inset + height / 2)}px)`;
    if (!gesture && lift < 0.01) delete bar.dataset.refracting;
    mark();
    if (lift > 0.01 !== lensing) {
      lensing = lift > 0.01;
      bar.toggleAttribute("data-lensing", lensing);
      refraction.setActive(lensing);
    }
    // The bend grows as the lens lifts and fades as it settles, so it never
    // switches on or off at a visible strength. On a light page the lens
    // changes over in steps (see styles.css): the selection's grey fades by
    // UNDER, then the lens drops under the labels and its fill and the bend
    // behind it grow from nothing.
    const amount = clamp(lift, 0, 1);
    const under = clamp((lift - UNDER) / (1 - UNDER), 0, 1);
    lens.style.setProperty("--lg-rest", String(clamp(1 - lift / UNDER, 0, 1)));
    lens.style.setProperty("--lg-under", String(under));
    bar.toggleAttribute("data-under", lift > UNDER);
    refraction.update(amount);
    backdrop?.update(under);
  };

  const x = createSpring(0, REST[0], REST[1], (value) => {
    state.x = value;
    paint();
  });
  const lift = createSpring(0, REST[2], REST[3], (value) => {
    state.lift = value;
    paint();
  });

  const move = (target: number, lifted: boolean, instant = false) => {
    const [slideStiffness, slideDamping, liftStiffness, liftDamping] = gesture ? DRAG : REST;
    x.tune(slideStiffness, slideDamping);
    lift.tune(liftStiffness, liftDamping);
    x.set(target, instant);
    lift.set(lifted ? 1 : 0, instant);
  };

  const settle = (instant = false) => {
    // A new selection is marked before the next frame, so its label never
    // blinks out ahead of the selection.
    mark();
    if (gesture) return;
    const show = active >= 0;
    if (show) delete bar.dataset.hidden;
    else bar.dataset.hidden = "";
    if (show) move(active * slot, false, instant || !shown);
    shown = show;
  };

  const position = (event: PointerEvent) =>
    clamp(gesture!.anchor + event.clientX - gesture!.x, 0, slot * (tabs.length - 1));

  const light = (event: PointerEvent, box: DOMRect) => {
    glass.style.setProperty("--lg-x", `${clamp(((event.clientX - box.left) / box.width) * 100, 0, 100)}%`);
    lens.style.setProperty("--lg-x", `${clamp(((event.clientX - box.left - padding - inset - state.x) / width) * 100, 0, 100)}%`);
  };

  const release = () => {
    const old = gesture;
    gesture = null;
    delete bar.dataset.lifted;
    delete lens.dataset.pressed;
    if (old && bar.hasPointerCapture(old.id)) bar.releasePointerCapture(old.id);
    return old;
  };

  let suppressClick = false;

  const onPointerDown = (event: PointerEvent) => {
    const tab = (event.target as Element).closest<HTMLElement>(".lg-tab");
    if (!event.isPrimary || event.button !== 0 || gesture || !tab) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    measure();
    // On a light page the lifted lens bends the bar behind it and takes a
    // brighter rim (data-light). Read on each hold: the page's theme can change.
    bar.toggleAttribute("data-light", parseFloat(getComputedStyle(lens).getPropertyValue("--lg-lens-shine")) < 0);
    backdrop?.refit();
    const box = bar.getBoundingClientRect();
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      anchor: tabs.indexOf(tab) * slot,
      moved: false,
      box,
      at: performance.now(),
    };
    suppressClick = false;
    bar.dataset.lifted = "";
    bar.dataset.refracting = "";
    delete bar.dataset.hidden;
    lens.dataset.pressed = "";
    light(event, box);
    move(gesture.anchor, true, !shown);
    shown = true;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== gesture?.id) return;
    if (!gesture.moved && Math.abs(event.clientX - gesture.x) > 6) {
      gesture.moved = true;
      bar.setPointerCapture(event.pointerId);
    }
    if (gesture.moved) move(position(event), true);
    light(event, gesture.box);
  };

  const onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== gesture?.id) return;
    // Touch implicitly captures the tab before a drag captures the bar. The
    // tab's bubbling capture-loss event is a handoff, not the end of the drag.
    if (event.type === "lostpointercapture" && event.target !== bar) return;
    const index = Math.round(position(event) / slot);
    const { moved, box } = release()!;
    // A drag selects wherever it leaves the lens, even released off the bar.
    // A tap only counts if it ends on the bar, as with a button.
    const near = event.clientY >= box.top - 24 && event.clientY <= box.bottom + 24;
    if (event.type === "pointerup" && (moved || near)) {
      // Activate taps and drags at release, before settling. Waiting for the
      // browser's click briefly sends the lens back toward the old selection.
      suppressClick = true;
      // React may commit a controlled selection after the click handler. Use
      // its new value, or settle back if the consumer declines the change.
      settleFrame = requestAnimationFrame(() => {
        settleFrame = 0;
        settle();
      });
      tabs[index]?.click();
    } else {
      suppressClick = moved;
      settle();
    }
  };

  // A quick swipe that starts on the bar still scrolls the page, but a press
  // that has rested there, or a drag already under way, keeps the touch.
  const onTouchMove = (event: TouchEvent) => {
    if (gesture && event.cancelable && held(gesture.at, gesture.moved)) event.preventDefault();
  };

  const onClick = (event: MouseEvent) => {
    if (event.isTrusted && suppressClick && event.detail !== 0) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
    const tab = (event.target as Element).closest<HTMLElement>(".lg-tab");
    if (!tab || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = tabs.indexOf(tab);
    if (tab instanceof HTMLAnchorElement) {
      active = index;
      settle();
    }
    select(index);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const tab = (event.target as Element).closest<HTMLElement>(".lg-tab");
    if (!tab || tab instanceof HTMLAnchorElement || !keys.includes(event.key)) return;
    event.preventDefault();
    const current = tabs.indexOf(tab);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    select(index);
    tabs[index]?.focus();
  };

  const reset = () => {
    cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    release();
    settle(true);
  };
  const onVisibilityChange = () => {
    if (document.hidden) reset();
  };
  const observer = new ResizeObserver(() => {
    measure();
    if (!gesture) settle(true);
  });

  measure();
  bar.dataset.ready = "";
  bar.addEventListener("pointerdown", onPointerDown);
  // A mouse isn't captured until it has moved, so follow it past the bar.
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);
  bar.addEventListener("lostpointercapture", onPointerEnd);
  bar.addEventListener("touchmove", onTouchMove, { passive: false });
  bar.addEventListener("click", onClick, true);
  bar.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("blur", reset);
  observer.observe(bar);

  return {
    setActive(index) {
      cancelAnimationFrame(settleFrame);
      settleFrame = 0;
      active = index;
      settle();
    },
    destroy() {
      cancelAnimationFrame(settleFrame);
      x.stop();
      lift.stop();
      refraction.destroy();
      backdrop?.destroy();
      observer.disconnect();
      for (const key of ["ready", "hidden", "lifted", "refracting", "lensing", "away", "light", "under"]) delete bar.dataset[key];
      bar.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      bar.removeEventListener("lostpointercapture", onPointerEnd);
      bar.removeEventListener("touchmove", onTouchMove);
      bar.removeEventListener("click", onClick, true);
      bar.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", reset);
    },
  };
}

// A tab's content: its label, under its icon if it has one. A label alone is
// boxed so it can be centred by its letters rather than its font's line box.
function content(item: SegmentItem): ReactNode {
  if (item.icon === undefined) return <span className="lg-tab-text">{item.label}</span>;
  return (
    <>
      <span className="lg-tab-icon" aria-hidden>
        {item.icon}
      </span>
      <span className="lg-tab-label">{item.label}</span>
    </>
  );
}


/**
 * A row of choices with one selected, under a selection that lifts into a
 * lens while held: a tab bar's, over glass, or a segmented control's, a thumb
 * on a track. Only TabBar and SegmentedControl use it.
 */
export function Segments({
  kind,
  items,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  link: Link = "a",
  className,
  style,
  ...props
}: SegmentsProps): JSX.Element {
  const segmented = kind === "segmented";
  const barRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const labelsRef = useRef<HTMLSpanElement>(null);
  const lensedRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const tintRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const controller = useRef<Controller | null>(null);
  const [value, setValue] = useControllable<string | null, string>(valueProp, defaultValue, onValueChange);
  const selected = items.findIndex((item) => item.value === value);
  const latest = useRef({ items, selected, setValue });
  const signature = items.map((item) => item.value).join("\n");
  const navigation = !segmented && items.every((item) => item.href !== undefined);
  const icons = !segmented && items.some((item) => item.icon !== undefined);

  useRefraction(glassRef);
  // Where the browser can, the lens bends what's behind it, the bar's glass
  // and the page, as thick glass does at its rim: a tab bar's with its own
  // lens (see attach), a segmented control's as before. The labels sit above
  // it and it bends them on its own (see lens.ts), so they bend once.
  useRefraction(lensRef, true, segmented);

  useEffect(() => {
    latest.current = { items, selected, setValue };
  });

  useEffect(() => {
    const instance = attach(
      {
        bar: barRef.current!,
        glass: glassRef.current!,
        thumb: thumbRef.current,
        labels: labelsRef.current!,
        lensed: lensedRef.current!,
        lens: lensRef.current!,
        tint: tintRef.current!,
        row: rowRef.current!,
      },
      segmented ? SEGMENT_LENS : LENS,
      !segmented,
      (index) => {
        const item = latest.current.items[index];
        if (item) latest.current.setValue(item.value);
      },
    );
    instance.setActive(latest.current.selected);
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, [signature, segmented]);

  useLayoutEffect(() => {
    controller.current?.setActive(selected);
  }, [selected]);

  return (
    <div
      ref={barRef}
      role={segmented ? "radiogroup" : navigation ? "navigation" : "tablist"}
      data-icons={icons ? "" : undefined}
      className={cx(segmented ? "lg-segmented" : "lg-tab-bar", className)}
      style={{ ...style, "--lg-index": Math.max(selected, 0), "--lg-tabs": items.length } as CSSProperties}
      {...props}
    >
      <span ref={glassRef} className="lg-glass lg-tab-bar-glass" aria-hidden />
      {segmented && <span ref={thumbRef} className="lg-segmented-thumb" aria-hidden />}
      <span ref={labelsRef} className="lg-tab-labels" role="none">
        {items.map((item, index) =>
          item.href !== undefined ? (
            <Link
              key={item.value}
              href={item.href}
              className="lg-tab"
              data-selected={index === selected ? "" : undefined}
              aria-current={index === selected ? "page" : undefined}
              draggable={false}
            >
              <span className="lg-tab-face">{content(item)}</span>
            </Link>
          ) : (
            <button
              key={item.value}
              type="button"
              role={segmented ? "radio" : "tab"}
              className="lg-tab"
              data-selected={index === selected ? "" : undefined}
              aria-selected={segmented ? undefined : index === selected}
              aria-checked={segmented ? index === selected : undefined}
              tabIndex={index === selected || (selected < 0 && index === 0) ? 0 : -1}
            >
              <span className="lg-tab-face">{content(item)}</span>
            </button>
          ),
        )}
      </span>
      <span ref={lensedRef} className="lg-tab-labels lg-tab-lensed" aria-hidden>
        {items.map((item, index) => (
          <span key={item.value} className="lg-tab-copy" data-selected={index === selected ? "" : undefined}>
            {content(item)}
          </span>
        ))}
      </span>
      <span ref={tintRef} className="lg-tab-tint" aria-hidden>
        <span ref={rowRef} className="lg-tab-row">
          {items.map((item) => (
            <span key={item.value} className="lg-tab-copy">
              {content(item)}
            </span>
          ))}
        </span>
      </span>
      <span ref={lensRef} className="lg-glass lg-tab-lens" aria-hidden />
    </div>
  );
}
