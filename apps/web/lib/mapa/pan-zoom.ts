import { DRAG_CLICK_THRESHOLD_PX, MAX_SCALE_FACTOR } from "./constants";

export type ViewState = {
  scale: number;
  minScale: number;
  maxScale: number;
  x: number;
  y: number;
};

export type ViewportSize = {
  width: number;
  height: number;
  topInset: number;
};

export type ContentSize = {
  width: number;
  height: number;
};

export const fitView = (viewport: ViewportSize, content: ContentSize): ViewState => {
  const availableHeight = viewport.height - viewport.topInset;
  const scale = Math.min(viewport.width / content.width, availableHeight / content.height);
  return {
    scale,
    minScale: scale,
    maxScale: scale * MAX_SCALE_FACTOR,
    x: (viewport.width - content.width * scale) / 2,
    y: viewport.topInset + (availableHeight - content.height * scale) / 2,
  };
};

export const clampView = (
  view: ViewState,
  viewport: ViewportSize,
  content: ContentSize,
): ViewState => {
  const availableHeight = viewport.height - viewport.topInset;
  const mapWidth = content.width * view.scale;
  const mapHeight = content.height * view.scale;

  let nextX = view.x;
  let nextY = view.y;

  if (mapWidth <= viewport.width) {
    nextX = (viewport.width - mapWidth) / 2;
  } else {
    nextX = Math.min(0, Math.max(viewport.width - mapWidth, view.x));
  }

  if (mapHeight <= availableHeight) {
    nextY = viewport.topInset + (availableHeight - mapHeight) / 2;
  } else {
    nextY = Math.min(viewport.topInset, Math.max(viewport.height - mapHeight, view.y));
  }

  return { ...view, x: nextX, y: nextY };
};

export const zoomViewAt = (
  view: ViewState,
  pointerX: number,
  pointerY: number,
  factor: number,
  viewport: ViewportSize,
  content: ContentSize,
): ViewState => {
  const nextScale = Math.min(view.maxScale, Math.max(view.minScale, view.scale * factor));
  if (nextScale === view.scale) {
    return view;
  }
  const mapX = (pointerX - view.x) / view.scale;
  const mapY = (pointerY - view.y) / view.scale;
  return clampView(
    {
      ...view,
      scale: nextScale,
      x: pointerX - mapX * nextScale,
      y: pointerY - mapY * nextScale,
    },
    viewport,
    content,
  );
};

export const panViewBy = (
  view: ViewState,
  deltaX: number,
  deltaY: number,
  viewport: ViewportSize,
  content: ContentSize,
): ViewState => clampView({ ...view, x: view.x + deltaX, y: view.y + deltaY }, viewport, content);

export const centerViewOn = (
  view: ViewState,
  pointX: number,
  pointY: number,
  viewport: ViewportSize,
  content: ContentSize,
  targetScale?: number,
): ViewState => {
  const nextScale =
    targetScale ?? Math.max(view.minScale, Math.min(view.scale, view.minScale * 1.6));
  const availableHeight = viewport.height - viewport.topInset;
  return clampView(
    {
      ...view,
      scale: nextScale,
      x: viewport.width / 2 - pointX * nextScale,
      y: viewport.topInset + availableHeight / 2 - pointY * nextScale,
    },
    viewport,
    content,
  );
};

export const exceedsDragClickThreshold = (deltaX: number, deltaY: number): boolean =>
  Math.hypot(deltaX, deltaY) > DRAG_CLICK_THRESHOLD_PX;
