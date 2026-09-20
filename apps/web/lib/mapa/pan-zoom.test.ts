import { describe, expect, it } from "vitest";
import { DRAG_CLICK_THRESHOLD_PX } from "./constants";
import {
  centerViewOn,
  clampView,
  exceedsDragClickThreshold,
  fitView,
  panViewBy,
  zoomViewAt,
} from "./pan-zoom";

const viewport = { width: 800, height: 600, topInset: 50 };
const content = { width: 1155, height: 1362 };

describe("fitView", () => {
  it("fits the content below the top inset and centers it", () => {
    const view = fitView(viewport, content);
    expect(view.scale).toBeCloseTo(Math.min(800 / 1155, 550 / 1362));
    expect(view.y).toBeGreaterThanOrEqual(viewport.topInset);
    expect(view.minScale).toBe(view.scale);
    expect(view.maxScale).toBe(view.scale * 6);
  });
});

describe("clampView", () => {
  it("recenters when the map is smaller than the viewport", () => {
    const fitted = fitView(viewport, content);
    const clamped = clampView({ ...fitted, x: 999, y: 999 }, viewport, content);
    expect(clamped.x).toBeCloseTo(fitted.x);
    expect(clamped.y).toBeCloseTo(fitted.y);
  });
});

describe("zoomViewAt", () => {
  it("keeps the map point under the pointer", () => {
    const view = fitView(viewport, content);
    const pointerX = 400;
    const pointerY = 300;
    const mapX = (pointerX - view.x) / view.scale;
    const mapY = (pointerY - view.y) / view.scale;
    const zoomed = zoomViewAt(view, pointerX, pointerY, 1.3, viewport, content);
    expect((pointerX - zoomed.x) / zoomed.scale).toBeCloseTo(mapX);
    expect((pointerY - zoomed.y) / zoomed.scale).toBeCloseTo(mapY);
  });

  it("does not zoom past minScale", () => {
    const view = fitView(viewport, content);
    const zoomed = zoomViewAt(view, 400, 300, 0.1, viewport, content);
    expect(zoomed.scale).toBe(view.minScale);
  });
});

describe("panViewBy", () => {
  it("shifts x and y then clamps", () => {
    const view = fitView(viewport, content);
    const panned = panViewBy(view, 10, 10, viewport, content);
    expect(panned.scale).toBe(view.scale);
    expect(panned.x).toBeCloseTo(view.x);
    expect(panned.y).toBeCloseTo(view.y);
  });
});

describe("centerViewOn", () => {
  it("places the point in the available viewport", () => {
    const view = fitView(viewport, content);
    const centered = centerViewOn(view, 577.5, 681, viewport, content, view.minScale);
    expect(centered.x).toBeCloseTo(viewport.width / 2 - 577.5 * centered.scale);
  });
});

describe("exceedsDragClickThreshold", () => {
  it("is false at or below the prototype's 6px threshold", () => {
    expect(exceedsDragClickThreshold(0, 0)).toBe(false);
    expect(exceedsDragClickThreshold(DRAG_CLICK_THRESHOLD_PX, 0)).toBe(false);
  });

  it("is true once the pointer moves past 6px", () => {
    expect(exceedsDragClickThreshold(DRAG_CLICK_THRESHOLD_PX + 1, 0)).toBe(true);
  });
});
