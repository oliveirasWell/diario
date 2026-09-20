"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

const ZOOM_STEP = 1.25;
const MAX_SCALE_FACTOR = 6;
const DRAG_CLICK_THRESHOLD = 6;

type ViewState = { scale: number; x: number; y: number };

type PointerRecord = { x: number; y: number };

/**
 * Pan/zoom over a fixed-size content area (the floor plan SVG), adapted from
 * docs/mapa/index.html's stage engine: pointer-drag panning (unifies mouse
 * and single-touch), wheel zoom, two-finger pinch zoom, and a drag-vs-click
 * threshold so a pan gesture ending over a hotspot doesn't open it.
 *
 * Deliberately does NOT use `setPointerCapture` on the container. Capturing
 * the pointer there retargets the synthesized `click` event to the
 * container itself once a gesture starts — even for a plain tap — which
 * silently swallowed clicks on hotspot rects nested inside. Instead, a
 * gesture starts on the container's pointerdown but is tracked via
 * window-level pointermove/pointerup listeners (matching the prototype's
 * original window mousemove/mouseup approach), so a simple click on a
 * hotspot is left alone to bubble and fire natively.
 *
 * Takes the container ref rather than creating one, so the returned value
 * never mixes a ref together with derived render data (React Compiler
 * treats any object holding a ref as ref-like, and then flags every other
 * field read from that same object as an unsafe render-time ref access).
 */
export const usePanZoom = (
  containerRef: RefObject<HTMLDivElement | null>,
  contentWidth: number,
  contentHeight: number,
) => {
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [minScale, setMinScale] = useState(1);
  const maxScale = minScale * MAX_SCALE_FACTOR;

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const pointers = useRef(new Map<number, PointerRecord>());
  const dragOrigin = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const movedSinceDown = useRef(0);

  const clampPan = useCallback(
    (scale: number, x: number, y: number): ViewState => {
      const container = containerRef.current;
      if (!container) {
        return { scale, x, y };
      }
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;
      const displayWidth = contentWidth * scale;
      const displayHeight = contentHeight * scale;

      const nextX =
        displayWidth <= viewportWidth
          ? (viewportWidth - displayWidth) / 2
          : Math.min(0, Math.max(viewportWidth - displayWidth, x));
      const nextY =
        displayHeight <= viewportHeight
          ? (viewportHeight - displayHeight) / 2
          : Math.min(0, Math.max(viewportHeight - displayHeight, y));

      return { scale, x: nextX, y: nextY };
    },
    [containerRef, contentWidth, contentHeight],
  );

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const scale = Math.min(
      container.clientWidth / contentWidth,
      container.clientHeight / contentHeight,
    );
    setMinScale(scale);
    setView(clampPan(scale, 0, 0));
  }, [containerRef, contentWidth, contentHeight, clampPan]);

  useEffect(() => {
    fitToScreen();
    window.addEventListener("resize", fitToScreen);
    return () => window.removeEventListener("resize", fitToScreen);
  }, [fitToScreen]);

  const zoomAt = useCallback(
    (pointerX: number, pointerY: number, factor: number) => {
      setView((current) => {
        const nextScale = Math.min(maxScale, Math.max(minScale, current.scale * factor));
        const contentX = (pointerX - current.x) / current.scale;
        const contentY = (pointerY - current.y) / current.scale;
        return clampPan(
          nextScale,
          pointerX - contentX * nextScale,
          pointerY - contentY * nextScale,
        );
      });
    },
    [minScale, maxScale, clampPan],
  );

  const zoomAtViewportCenter = useCallback(
    (factor: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      zoomAt(container.clientWidth / 2, container.clientHeight / 2, factor);
    },
    [containerRef, zoomAt],
  );

  const trackPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) {
        return;
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size === 2 && pinchStartDistance.current) {
        const [a, b] = Array.from(pointers.current.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const factor = distance / pinchStartDistance.current;
        const container = containerRef.current;
        if (!container) {
          return;
        }
        const rect = container.getBoundingClientRect();
        const midpointX = (a.x + b.x) / 2 - rect.left;
        const midpointY = (a.y + b.y) / 2 - rect.top;
        const targetScale = Math.min(
          maxScale,
          Math.max(minScale, pinchStartScale.current * factor),
        );
        setView((current) =>
          zoomToScaleAtPoint(current, targetScale, midpointX, midpointY, clampPan),
        );
        movedSinceDown.current = DRAG_CLICK_THRESHOLD + 1;
        return;
      }

      if (dragOrigin.current && pointers.current.size === 1) {
        const origin = dragOrigin.current;
        const deltaX = event.clientX - origin.x;
        const deltaY = event.clientY - origin.y;
        movedSinceDown.current = Math.max(movedSinceDown.current, Math.hypot(deltaX, deltaY));
        setView((current) => clampPan(current.scale, origin.viewX + deltaX, origin.viewY + deltaY));
      }
    },
    [containerRef, clampPan, minScale, maxScale],
  );

  const endGesture = useCallback((event: PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinchStartDistance.current = null;
    }
    if (pointers.current.size === 0) {
      dragOrigin.current = null;
    }
  }, []);

  // `latest` always holds the freshest trackPointerMove/endGesture closures,
  // called from the permanently-stable window listener refs below.
  const latest = useRef({ trackPointerMove, endGesture });
  useEffect(() => {
    latest.current = { trackPointerMove, endGesture };
  }, [trackPointerMove, endGesture]);

  // Created once (useRef's initializer only runs on mount) so these never
  // change identity — required for add/removeEventListener to target the
  // same function — while always calling the freshest logic via `latest`.
  const windowPointerMoveRef = useRef((event: PointerEvent) =>
    latest.current.trackPointerMove(event),
  );
  const windowPointerUpRef = useRef((event: PointerEvent) => {
    latest.current.endGesture(event);
    if (pointers.current.size === 0) {
      window.removeEventListener("pointermove", windowPointerMoveRef.current);
      window.removeEventListener("pointerup", windowPointerUpRef.current);
      window.removeEventListener("pointercancel", windowPointerUpRef.current);
    }
  });

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const isFirstPointer = pointers.current.size === 0;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    movedSinceDown.current = 0;

    if (pointers.current.size === 1) {
      dragOrigin.current = {
        x: event.clientX,
        y: event.clientY,
        viewX: viewRef.current.x,
        viewY: viewRef.current.y,
      };
    } else if (pointers.current.size === 2) {
      dragOrigin.current = null;
      const [a, b] = Array.from(pointers.current.values());
      pinchStartDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStartScale.current = viewRef.current.scale;
    }

    if (isFirstPointer) {
      window.addEventListener("pointermove", windowPointerMoveRef.current);
      window.addEventListener("pointerup", windowPointerUpRef.current);
      window.addEventListener("pointercancel", windowPointerUpRef.current);
    }
  }, []);

  // Safety net for a gesture still in progress when this unmounts (e.g. the
  // user navigates away mid-drag) — removeEventListener is a no-op if these
  // were never added, so this is safe to run unconditionally.
  useEffect(() => {
    // These never change after mount (see the useRef initializers above),
    // but are still captured locally so the cleanup doesn't read `.current`.
    const windowPointerMove = windowPointerMoveRef.current;
    const windowPointerUp = windowPointerUpRef.current;
    return () => {
      window.removeEventListener("pointermove", windowPointerMove);
      window.removeEventListener("pointerup", windowPointerUp);
      window.removeEventListener("pointercancel", windowPointerUp);
    };
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor);
    },
    [containerRef, zoomAt],
  );

  const wasDragging = useCallback(() => movedSinceDown.current > DRAG_CLICK_THRESHOLD, []);

  const centerOn = useCallback(
    (pointX: number, pointY: number, targetScale?: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const nextScale = targetScale ?? Math.max(viewRef.current.scale, minScale * 2);
      const viewportCenterX = container.clientWidth / 2;
      const viewportCenterY = container.clientHeight / 2;
      setView(
        clampPan(
          nextScale,
          viewportCenterX - pointX * nextScale,
          viewportCenterY - pointY * nextScale,
        ),
      );
    },
    [containerRef, clampPan, minScale],
  );

  const transform = useMemo(
    () => `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    [view.x, view.y, view.scale],
  );

  // Stable identities (not inline arrows) so consumers like MapControls can
  // be memoized without their props changing reference every render.
  const zoomIn = useCallback(() => zoomAtViewportCenter(ZOOM_STEP), [zoomAtViewportCenter]);
  const zoomOut = useCallback(() => zoomAtViewportCenter(1 / ZOOM_STEP), [zoomAtViewportCenter]);

  return {
    transform,
    scale: view.scale,
    handlers: {
      onPointerDown: handlePointerDown,
      onWheel: handleWheel,
    },
    zoomIn,
    zoomOut,
    reset: fitToScreen,
    centerOn,
    wasDragging,
  };
};

const zoomToScaleAtPoint = (
  current: ViewState,
  nextScale: number,
  pointerX: number,
  pointerY: number,
  clampPan: (scale: number, x: number, y: number) => ViewState,
): ViewState => {
  const contentX = (pointerX - current.x) / current.scale;
  const contentY = (pointerY - current.y) / current.scale;
  return clampPan(nextScale, pointerX - contentX * nextScale, pointerY - contentY * nextScale);
};
