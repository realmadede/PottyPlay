"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type InputHTMLAttributes,
  type RefAttributes,
} from "react";

import { useControllable } from "./internal/controllable";
import { cx } from "./internal/cx";
import { createLens, type Lens, type LensOptions } from "./internal/lens";
import { createSpring } from "./internal/spring";

export interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

// Lifted, the thumb is a lens. As in Aave's slider, it shows the track
// thicker, as if magnified, bent at its rim.
// --lg-slider-bend overrides the strength.
const LENS: LensOptions = {
  strength: 0.75,
  strengthProperty: "--lg-slider-bend",
  dispersion: 0.65,
  depth: 2,
  dome: 5,
  splay: 0.5,
};

export const Slider: ForwardRefExoticComponent<SliderProps & RefAttributes<HTMLInputElement>> = /* @__PURE__ */ forwardRef<
  HTMLInputElement,
  SliderProps
>(function Slider(
  { value: valueProp, defaultValue, onValueChange, min = 0, max = 100, step = 1, className, style, ...props },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bedRef = useRef<HTMLSpanElement>(null);
  const magnifiedRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<Lens | null>(null);
  const faceRef = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange);
  const progress = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  useImperativeHandle(forwardedRef, () => inputRef.current!);

  useEffect(() => {
    const input = inputRef.current!;
    const thumb = thumbRef.current!;
    const face = faceRef.current!;
    const root = rootRef.current!;
    const lens = createLens(thumb, magnifiedRef.current!, LENS, bedRef.current!);
    lensRef.current = lens;
    const lift = createSpring(0, 2000, 80, (amount) => {
      const lifted = Math.min(1, Math.max(0, amount));
      thumb.style.scale = String(0.6 + 0.4 * amount);
      root.style.setProperty("--lg-lift", String(lifted));
      face.style.opacity = String(1 - 0.85 * lifted);
      lens.setActive(amount > 0.01);
      lens.update();
    });

    const hold = () => {
      if (!input.disabled) lift.set(1);
    };
    const release = () => lift.set(0);
    const ends = ["pointerup", "pointercancel", "lostpointercapture", "blur"] as const;

    input.addEventListener("pointerdown", hold);
    ends.forEach((type) => input.addEventListener(type, release));
    window.addEventListener("pointerup", release);
    return () => {
      lift.stop();
      lens.destroy();
      lensRef.current = null;
      input.removeEventListener("pointerdown", hold);
      ends.forEach((type) => input.removeEventListener(type, release));
      window.removeEventListener("pointerup", release);
    };
  }, []);

  // The thumb follows the value through layout; keep the lens under it.
  useLayoutEffect(() => {
    lensRef.current?.update();
  }, [progress]);

  return (
    <div ref={rootRef} className={cx("lg-slider", className)} style={{ ...style, "--lg-progress": progress } as CSSProperties}>
      <span ref={bedRef} className="lg-slider-bed" aria-hidden>
        <span className="lg-slider-track">
          <span className="lg-slider-fill" />
        </span>
      </span>
      <span ref={magnifiedRef} className="lg-slider-bed lg-slider-magnified" aria-hidden>
        <span className="lg-slider-track">
          <span className="lg-slider-fill" />
        </span>
      </span>
      <span ref={thumbRef} className="lg-slider-thumb" aria-hidden>
        <span ref={faceRef} className="lg-thumb-face" />
      </span>
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
        {...props}
      />
    </div>
  );
});
