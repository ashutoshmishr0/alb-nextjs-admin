"use client";

import React, { useEffect, useRef, useState } from "react";

export interface CropRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function CropCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  bannerWidth,
  bannerHeight,
  onDone,
  onCancel,
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  bannerWidth: number;
  bannerHeight: number;
  onDone: (crop: CropRegion) => void | Promise<void>;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      setContainerSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fitScale = Math.min(
    (containerSize.w - 48) / imageWidth,
    (containerSize.h - 48) / imageHeight,
    1
  );
  const dispW = imageWidth * fitScale;
  const dispH = imageHeight * fitScale;
  const cropDispW = Math.min(bannerWidth * fitScale, dispW);
  const cropDispH = Math.min(bannerHeight * fitScale, dispH);

  const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    setBoxPos({
      x: Math.max(0, (dispW - cropDispW) / 2),
      y: Math.max(0, (dispH - cropDispH) / 2),
    });
  }, [dispW, dispH, cropDispW, cropDispH]);

  const dragging = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const onBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { sx: e.clientX, sy: e.clientY, bx: boxPos.x, by: boxPos.y };
    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      setBoxPos({
        x: clamp(dragging.current.bx + (me.clientX - dragging.current.sx), 0, dispW - cropDispW),
        y: clamp(dragging.current.by + (me.clientY - dragging.current.sy), 0, dispH - cropDispH),
      });
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleApply = () => {
    onDone({
      x: boxPos.x / fitScale,
      y: boxPos.y / fitScale,
      w: bannerWidth,
      h: bannerHeight,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1a1a1a] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Crop Image</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Drag the purple box to choose which region to use
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
          >
            Apply Crop ✓
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ minHeight: 0, padding: 24 }}
      >
        <div style={{ position: "relative", width: dispW, height: dispH, flexShrink: 0 }}>
          <img
            src={imageUrl}
            alt="Crop source"
            draggable={false}
            style={{ width: dispW, height: dispH, display: "block", userSelect: "none", pointerEvents: "none" }}
          />
          {/* Dark overlay with hole */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <mask id="crop-hole">
                <rect width="100%" height="100%" fill="white" />
                <rect x={boxPos.x} y={boxPos.y} width={cropDispW} height={cropDispH} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-hole)" />
          </svg>
          {/* Draggable crop box */}
          <div
            onMouseDown={onBoxMouseDown}
            style={{
              position: "absolute",
              left: boxPos.x,
              top: boxPos.y,
              width: cropDispW,
              height: cropDispH,
              border: "2px solid #8b5cf6",
              boxSizing: "border-box",
              cursor: "move",
            }}
          >
            {/* Grid lines */}
            {[33.33, 66.66].map((p) => (
              <React.Fragment key={p}>
                <div style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: "rgba(139,92,246,0.45)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: 1, background: "rgba(139,92,246,0.45)", pointerEvents: "none" }} />
              </React.Fragment>
            ))}
            {/* Corner handles */}
            {(
              [
                { top: -4, left: -4 },
                { top: -4, right: -4 },
                { bottom: -4, left: -4 },
                { bottom: -4, right: -4 },
              ] as React.CSSProperties[]
            ).map((style, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 10,
                  height: 10,
                  background: "#8b5cf6",
                  border: "2px solid white",
                  borderRadius: 2,
                  pointerEvents: "none",
                  ...style,
                }}
              />
            ))}
            {/* Size label */}
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                background: "rgba(139,92,246,0.92)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 4,
                padding: "2px 8px",
                pointerEvents: "none",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {bannerWidth} × {bannerHeight}px
            </div>
            {/* Move icon */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "rgba(255,255,255,0.45)",
                fontSize: 26,
                pointerEvents: "none",
                lineHeight: 1,
              }}
            >
              ⤡
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 text-center py-2 text-xs text-slate-500 bg-[#1a1a1a] border-t border-white/5">
        Original: {imageWidth} × {imageHeight}px &nbsp;·&nbsp; Crop area: {bannerWidth} × {bannerHeight}px
      </div>
    </div>
  );
}