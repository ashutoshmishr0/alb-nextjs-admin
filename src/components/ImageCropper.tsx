'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  onCropComplete: (blob: Blob) => void;
  onClose: () => void;
  imageSrc: string;
}

const CROP_SIZE = 500;
const OUT = 500;

export default function ImageCropper({ onCropComplete, onClose, imageSrc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dispSize, setDispSize] = useState({ w: 0, h: 0 });
  const [natSize, setNatSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const getCrop = useCallback(() => {
    const cw = containerRef.current?.offsetWidth || 400;
    const ch = containerRef.current?.offsetHeight || 300;
    const size = Math.min(CROP_SIZE, cw - 24, ch - 24);
    return { cx: (cw - size) / 2, cy: (ch - size) / 2, size };
  }, []);

  const clamp = useCallback((ox: number, oy: number, dw: number, dh: number) => {
    const { cx, cy, size } = getCrop();
    return {
      x: Math.min(cx, Math.max(cx + size - dw, ox)),
      y: Math.min(cy, Math.max(cy + size - dh, oy)),
    };
  }, [getCrop]);

  const drawPreview = useCallback((ox: number, oy: number, dw: number, natW: number) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const { cx, cy, size } = getCrop();
    const scale = natW / dw;
    const sx = (cx - ox) * scale;
    const sy = (cy - oy) * scale;
    const sw = size * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 72, 72);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 72, 72); 
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, 72, 72);
    ctx.restore();
  }, [getCrop]);

  // Init on image load
  useEffect(() => {
    const tmp = new Image();
    tmp.onload = () => {
      const nw = tmp.naturalWidth;
      const nh = tmp.naturalHeight;
      setNatSize({ w: nw, h: nh });
      const { size, cx, cy } = getCrop();
      const scale = Math.max(size / nw, size / nh);
      const dw = Math.round(nw * scale);
      const dh = Math.round(nh * scale);
      setDispSize({ w: dw, h: dh });
      const initOx = cx + (size - dw) / 2;
      const initOy = cy + (size - dh) / 2;
      setOffset({ x: initOx, y: initOy });
      setReady(true);
      setTimeout(() => drawPreview(initOx, initOy, dw, nw), 100);
    };
    tmp.src = imageSrc;
  }, [imageSrc, getCrop]);

  // Redraw preview on offset change
  useEffect(() => {
    if (ready) drawPreview(offset.x, offset.y, dispSize.w, natSize.w);
  }, [offset, ready]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const ox = dragStart.current.ox + (e.clientX - dragStart.current.x);
    const oy = dragStart.current.oy + (e.clientY - dragStart.current.y);
    setOffset(clamp(ox, oy, dispSize.w, dispSize.h));
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const ox = dragStart.current.ox + (e.touches[0].clientX - dragStart.current.x);
    const oy = dragStart.current.oy + (e.touches[0].clientY - dragStart.current.y);
    setOffset(clamp(ox, oy, dispSize.w, dispSize.h));
  };
  const stopDrag = () => { dragging.current = false; };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const { cx, cy, size } = getCrop();
    const scale = natSize.w / dispSize.w;
    const sx = (cx - offset.x) * scale;
    const sy = (cy - offset.y) * scale;
    const sw = size * scale;

    const canvas = document.createElement('canvas');
    canvas.width = OUT; 
    canvas.height = OUT;
    const ctx = canvas.getContext('2d')!;
    // ctx.beginPath();
    // ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    // ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, OUT, OUT);
    canvas.toBlob(blob => { if (blob) onCropComplete(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Crop Photo</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800"><X size={18} /></button>
        </div>

        {/* Crop area */}
        <div
          ref={containerRef}
          className="relative w-full h-64 bg-gray-900 rounded-xl overflow-hidden select-none"
          style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrag}
        >
          {ready && (
            <img
              ref={imgRef}
              src={imageSrc}
              draggable={false}
              className="absolute pointer-events-none"
              style={{ left: offset.x, top: offset.y, width: dispSize.w, height: dispSize.h }}
            />
          )}

          {/* SVG overlay with circular cutout */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <mask id="circleMask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="50%" cy="50%" r={CROP_SIZE / 2} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#circleMask)" />
            <circle cx="50%" cy="50%" r={CROP_SIZE / 2} fill="none" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        {/* Preview + actions */}
        <div className="flex items-center gap-4 mt-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-100">
            <canvas ref={canvasRef} width={72} height={72} className="w-full h-full" />
          </div>
          <p className="text-xs text-gray-500 flex-1">Drag the image to reposition inside the circle</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={!ready}
            className="flex-1 py-2.5 bg-[#980d0d] text-white rounded-lg text-sm hover:bg-[#7a0a0a] disabled:opacity-50"
          >
            Crop & Save
          </button>
        </div>

      </div>
    </div>
  );
}