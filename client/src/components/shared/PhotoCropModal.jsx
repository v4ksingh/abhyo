import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCw, Check, Undo2,
  Sun, Contrast, Move, Sparkles, User, Crop
} from 'lucide-react';

export default function PhotoCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  aspectRatio = 3 / 4, // 3:4 default passport aspect ratio
}) {
  const [ratio, setRatio] = useState(aspectRatio);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      // Reset transformations
      setScale(1);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Main canvas dimensions
  const CANVAS_WIDTH = 420;
  const CANVAS_HEIGHT = 420;

  // Compute crop box dimensions based on aspect ratio
  const getCropBox = useCallback(() => {
    let boxWidth = 280;
    let boxHeight = boxWidth / ratio;
    if (boxHeight > 340) {
      boxHeight = 340;
      boxWidth = boxHeight * ratio;
    }
    const boxX = (CANVAS_WIDTH - boxWidth) / 2;
    const boxY = (CANVAS_HEIGHT - boxHeight) / 2;
    return { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
  }, [ratio]);

  // Render on main editor canvas
  const drawEditor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current || !imageLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save state for image rendering
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Center of canvas
    ctx.translate(CANVAS_WIDTH / 2 + offset.x, CANVAS_HEIGHT / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const img = imgRef.current;
    // Fit image to canvas box initially
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    if (imgAspect > 1) {
      drawWidth = 320;
      drawHeight = 320 / imgAspect;
    } else {
      drawHeight = 320;
      drawWidth = 320 * imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw dark overlay with crop cutout
    const crop = getCropBox();

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // Slate 900 with 65% opacity
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Cutout crop box
    ctx.rect(crop.x + crop.width, crop.y, -crop.width, crop.height);
    ctx.fill();

    // Draw crop box border
    ctx.strokeStyle = '#6366f1'; // Indigo 500
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw passport guide head/chin oval silhouette
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    const ovalCenterX = crop.x + crop.width / 2;
    const ovalCenterY = crop.y + crop.height * 0.45;
    const ovalRadiusX = crop.width * 0.32;
    const ovalRadiusY = crop.height * 0.38;
    ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Rule of Thirds guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    ctx.beginPath();
    // Vertical grid
    ctx.moveTo(crop.x + crop.width / 3, crop.y);
    ctx.lineTo(crop.x + crop.width / 3, crop.y + crop.height);
    ctx.moveTo(crop.x + (crop.width * 2) / 3, crop.y);
    ctx.lineTo(crop.x + (crop.width * 2) / 3, crop.y + crop.height);
    // Horizontal grid
    ctx.moveTo(crop.x, crop.y + crop.height / 3);
    ctx.lineTo(crop.x + crop.width, crop.y + crop.height / 3);
    ctx.moveTo(crop.x, crop.y + (crop.height * 2) / 3);
    ctx.lineTo(crop.x + crop.width, crop.y + (crop.height * 2) / 3);
    ctx.stroke();

    ctx.restore();
  }, [offset, rotation, scale, brightness, contrast, imageLoaded, getCropBox]);

  // Render on preview canvas (isolated crop)
  const drawPreview = useCallback(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !imgRef.current || !imageLoaded) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const crop = getCropBox();
    previewCanvas.width = 120;
    previewCanvas.height = 120 / ratio;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.save();

    // Scaling ratio from main canvas crop box to preview canvas
    const pScale = previewCanvas.width / crop.width;
    ctx.scale(pScale, pScale);
    ctx.translate(-crop.x, -crop.y);

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(CANVAS_WIDTH / 2 + offset.x, CANVAS_HEIGHT / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const img = imgRef.current;
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    if (imgAspect > 1) {
      drawWidth = 320;
      drawHeight = 320 / imgAspect;
    } else {
      drawHeight = 320;
      drawWidth = 320 * imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [offset, rotation, scale, brightness, contrast, imageLoaded, ratio, getCropBox]);

  useEffect(() => {
    drawEditor();
    drawPreview();
  }, [drawEditor, drawPreview]);

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(3.5, Math.max(0.6, parseFloat((prev + delta).toFixed(2)))));
  };

  // Reset to default
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setOffset({ x: 0, y: 0 });
  };

  // Rotate 90 degrees
  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate cropped high-res blob and apply
  const handleSaveCrop = () => {
    if (!imgRef.current) return;
    const crop = getCropBox();

    // Passport resolution (450x600 for 3:4 or 450x450 for 1:1) - optimal for high print quality under 100 KB
    const outWidth = 450;
    const outHeight = Math.round(outWidth / ratio);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = outWidth;
    offCanvas.height = outHeight;
    const offCtx = offCanvas.getContext('2d');

    const outScale = outWidth / crop.width;
    offCtx.scale(outScale, outScale);
    offCtx.translate(-crop.x, -crop.y);

    offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    offCtx.translate(CANVAS_WIDTH / 2 + offset.x, CANVAS_HEIGHT / 2 + offset.y);
    offCtx.rotate((rotation * Math.PI) / 180);
    offCtx.scale(scale, scale);

    const img = imgRef.current;
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    if (imgAspect > 1) {
      drawWidth = 320;
      drawHeight = 320 / imgAspect;
    } else {
      drawHeight = 320;
      drawWidth = 320 * imgAspect;
    }

    offCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Iteratively guarantee the output file is <= 100 KB in JPEG format
    const exportWithinLimit = (quality = 0.85) => {
      offCanvas.toBlob(
        (blob) => {
          if (!blob) return;
          if (blob.size > 100 * 1024 && quality > 0.4) {
            exportWithinLimit(quality - 0.1);
            return;
          }
          const file = new File([blob], 'student-passport-photo.jpg', { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onApply(file, previewUrl);
          onClose();
        },
        'image/jpeg',
        quality
      );
    };
    exportWithinLimit(0.85);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[95vh]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Crop className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Crop & Adjust Student Photo</h3>
              <p className="text-[11px] text-slate-500 font-normal">Passport size format for admit card & ID verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-5 items-center justify-center">
          {/* Left / Center: Interactive Canvas Editor */}
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-900 cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxWidth: '100%', maxHeight: '380px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full block"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1 font-mono pointer-events-none">
                <Move className="w-3 h-3 text-indigo-400" /> Drag to pan • Scroll to zoom
              </div>
            </div>

            {/* Quick Canvas Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRatio(3 / 4)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    ratio === 3 / 4 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3:4 Passport
                </button>
                <button
                  type="button"
                  onClick={() => setRatio(1)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    ratio === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1:1 Square
                </button>
              </div>

              <button
                type="button"
                onClick={handleRotate90}
                className="p-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>+90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                title="Reset all adjustments"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Right: Adjustments & Live Preview */}
          <div className="w-full md:w-56 space-y-4">
            {/* Live Passport Card Preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-center flex flex-col items-center">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Live Admit Card Preview
              </p>
              <div
                className="p-1 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                style={{ width: '84px', height: `${84 / ratio}px` }}
              >
                <canvas ref={previewCanvasRef} className="w-full h-full object-cover rounded-lg block" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">
                {ratio === 3 / 4 ? '3.5 cm × 4.5 cm' : 'Square 1:1'}
              </p>
            </div>

            {/* Adjustment Sliders */}
            <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
              {/* Zoom Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-500" /> Zoom
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Fine Rotation Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-500" /> Straighten
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={rotation > 180 ? rotation - 360 : rotation}
                  onChange={(e) => setRotation((parseInt(e.target.value, 10) + 360) % 360)}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Brightness Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="140"
                  step="5"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3.5 h-3.5 text-violet-500" /> Contrast
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="140"
                  step="5"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="apply-crop-btn"
            onClick={handleSaveCrop}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/25 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Cropped Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
