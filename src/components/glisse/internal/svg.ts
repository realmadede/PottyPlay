const SVG = "http://www.w3.org/2000/svg";

let defs: SVGDefsElement | undefined;

export function svg(name: string, attributes: Record<string, string | number>): SVGElement {
  if (typeof document === "undefined") {
    return {
      append: () => {},
      setAttribute: () => {},
      style: {},
    } as unknown as SVGElement;
  }
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

/** The page's one hidden `<defs>`, where every filter lives. */
export function container(): SVGDefsElement {
  if (typeof document === "undefined") {
    return {
      append: () => {},
      isConnected: false,
    } as unknown as SVGDefsElement;
  }
  if (defs?.isConnected) return defs;
  const root = svg("svg", { width: 0, height: 0, "aria-hidden": "true" });
  root.style.cssText = "position:absolute;pointer-events:none";
  defs = svg("defs", {}) as SVGDefsElement;
  root.append(defs);
  document.body.append(root);
  return defs;
}
