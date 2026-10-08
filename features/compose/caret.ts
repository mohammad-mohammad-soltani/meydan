/** Pixel position of a textarea's caret, relative to the textarea's own box (scroll applied). */

const MIRRORED = [
  "direction", "boxSizing", "width", "overflowX", "overflowY",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontFamily",
  "lineHeight", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize",
] as const;

export function getCaretCoordinates(area: HTMLTextAreaElement, index: number): { top: number; left: number; height: number } {
  const style = window.getComputedStyle(area);
  const mirror = document.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  for (const prop of MIRRORED) mirror.style[prop as never] = style[prop as never];
  mirror.style.overflow = "hidden";
  mirror.textContent = area.value.slice(0, index);
  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
  const coords = {
    top: marker.offsetTop - area.scrollTop,
    left: marker.offsetLeft - area.scrollLeft,
    height: lineHeight,
  };
  document.body.removeChild(mirror);
  return coords;
}
