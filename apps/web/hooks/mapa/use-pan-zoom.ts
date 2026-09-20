"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { BUTTON_ZOOM_FACTOR, WHEEL_ZOOM_FACTOR } from "@/lib/mapa/constants";
import {
  centerViewOn,
  exceedsDragClickThreshold,
  fitView,
  panViewBy,
  zoomViewAt,
  type ViewState,
} from "@/lib/mapa/pan-zoom";

type UsePanZoomOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  contentWidth: number;
  contentHeight: number;
  getTopInset: () => number;
};

/**
 * Pan/zoom copied from docs/mapa/index.html: mouse drag on window
 * mousemove/mouseup, wheel zoom, two-finger pinch, 6px drag-vs-click.
 * Native listeners on the wrap — not pointer capture — so a tap on a room
 * still fires click on that room.
 */
export const usePanZoom = ({
  containerRef,
  contentWidth,
  contentHeight,
  getTopInset,
}: UsePanZoomOptions) => {
  const [view, setView] = useState<ViewState>({
    scale: 1,
    minScale: 1,
    maxScale: 6,
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const viewRef = useRef(view);
  const getTopInsetRef = useRef(getTopInset);
  const contentRef = useRef({ width: contentWidth, height: contentHeight });

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    getTopInsetRef.current = getTopInset;
  }, [getTopInset]);

  useEffect(() => {
    contentRef.current = { width: contentWidth, height: contentHeight };
  }, [contentWidth, contentHeight]);

  const suppressClickRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number | null>(null);

  const readViewport = useCallback(() => {
    const container = containerRef.current;
    return {
      width: container?.clientWidth ?? 0,
      height: container?.clientHeight ?? 0,
      topInset: getTopInsetRef.current(),
    };
  }, [containerRef]);

  const commitView = (next: ViewState) => {
    viewRef.current = next;
    setView(next);
  };

  const fitToScreen = useCallback(() => {
    const viewport = readViewport();
    if (!viewport.width || !viewport.height) {
      return;
    }
    commitView(fitView(viewport, contentRef.current));
  }, [readViewport]);

  const zoomAtClient = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      commitView(
        zoomViewAt(
          viewRef.current,
          clientX - rect.left,
          clientY - rect.top,
          factor,
          readViewport(),
          contentRef.current,
        ),
      );
    },
    [containerRef, readViewport],
  );

  const centerOn = useCallback(
    (pointX: number, pointY: number, targetScale?: number) => {
      commitView(
        centerViewOn(
          viewRef.current,
          pointX,
          pointY,
          readViewport(),
          contentRef.current,
          targetScale,
        ),
      );
    },
    [readViewport],
  );

  const wasDragging = useCallback(() => suppressClickRef.current, []);

  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAtClient(
        event.clientX,
        event.clientY,
        event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR,
      );
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }
      isPointerDownRef.current = true;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      suppressClickRef.current = false;
      setIsDragging(true);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isPointerDownRef.current || !lastPointerRef.current) {
        return;
      }
      const deltaX = event.clientX - lastPointerRef.current.x;
      const deltaY = event.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      commitView(panViewBy(viewRef.current, deltaX, deltaY, readViewport(), contentRef.current));
      const origin = dragStartRef.current;
      if (origin && exceedsDragClickThreshold(event.clientX - origin.x, event.clientY - origin.y)) {
        suppressClickRef.current = true;
      }
    };

    const onMouseUp = () => {
      isPointerDownRef.current = false;
      dragStartRef.current = null;
      lastPointerRef.current = null;
      setIsDragging(false);
    };

    const touchDistance = (touchA: Touch, touchB: Touch) =>
      Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);

    const onTouchStart = (event: TouchEvent) => {
      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (event.touches.length === 1 && first) {
        isPointerDownRef.current = true;
        lastPointerRef.current = { x: first.clientX, y: first.clientY };
        dragStartRef.current = { x: first.clientX, y: first.clientY };
        suppressClickRef.current = false;
      } else if (event.touches.length === 2 && first && second) {
        isPointerDownRef.current = false;
        dragStartRef.current = null;
        pinchStartDistanceRef.current = touchDistance(first, second);
        pinchStartScaleRef.current = viewRef.current.scale;
        suppressClickRef.current = true;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      const first = event.touches.item(0);
      const second = event.touches.item(1);
      if (
        event.touches.length === 1 &&
        first &&
        isPointerDownRef.current &&
        lastPointerRef.current
      ) {
        const deltaX = first.clientX - lastPointerRef.current.x;
        const deltaY = first.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: first.clientX, y: first.clientY };
        commitView(panViewBy(viewRef.current, deltaX, deltaY, readViewport(), contentRef.current));
        const origin = dragStartRef.current;
        if (
          origin &&
          exceedsDragClickThreshold(first.clientX - origin.x, first.clientY - origin.y)
        ) {
          suppressClickRef.current = true;
        }
        event.preventDefault();
      } else if (
        event.touches.length === 2 &&
        first &&
        second &&
        pinchStartDistanceRef.current &&
        pinchStartScaleRef.current
      ) {
        suppressClickRef.current = true;
        const distance = touchDistance(first, second);
        const midX = (first.clientX + second.clientX) / 2;
        const midY = (first.clientY + second.clientY) / 2;
        const factor =
          ((distance / pinchStartDistanceRef.current) * pinchStartScaleRef.current) /
          viewRef.current.scale;
        zoomAtClient(midX, midY, factor);
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const remaining = event.touches.item(0);
      if (event.touches.length === 0) {
        isPointerDownRef.current = false;
        dragStartRef.current = null;
        lastPointerRef.current = null;
        pinchStartDistanceRef.current = null;
        pinchStartScaleRef.current = null;
      } else if (event.touches.length === 1 && remaining) {
        lastPointerRef.current = { x: remaining.clientX, y: remaining.clientY };
        pinchStartDistanceRef.current = null;
      }
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd);
    window.addEventListener("resize", fitToScreen);
    fitToScreen();

    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", fitToScreen);
    };
  }, [containerRef, contentWidth, contentHeight, fitToScreen, zoomAtClient, readViewport]);

  const transform = useMemo(
    () => `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    [view.x, view.y, view.scale],
  );

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    zoomAtClient(rect.left + rect.width / 2, rect.top + rect.height / 2, BUTTON_ZOOM_FACTOR);
  }, [containerRef, zoomAtClient]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    zoomAtClient(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / BUTTON_ZOOM_FACTOR);
  }, [containerRef, zoomAtClient]);

  return {
    transform,
    scale: view.scale,
    isDragging,
    zoomIn,
    zoomOut,
    reset: fitToScreen,
    centerOn,
    wasDragging,
  };
};
