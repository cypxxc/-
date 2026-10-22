"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProvinceData } from "@/src/data/provinces";
import { Plus, Minus, RotateCcw, Sparkles } from "lucide-react";

interface ThailandMapProps {
  provinces: ProvinceData[];
  visitedProvinceIds: Set<string>;
  selectedProvinceId: string | null;
  onSelectProvince: (province: ProvinceData) => void;
  onToggleVisited: (provinceId: string) => void;
}

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 6;

export function ThailandMap({
  provinces,
  visitedProvinceIds,
  selectedProvinceId,
  onSelectProvince,
  onToggleVisited,
}: ThailandMapProps) {
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceData | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformLayerRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const zoomDisplayRef = useRef<HTMLSpanElement | null>(null);

  // Interaction State - Pure Native Performance
  const stateRef = useRef({
    scale: 1,
    x: 0,
    y: 15,

    isDragging: false,
    dragStartMouse: { x: 0, y: 0 },
    dragStartPos: { x: 0, y: 15 },
    hasMoved: false,

    wheelRafId: null as number | null,
    motionTimeout: null as NodeJS.Timeout | null,
  });

  const mouseRafId = useRef<number | null>(null);

  // Instant zero-conflict transform (No CSS transition fight)
  const applyTransform = useCallback((inMotion: boolean = false) => {
    const s = stateRef.current;
    if (!transformLayerRef.current) return;

    transformLayerRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${s.scale})`;

    if (inMotion) {
      transformLayerRef.current.style.pointerEvents = "none";
    } else {
      transformLayerRef.current.style.pointerEvents = "auto";
    }

    if (zoomDisplayRef.current) {
      zoomDisplayRef.current.textContent = `${Math.round(s.scale * 100)}%`;
    }
  }, []);

  // Frame-Paced Smooth Wheel Zoom with requestAnimationFrame
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const clientX = e.clientX;
      const clientY = e.clientY;
      const rawDelta = e.deltaY;

      const s = stateRef.current;
      if (s.wheelRafId) cancelAnimationFrame(s.wheelRafId);

      s.wheelRafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const mouseX = clientX - rect.left - rect.width / 2;
        const mouseY = clientY - rect.top - rect.height / 2;

        const factor = rawDelta < 0 ? 1.10 : 0.90; // Natural proportional zoom
        const oldScale = s.scale;
        const newScale = Math.min(Math.max(oldScale * factor, MIN_ZOOM), MAX_ZOOM);
        if (newScale === oldScale) return;

        const scaleRatio = newScale / oldScale;
        s.x = mouseX - (mouseX - s.x) * scaleRatio;
        s.y = mouseY - (mouseY - s.y) * scaleRatio;
        s.scale = newScale;

        // Bounding limits
        s.x = Math.max(-800, Math.min(800, s.x));
        s.y = Math.max(-1000, Math.min(1000, s.y));

        applyTransform(true);

        if (s.motionTimeout) clearTimeout(s.motionTimeout);
        s.motionTimeout = setTimeout(() => {
          applyTransform(false);
        }, 80);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (stateRef.current.wheelRafId) cancelAnimationFrame(stateRef.current.wheelRafId);
    };
  }, [applyTransform]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const s = stateRef.current;
    s.isDragging = true;
    s.hasMoved = false;
    s.dragStartMouse = { x: e.clientX, y: e.clientY };
    s.dragStartPos = { x: s.x, y: s.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    const s = stateRef.current;

    // Spotlight cursor update
    if (mouseRafId.current) cancelAnimationFrame(mouseRafId.current);
    mouseRafId.current = requestAnimationFrame(() => {
      if (spotlightRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        spotlightRef.current.style.transform = `translate3d(${clientX - rect.left - 400}px, ${clientY - rect.top - 400}px, 0)`;
      }
    });

    if (!s.isDragging) return;

    const dx = clientX - s.dragStartMouse.x;
    const dy = clientY - s.dragStartMouse.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      s.hasMoved = true;
    }

    s.x = s.dragStartPos.x + dx;
    s.y = s.dragStartPos.y + dy;

    applyTransform(true);
  };

  const handleMouseUp = () => {
    const s = stateRef.current;
    s.isDragging = false;
    applyTransform(false);
  };

  const zoomIn = () => {
    const s = stateRef.current;
    s.scale = Math.min(s.scale * 1.3, MAX_ZOOM);
    applyTransform(false);
  };

  const zoomOut = () => {
    const s = stateRef.current;
    s.scale = Math.max(s.scale * 0.76, MIN_ZOOM);
    applyTransform(false);
  };

  const resetTransform = () => {
    const s = stateRef.current;
    s.x = 0;
    s.y = 15;
    s.scale = 1;
    applyTransform(false);
  };

  useEffect(() => {
    return () => {
      if (mouseRafId.current) cancelAnimationFrame(mouseRafId.current);
    };
  }, []);

  const isHoverVisited = hoveredProvince ? visitedProvinceIds.has(hoveredProvince.id) : null;
  const spotlightColor =
    isHoverVisited === true
      ? "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)"
      : isHoverVisited === false
      ? "radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.03) 45%, transparent 70%)"
      : "radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0.02) 45%, transparent 70%)";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full select-none overflow-hidden bg-[#04060b] cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Hardware Accelerated Spotlight */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full pointer-events-none will-change-transform"
        style={{
          background: spotlightColor,
          transform: "translate3d(-200px, -200px, 0)",
        }}
      />

      {/* 2. Soft Ambient Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#04060b_95%)]" />

      {/* Floating Hover Indicator */}
      {hoveredProvince && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-none flex items-center gap-3 transition-all animate-in fade-in zoom-in-95">
          <span className="text-lg leading-none">{hoveredProvince.icon}</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
              {hoveredProvince.nameTh}
              <span className="text-xs text-slate-400 font-normal">
                ({hoveredProvince.nameEn})
              </span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {hoveredProvince.landmark} • {hoveredProvince.region}
            </span>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
              visitedProvinceIds.has(hoveredProvince.id)
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                : "bg-white/5 text-slate-400"
            }`}
          >
            {visitedProvinceIds.has(hoveredProvince.id) ? "CHECKED" : "UNVISITED"}
          </span>
        </div>
      )}

      {/* Controls */}
      <div
        className="fixed bottom-8 right-8 z-30 flex flex-col gap-2 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomIn}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
          title="ซูมเข้า"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
          title="ซูมออก"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-white/10 my-0.5" />
        <button
          onClick={resetTransform}
          className="p-2.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90"
          title="รีเซ็ตตำแหน่งกึ่งกลาง"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Scale Indicator */}
      <div className="fixed bottom-8 left-8 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/70 backdrop-blur-xl border border-white/10 text-xs font-mono text-slate-400 pointer-events-none shadow-xl">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>77 LANDMARKS</span>
        <span className="text-slate-600">|</span>
        <span ref={zoomDisplayRef} className="text-emerald-400 font-bold">100%</span>
      </div>

      {/* Bottom Center Legend Pill */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-5 text-xs font-mono px-5 py-2 rounded-full bg-slate-900/75 backdrop-blur-xl border border-white/10 text-slate-400 shadow-xl pointer-events-none">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />{" "}
          VISITED
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />{" "}
          UNEXPLORED
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />{" "}
          SELECTED
        </span>
      </div>

      {/* Pure Direct GPU Transform Layer - Zero CSS Delay */}
      <div
        ref={transformLayerRef}
        className="w-full h-full flex items-center justify-center origin-center pointer-events-none will-change-transform"
        style={{
          transform: "translate3d(0px, 15px, 0) scale(1)",
        }}
      >
        <svg
          viewBox="0 0 600 900"
          style={{
            touchAction: "none",
          }}
          className="w-full h-full max-h-[90vh] select-none pointer-events-auto"
        >
          {/* Layer 1: Province Polygons */}
          <g>
            {provinces.map((prov) => {
              const isVisited = visitedProvinceIds.has(prov.id);
              const isSelected = selectedProvinceId === prov.id;
              const isHovered = hoveredProvince?.id === prov.id;

              let fill = "#0c111d";
              let stroke = "#1e293b";
              let strokeWidth = "0.8";

              if (isVisited) {
                fill = "#059669";
                stroke = "#10b981";
              }
              if (isSelected) {
                fill = "#0284c7";
                stroke = "#38bdf8";
                strokeWidth = "2.2";
              } else if (isHovered) {
                stroke = isVisited ? "#34d399" : "#38bdf8";
                strokeWidth = "1.8";
              }

              return (
                <path
                  key={prov.id}
                  d={prov.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="cursor-pointer hover:brightness-125 transition-colors duration-75"
                  onMouseEnter={() => setHoveredProvince(prov)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (stateRef.current.hasMoved) return;
                    onSelectProvince(prov);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisited(prov.id);
                  }}
                />
              );
            })}
          </g>

          {/* Layer 2: Signature Province Landmark Icons & Badges */}
          <g className="pointer-events-none">
            {provinces.map((prov) => {
              if (!prov.centroid) return null;
              const [cx, cy] = prov.centroid;
              const isVisited = visitedProvinceIds.has(prov.id);
              const isHovered = hoveredProvince?.id === prov.id;

              return (
                <g
                  key={`icon-${prov.id}`}
                  transform={`translate(${cx}, ${cy})`}
                >
                  <circle
                    r={isHovered ? 13 : 8.5}
                    fill={isVisited ? "#047857" : "#1e293b"}
                    stroke={isVisited ? "#34d399" : "#334155"}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isHovered ? "12" : "9"}
                    className="select-none"
                  >
                    {prov.icon}
                  </text>
                  <text
                    y={isHovered ? 18 : 14}
                    textAnchor="middle"
                    fill={isHovered ? "#38bdf8" : isVisited ? "#6ee7b7" : "#cbd5e1"}
                    fontSize={isHovered ? "9" : "7"}
                    fontWeight={isHovered ? "bold" : "500"}
                    className="select-none"
                  >
                    {prov.nameTh}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
