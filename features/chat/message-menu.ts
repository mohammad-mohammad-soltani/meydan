export type MessageMenuPoint = {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  menuWidth?: number;
  menuHeight?: number;
  margin?: number;
};

export const MESSAGE_MENU_WIDTH = 208;
export const MESSAGE_MENU_HEIGHT = 280;
export const MESSAGE_MENU_MARGIN = 8;

export function getMessageMenuPosition({
  x,
  y,
  viewportWidth,
  viewportHeight,
  menuWidth = MESSAGE_MENU_WIDTH,
  menuHeight = MESSAGE_MENU_HEIGHT,
  margin = MESSAGE_MENU_MARGIN,
}: MessageMenuPoint) {
  const maxX = Math.max(margin, viewportWidth - menuWidth - margin);
  const maxY = Math.max(margin, viewportHeight - menuHeight - margin);

  return {
    x: Math.min(Math.max(x, margin), maxX),
    y: Math.min(Math.max(y, margin), maxY),
  };
}

export function getMessageActionButtonClass(isOwn: boolean): string {
  return [
    "absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full",
    "bg-surface-glass/80 text-icon-muted opacity-0 shadow-xs backdrop-blur transition-[opacity,background-color,color]",
    "hover:bg-hover hover:text-icon focus:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100",
    isOwn ? "right-full mr-2" : "left-full ml-2",
  ].join(" ");
}
