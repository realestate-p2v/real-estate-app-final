"use client";
import { useState, useRef, useEffect } from "react";
import { GateOverlay } from "@/components/gate-overlay";

/* ─── helpers ─── */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function hexToRgba(hex, a) { const c = hex.replace("#",""); if (c.length < 6) return `rgba(0,0,0,${a})`; return `rgba(${parseInt(c.substring(0,2),16)},${parseInt(c.substring(2,4),16)},${parseInt(c.substring(4,6),16)},${a})`; }

/* ─── text measurement helper ─── */
let _measureCanvas = null;
function measureTextWidth(text, fontSize, fontWeight = "700", fontFamily = "Helvetica Neue, Arial, sans-serif") {
  if (!_measureCanvas) _measureCanvas = document.createElement("canvas");
  const ctx = _measureCanvas.getContext("2d");
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

/* ─── palettes ─── */
const BROKERAGE_COLORS = [
  {hex:"#ffffff",label:"White"},{hex:"#b40101",label:"KW Red"},{hex:"#666666",label:"KW Gray"},
  {hex:"#003399",label:"CB Blue"},{hex:"#012169",label:"CB Navy"},{hex:"#003da5",label:"RM Blue"},
  {hex:"#dc1c2e",label:"RM Red"},{hex:"#b5985a",label:"C21 Gold"},{hex:"#1c1c1c",label:"C21 Black"},
  {hex:"#000000",label:"CMP Black"},{hex:"#333333",label:"CMP Dark"},{hex:"#002349",label:"SIR Blue"},
  {hex:"#1a1a1a",label:"SIR Black"},{hex:"#552448",label:"BH Purple"},{hex:"#2d1a33",label:"BH Dark"},
  {hex:"#1c3f6e",label:"EXP Blue"},{hex:"#006341",label:"HH Green"},{hex:"#003d28",label:"HH Dk Green"},
  {hex:"#4c8c2b",label:"BHG Green"},{hex:"#d4272e",label:"EXT Red"},{hex:"#e31937",label:"ERA Red"},
  {hex:"#273691",label:"ERA Blue"},{hex:"#a02021",label:"RF Red"},
];
const ACCENT_COLORS = ["#facc15","#ef4444","#3b82f6","#22c55e","#f97316","#a855f7","#06b6d4","#ec4899","#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#71717a"];

const TOOLS = [
  { id: "select", label: "Grab", icon: "✋" },
  { id: "polygon", label: "Lot Lines", icon: "⬡" },
  { id: "rect", label: "Rectangle", icon: "▭" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "pin", label: "Pin", icon: "📍" },
  { id: "label", label: "Label", icon: "T" },
  { id: "measure", label: "Measure", icon: "📐" },
  { id: "arrow", label: "Arrow", icon: "➤" },
];

const TOOL_LABELS = { polygon:"Lot Lines", rect:"Rectangle", line:"Line", pin:"Pin", label:"Label", measure:"Measure", arrow:"Arrow", select:"Grab" };

/* ─── tiny components ─── */
function PinSvg({ color, size, logo, text, shapeId }) {
  const s = size || 200;
  const clipId = `pc-${shapeId}`;
  const filtId = `pf-${shapeId}`;
  return (
    <g>
      <defs>
        <filter id={filtId} x="-50%" y="-20%" width="200%" height="200%"><feDropShadow dx="0" dy={s*0.06} stdDeviation={s*0.08} floodColor="rgba(0,0,0,0.5)"/></filter>
        {logo && <clipPath id={clipId}><circle cx={s/2} cy={s*0.38} r={s*0.24}/></clipPath>}
      </defs>
      <path d={`M${s/2} ${s} C${s/2} ${s} ${s*0.05} ${s*0.55} ${s*0.05} ${s*0.38} C${s*0.05} ${s*0.15} ${s*0.2} 0 ${s/2} 0 C${s*0.8} 0 ${s*0.95} ${s*0.15} ${s*0.95} ${s*0.38} C${s*0.95} ${s*0.55} ${s/2} ${s} ${s/2} ${s}Z`}
        fill={color} filter={`url(#${filtId})`} stroke="rgba(0,0,0,0.15)" strokeWidth={Math.max(1, s*0.012)}/>
      <circle cx={s/2} cy={s*0.38} r={s*0.28} fill="rgba(255,255,255,0.18)"/>
      {logo ? <image href={logo} x={s/2-s*0.24} y={s*0.38-s*0.24} width={s*0.48} height={s*0.48} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice"/>
        : <circle cx={s/2} cy={s*0.38} r={s*0.18} fill="rgba(255,255,255,0.35)"/>}
      {text && <text x={s/2} y={s+s*0.25} textAnchor="middle" fill="#fff" fontSize={Math.max(18,s*0.18)} fontWeight="800" fontFamily="Helvetica Neue, Arial, sans-serif" stroke="rgba(0,0,0,0.5)" strokeWidth={Math.max(3,s*0.025)} paintOrder="stroke">{text}</text>}
    </g>
  );
}

function Section({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "11px 16px", background: "none", border: "none",
        cursor: "pointer", color: "rgba(255,255,255,0.85)",
        fontSize: 11, fontWeight: 700, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        <span style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>▾</span>
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", padding: 0, background: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 90, padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#e4e4ea", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
    </div>
  );
}

function SwatchGrid({ colors, current, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {colors.map(c => {
        const hex = typeof c === "string" ? c : c.hex;
        const label = typeof c === "string" ? hex : c.label;
        const active = current === hex;
        return (
          <div key={hex} onClick={() => onSelect(hex)} title={label} style={{
            width: 26, height: 26, borderRadius: 6, backgroundColor: hex, cursor: "pointer",
            border: active ? "2px solid #6366f1" : (hex === "#ffffff" || hex === "#000000") ? "1px solid rgba(128,128,128,0.3)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: active ? "0 0 0 1px rgba(99,102,241,0.4)" : "none",
            transition: "all 0.12s",
          }} />
        );
      })}
    </div>
  );
}

function Slider({ min, max, value, onChange, suffix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: "#6366f1" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#e4e4ea", minWidth: 38, textAlign: "right" }}>{value}{suffix || ""}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function DroneMark({ agentLogo, isLensSubscriber = false, gateType = "buy_video" }) {
  const [photo, setPhoto] = useState(null);
  const [natW, setNatW] = useState(1920);
  const [natH, setNatH] = useState(1080);
  const [shapes, setShapes] = useState([]);
  const [selId, setSelId] = useState(null);
  const [tool, setTool] = useState("select");
  const [drawPts, setDrawPts] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectStart, setRectStart] = useState(null);
  const [rectCur, setRectCur] = useState(null);
  const [lineStart, setLineStart] = useState(null);
  const [lineCur, setLineCur] = useState(null);
  const [drag, setDrag] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const histRef = useRef({ stack: [[]], idx: 0 });
  const [zoom, setZoom] = useState(100);
  const [toast, setToast] = useState(null);
  const [showGate, setShowGate] = useState(false);

  /* ── STYLE REF (mutable ref pattern — DO NOT refactor to useState) ── */
  const sty = useRef({ color: "#ffffff", width: 4, fill: 0.12, pinColor: "#ef4444", pinSize: 200, pinText: "", labelText: "", labelFs: 28, labelColor: "#ffffff", labelBgMode: "solid", logo: agentLogo || null, unit: "m" });
  const [uiColor, setUiColor] = useState("#ffffff");
  const [uiWidth, setUiWidth] = useState(4);
  const [uiFill, setUiFill] = useState(12);
  const [uiPinColor, setUiPinColor] = useState("#ef4444");
  const [uiPinSize, setUiPinSize] = useState(200);
  const [uiPinText, setUiPinText] = useState("");
  const [uiLabelText, setUiLabelText] = useState("");
  const [uiLabelFs, setUiLabelFs] = useState(28);
  const [uiLabelColor, setUiLabelColor] = useState("#ffffff");
  const [uiLabelBgMode, setUiLabelBgMode] = useState("solid");
  const [uiLogoKey, setUiLogoKey] = useState(0);

  function setColor(v) { sty.current.color = v; setUiColor(v); }
  function setWidth(v) { sty.current.width = v; setUiWidth(v); }
  function setFill(v) { sty.current.fill = v / 100; setUiFill(v); }
  function setPinColor(v) { sty.current.pinColor = v; setUiPinColor(v); }
  function setPinSize(v) { sty.current.pinSize = v; setUiPinSize(v); }
  function setPinText(v) { sty.current.pinText = v; setUiPinText(v); }
  function setLabelText(v) { sty.current.labelText = v; setUiLabelText(v); }
  function setLabelFs(v) { sty.current.labelFs = v; setUiLabelFs(v); }
  function setLabelColor(v) { sty.current.labelColor = v; setUiLabelColor(v); }
  function setLabelBgMode(v) { sty.current.labelBgMode = v; setUiLabelBgMode(v); }

  useEffect(() => {
    if (!agentLogo) return;
    // Convert URL to base64 so it inlines in SVG for export
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        const dataUrl = c.toDataURL("image/png");
        sty.current.logo = dataUrl;
        setUiLogoKey(k => k + 1);
      } catch (e) {
        // CORS failed, use URL directly as fallback
        sty.current.logo = agentLogo;
        setUiLogoKey(k => k + 1);
      }
    };
    img.onerror = () => {
      sty.current.logo = agentLogo;
      setUiLogoKey(k => k + 1);
    };
    img.src = agentLogo;
  }, [agentLogo]);

  const svgRef = useRef(null);
  const fileRef = useRef(null);
  const logoRef = useRef(null);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  /* ── HISTORY ── */
  function pushHist(ns) { const h = histRef.current; h.stack = [...h.stack.slice(0, h.idx + 1), ns]; h.idx = h.stack.length - 1; }
  function undo() { const h = histRef.current; if (h.idx > 0) { h.idx--; setShapes(h.stack[h.idx]); } }
  function redo() { const h = histRef.current; if (h.idx < h.stack.length - 1) { h.idx++; setShapes(h.stack[h.idx]); } }
  function addShape(s) { setShapes(prev => { const ns = [...prev, s]; pushHist(ns); return ns; }); }
  function updateShape(id, u) { setShapes(prev => { const ns = prev.map(s => s.id === id ? { ...s, ...u } : s); pushHist(ns); return ns; }); }
  function updateLive(id, u) { setShapes(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); }
  function deleteShape(id) { setShapes(prev => { const ns = prev.filter(s => s.id !== id); pushHist(ns); return ns; }); if (selId === id) setSelId(null); }
  function clearAll() { setShapes([]); setSelId(null); histRef.current = { stack: [[]], idx: 0 }; }

  function getPos(e) { const svg = svgRef.current; if (!svg) return { x: 0, y: 0 }; const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) * (natW / r.width), y: (e.clientY - r.top) * (natH / r.height) }; }

  /* ── CANVAS EVENTS ── */
  function onCanvasClick(e) {
    if (e.target.closest("[data-handle]")) return;
    if (e.target.closest("[data-sid]") && tool === "select") return;
    const p = getPos(e), s = sty.current;
    if (tool === "polygon") { if (!isDrawing) { setIsDrawing(true); setDrawPts([p]); } else { const f = drawPts[0], d = Math.sqrt((p.x - f.x) ** 2 + (p.y - f.y) ** 2); if (drawPts.length >= 3 && d < 30 * (natW / 1000)) { addShape({ id: uid(), type: "polygon", points: [...drawPts], color: s.color, width: s.width, fillOpacity: s.fill }); setIsDrawing(false); setDrawPts([]); } else setDrawPts([...drawPts, p]); } }
    else if (tool === "pin") addShape({ id: uid(), type: "pin", x: p.x, y: p.y, color: s.pinColor, size: s.pinSize, logo: s.logo });
    else if (tool === "label") { if (!s.labelText.trim()) { notify("Type label text first"); return; } addShape({ id: uid(), type: "label", x: p.x, y: p.y, text: s.labelText, fontSize: s.labelFs, color: s.labelColor, bgMode: s.labelBgMode }); }
    else if (tool === "select") setSelId(null);
  }
  function onMouseDown(e) { const p = getPos(e); if (tool === "rect") { setRectStart(p); setRectCur(p); } else if (tool === "line" || tool === "measure" || tool === "arrow") { setLineStart(p); setLineCur(p); } }
  function onMouseMove(e) {
    const p = getPos(e);
    if (tool === "rect" && rectStart) setRectCur(p);
    else if ((tool === "line" || tool === "measure" || tool === "arrow") && lineStart) setLineCur(p);
    else if (drag && dragStart) {
      const dx = p.x - dragStart.x, dy = p.y - dragStart.y, shape = shapes.find(sh => sh.id === drag.sid);
      if (!shape) return;
      if (drag.hi !== undefined) { if (shape.points) { const np = [...shape.points]; np[drag.hi] = { x: p.x, y: p.y }; updateLive(drag.sid, { points: np }); } else if (drag.hi === 0) updateLive(drag.sid, { x1: p.x, y1: p.y }); else updateLive(drag.sid, { x2: p.x, y2: p.y }); }
      else { if (shape.points) updateLive(drag.sid, { points: shape.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy })) }); else if (shape.x1 !== undefined) updateLive(drag.sid, { x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy }); else updateLive(drag.sid, { x: (shape.x || 0) + dx, y: (shape.y || 0) + dy }); }
      setDragStart(p);
    }
    if (tool === "polygon" && isDrawing) setLineCur(p);
  }
  function onMouseUp(e) {
    const p = getPos(e), s = sty.current;
    if (tool === "rect" && rectStart) { const x1 = Math.min(rectStart.x, p.x), y1 = Math.min(rectStart.y, p.y), x2 = Math.max(rectStart.x, p.x), y2 = Math.max(rectStart.y, p.y); if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) addShape({ id: uid(), type: "rect", points: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }], color: s.color, width: s.width, fillOpacity: s.fill }); setRectStart(null); setRectCur(null); }
    else if ((tool === "line" || tool === "arrow") && lineStart) { if (Math.sqrt((p.x - lineStart.x) ** 2 + (p.y - lineStart.y) ** 2) > 10) addShape({ id: uid(), type: tool === "arrow" ? "arrow" : "line", x1: lineStart.x, y1: lineStart.y, x2: p.x, y2: p.y, color: s.color, width: s.width }); setLineStart(null); setLineCur(null); }
    else if (tool === "measure" && lineStart) { if (Math.sqrt((p.x - lineStart.x) ** 2 + (p.y - lineStart.y) ** 2) > 10) addShape({ id: uid(), type: "measure", x1: lineStart.x, y1: lineStart.y, x2: p.x, y2: p.y, color: s.color, width: s.width, measureText: "", unit: s.unit }); setLineStart(null); setLineCur(null); }
    if (drag) { pushHist([...shapes]); setDrag(null); setDragStart(null); }
  }
  function onShapeDown(e, id) { e.stopPropagation(); if (tool === "select") { setSelId(id); setDrag({ sid: id }); setDragStart(getPos(e)); } }
  function onHandleDown(e, sid, hi) { e.stopPropagation(); setSelId(sid); setDrag({ sid, hi }); setDragStart(getPos(e)); }
  function onDblClick() { if (tool === "polygon" && isDrawing && drawPts.length >= 3) { const s = sty.current; addShape({ id: uid(), type: "polygon", points: [...drawPts], color: s.color, width: s.width, fillOpacity: s.fill }); setIsDrawing(false); setDrawPts([]); } }
  function cancelDraw() { setIsDrawing(false); setDrawPts([]); setRectStart(null); setRectCur(null); setLineStart(null); setLineCur(null); }

  useEffect(() => { function h(e) { if (e.key === "Escape") cancelDraw(); if ((e.key === "Delete" || e.key === "Backspace") && selId && !e.target.closest("input,textarea")) { e.preventDefault(); deleteShape(selId); } if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); } if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); } } window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); });

  function onPhotoUpload(e) { const f = e.target.files?.[0]; if (!f) return; const url = URL.createObjectURL(f); const img = new Image(); img.onload = () => { setNatW(img.naturalWidth); setNatH(img.naturalHeight); setPhoto(url); setShapes([]); histRef.current = { stack: [[]], idx: 0 }; }; img.src = url; }
  function onLogoUpload(e) { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (ev) => { sty.current.logo = ev.target.result; setUiLogoKey(k => k + 1); }; reader.readAsDataURL(f); }

  async function doExport() {
    if (!isLensSubscriber) { setShowGate(true); return; }
    if (!photo) { notify("Upload photo first"); return; }
    setSelId(null); await new Promise(r => setTimeout(r, 50));
    try {
      const svg = svgRef.current; if (!svg) return;
      const MAX_W = 3840;
      const MAX_H = 2160;
      let outW = natW, outH = natH;
      if (outW > MAX_W) { const s = MAX_W / outW; outW = MAX_W; outH = Math.round(outH * s); }
      if (outH > MAX_H) { const s = MAX_H / outH; outH = MAX_H; outW = Math.round(outW * s); }
      const expScale = outW / natW;
      const canvas = document.createElement("canvas"); canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext("2d");
      // 1. Draw photo
      const bgImg = new Image(); bgImg.crossOrigin = "anonymous";
      await new Promise((res, rej) => { bgImg.onload = res; bgImg.onerror = rej; bgImg.src = photo; });
      ctx.drawImage(bgImg, 0, 0, outW, outH);
      // 2. Clone SVG, remove <image> elements (they break in SVG-as-image context)
      const svgClone = svg.cloneNode(true);
      svgClone.querySelectorAll("image").forEach(el => el.remove());
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const svgImg = new Image();
      await new Promise((res, rej) => { svgImg.onload = res; svgImg.onerror = rej; svgImg.src = svgUrl; });
      ctx.drawImage(svgImg, 0, 0, outW, outH); URL.revokeObjectURL(svgUrl);
      // 3. Draw pin logos directly on canvas
      for (const shape of shapes) {
        if (shape.type === "pin" && shape.logo) {
          const sz = shape.size || 200;
          const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
          try {
            await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; logoImg.src = shape.logo; });
            const cx = ((shape.x || 0)) * expScale;
            const cy = ((shape.y || 0) - sz + sz * 0.38) * expScale;
            const r = sz * 0.24 * expScale;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
            const imgW = sz * 0.48 * expScale;
            ctx.drawImage(logoImg, cx - r, cy - r, imgW, imgW);
            ctx.restore();
          } catch (e) { /* skip broken logos */ }
        }
      }
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.82));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.download = `drone-${Date.now()}.jpg`; link.href = url; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      notify("Exported!");
    } catch (err) { console.error(err); notify("Export failed"); }
  }

  /* ── SELECTED SHAPE ── */
  const sel = shapes.find(s => s.id === selId);
  function editSel(prop, val) { if (!sel) return; updateShape(sel.id, { [prop]: val }); }
  function duplicateSel() {
    if (!sel) return;
    const n = { ...sel, id: uid() };
    if (n.points) n.points = n.points.map(p => ({ x: p.x + 30, y: p.y + 30 }));
    if (n.x !== undefined) { n.x += 30; n.y = (n.y || 0) + 30; }
    if (n.x1 !== undefined) { n.x1 += 30; n.y1 = (n.y1 || 0) + 30; n.x2 += 30; n.y2 = (n.y2 || 0) + 30; }
    addShape(n);
  }

  function selectTool(id) { setTool(id); cancelDraw(); if (id !== "select") setSelId(null); }

  /* ── DISPLAY ── */
  const isEditing = tool === "select" && sel;
  const editableColor = isEditing ? sel.color : uiColor;
  const editableWidth = isEditing ? (sel.width || 4) : uiWidth;
  const editableFill = isEditing ? Math.round((sel.fillOpacity || 0) * 100) : uiFill;
  function handleColorChange(v) { if (isEditing) editSel("color", v); else setColor(v); }
  function handleWidthChange(v) { if (isEditing) editSel("width", v); else setWidth(v); }
  function handleFillChange(v) { if (isEditing) editSel("fillOpacity", v / 100); else setFill(v); }
  function handlePinColorChange(v) { if (isEditing && sel?.type === "pin") editSel("color", v); else setPinColor(v); }

  const aspect = natW / natH;
  const hR = Math.max(10, Math.min(16, natW * 0.007));

  /* ── RENDER SHAPE ── */
  function renderShape(shape) {
    const isSel = shape.id === selId;
    const cur = tool === "select" ? "move" : "default";
    if (shape.type === "polygon" || shape.type === "rect") {
      const pts = shape.points.map(p => `${p.x},${p.y}`).join(" ");
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e => onShapeDown(e, shape.id)} style={{ cursor: cur }}>
        <polygon points={pts} fill={hexToRgba(shape.color, shape.fillOpacity || 0)} stroke={shape.color} strokeWidth={shape.width} strokeLinejoin="round" />
        <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={Math.max(24, (shape.width || 4) + 16)} />
        {isSel && shape.points.map((p, i) => (<circle key={i} data-handle cx={p.x} cy={p.y} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{ cursor: "grab" }} onMouseDown={e => onHandleDown(e, shape.id, i)} />))}
      </g>);
    }
    if (shape.type === "line" || shape.type === "arrow") {
      const mId = `arr-${shape.id}`;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e => onShapeDown(e, shape.id)} style={{ cursor: cur }}>
        {shape.type === "arrow" && <defs><marker id={mId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill={shape.color} /></marker></defs>}
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round" markerEnd={shape.type === "arrow" ? `url(#${mId})` : undefined} />
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth={Math.max(24, (shape.width || 4) + 16)} />
        {isSel && <><circle data-handle cx={shape.x1} cy={shape.y1} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{ cursor: "grab" }} onMouseDown={e => onHandleDown(e, shape.id, 0)} /><circle data-handle cx={shape.x2} cy={shape.y2} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{ cursor: "grab" }} onMouseDown={e => onHandleDown(e, shape.id, 1)} /></>}
      </g>);
    }
    if (shape.type === "measure") {
      const dx = shape.x2 - shape.x1, dy = shape.y2 - shape.y1, dist = Math.sqrt(dx * dx + dy * dy);
      const mx = (shape.x1 + shape.x2) / 2, my = (shape.y1 + shape.y2) / 2, ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const txt = shape.measureText || "";
      const fs = shape.measureFs || Math.max(22, Math.min(40, dist * 0.08)), tL = Math.max(14, dist * 0.04), pX = -dy / dist * tL, pY = dx / dist * tL;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e => onShapeDown(e, shape.id)} style={{ cursor: cur }}>
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round" />
        <line x1={shape.x1 + pX} y1={shape.y1 + pY} x2={shape.x1 - pX} y2={shape.y1 - pY} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round" />
        <line x1={shape.x2 + pX} y1={shape.y2 + pY} x2={shape.x2 - pX} y2={shape.y2 - pY} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round" />
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth={Math.max(24, (shape.width || 4) + 16)} />
        {txt && <g transform={`translate(${mx},${my - 8})`}><text textAnchor="middle" fill={shape.color} fontSize={fs} fontWeight="800" fontFamily="Helvetica Neue, sans-serif" stroke="rgba(0,0,0,0.5)" strokeWidth="4" paintOrder="stroke" transform={ang > 90 || ang < -90 ? `rotate(${ang + 180})` : `rotate(${ang})`}>{txt}</text></g>}
        {isSel && <><circle data-handle cx={shape.x1} cy={shape.y1} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{ cursor: "grab" }} onMouseDown={e => onHandleDown(e, shape.id, 0)} /><circle data-handle cx={shape.x2} cy={shape.y2} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{ cursor: "grab" }} onMouseDown={e => onHandleDown(e, shape.id, 1)} /></>}
      </g>);
    }
    if (shape.type === "pin") {
      const sz = shape.size || 200;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e => onShapeDown(e, shape.id)} transform={`translate(${(shape.x || 0) - sz / 2},${(shape.y || 0) - sz})`} style={{ cursor: cur }}>
        <PinSvg color={shape.color} size={sz} logo={shape.logo} text={shape.text} shapeId={shape.id} />
        {isSel && <rect x={-6} y={-6} width={sz + 12} height={sz + 12} fill="none" stroke="#6366f1" strokeWidth={3} strokeDasharray="8 5" rx={8} />}
      </g>);
    }
    if (shape.type === "label") {
      const fs = shape.fontSize || 28;
      const text = shape.text || "";
      const tw = measureTextWidth(text, fs);
      const pad = 12;
      const bgMode = shape.bgMode || (shape.bg === true ? "solid" : shape.bg === false ? "none" : "solid");
      const labelFilterId = `lbl-shadow-${shape.id}`;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e => onShapeDown(e, shape.id)} style={{ cursor: cur }}>
        {bgMode === "shadow" && (
          <defs>
            <filter id={labelFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy={Math.max(2, fs * 0.08)} stdDeviation={Math.max(3, fs * 0.12)} floodColor="rgba(0,0,0,0.7)" />
            </filter>
          </defs>
        )}
        {bgMode === "solid" && <rect x={(shape.x || 0) - pad / 2} y={(shape.y || 0) - fs - 4} width={tw + pad * 2} height={fs + 16} fill="rgba(0,0,0,0.55)" rx={6} />}
        <text
          x={(shape.x || 0) + pad / 2}
          y={shape.y}
          fill={shape.color || "#fff"}
          fontSize={fs}
          fontWeight="700"
          fontFamily="Helvetica Neue, Arial, sans-serif"
          stroke={bgMode === "none" ? "rgba(0,0,0,0.5)" : "none"}
          strokeWidth={bgMode === "none" ? 4 : 0}
          paintOrder="stroke"
          filter={bgMode === "shadow" ? `url(#${labelFilterId})` : undefined}
        >{text}</text>
        {isSel && <rect x={(shape.x || 0) - pad} y={(shape.y || 0) - fs - 10} width={tw + pad * 2 + pad} height={fs + 28} fill="none" stroke="#6366f1" strokeWidth={3} strokeDasharray="8 5" rx={6} />}
      </g>);
    }
    return null;
  }

  function renderPreview() {
    const parts = [], s = sty.current;
    if (tool === "polygon" && isDrawing && drawPts.length > 0) parts.push(<g key="pp"><polyline points={drawPts.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinejoin="round" />{drawPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} fill={i === 0 ? "#fff" : s.color} stroke={i === 0 ? s.color : "#fff"} strokeWidth={2} />)}{lineCur && <line x1={drawPts[drawPts.length - 1].x} y1={drawPts[drawPts.length - 1].y} x2={lineCur.x} y2={lineCur.y} stroke={s.color} strokeWidth={s.width} strokeDasharray="8 6" opacity={0.5} />}</g>);
    if (tool === "rect" && rectStart && rectCur) { const x = Math.min(rectStart.x, rectCur.x), y = Math.min(rectStart.y, rectCur.y); parts.push(<rect key="rp" x={x} y={y} width={Math.abs(rectCur.x - rectStart.x)} height={Math.abs(rectCur.y - rectStart.y)} fill={hexToRgba(s.color, s.fill)} stroke={s.color} strokeWidth={s.width} />); }
    if ((tool === "line" || tool === "arrow" || tool === "measure") && lineStart && lineCur) parts.push(<line key="lp" x1={lineStart.x} y1={lineStart.y} x2={lineCur.x} y2={lineCur.y} stroke={s.color} strokeWidth={s.width} strokeDasharray="8 6" opacity={0.6} />);
    return parts;
  }

  /* ── which property sections to show ── */
  const showStroke = !isEditing ? (tool !== "pin" && tool !== "label" && tool !== "select") : (sel?.type !== "pin" && sel?.type !== "label");
  const showWidth = !isEditing ? (tool !== "pin" && tool !== "label" && tool !== "select") : (sel?.type !== "pin" && sel?.type !== "label");
  const showFill = !isEditing ? (tool === "polygon" || tool === "rect") : (sel?.type === "polygon" || sel?.type === "rect");
  const showPin = !isEditing ? (tool === "pin") : (sel?.type === "pin");
  const showLabel = !isEditing ? (tool === "label") : (sel?.type === "label");
  const showMeasure = isEditing && sel?.type === "measure";
  const showIdle = tool === "select" && !sel;
  const showAnyProps = showStroke || showWidth || showFill || showPin || showLabel || showMeasure;

  /* ── CANVAS sizing ── */
  const canvasRef = useRef(null);
  const [canvasArea, setCanvasArea] = useState({ w: 800, h: 600 });
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => { for (const e of entries) setCanvasArea({ w: e.contentRect.width, h: e.contentRect.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sc = zoom / 100;
  let dW = canvasArea.w - 60;
  let dH = dW / aspect;
  if (dH > canvasArea.h - 80) { dH = canvasArea.h - 80; dW = dH * aspect; }
  if (dW < 200) dW = 200;
  if (dH < 150) dH = 150;

  /* ── panel title ── */
  const panelTitle = isEditing ? `Editing: ${TOOL_LABELS[sel.type] || sel.type}` : (tool !== "select" ? `${TOOL_LABELS[tool] || tool} Settings` : "Properties");

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */
  const btnBase = { border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" };
  const iconBtn = { ...btnBase, width: 34, height: 34, borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontSize: 15 };
  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#e4e4ea", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  /* ── bg mode selector helper ── */
  const bgModeOptions = ["solid", "shadow", "none"];
  const bgModeLabels = { solid: "Solid", shadow: "Shadow", none: "None" };
  function currentBgMode() {
    if (isEditing && sel?.type === "label") {
      const m = sel.bgMode;
      if (m) return m;
      // legacy compat
      if (sel.bg === true) return "solid";
      if (sel.bg === false) return "none";
      return "solid";
    }
    return uiLabelBgMode;
  }
  function handleBgModeChange(v) {
    if (isEditing && sel?.type === "label") editSel("bgMode", v);
    else setLabelBgMode(v);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif", color: "#e4e4ea", overflow: "hidden" }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111116" }}>
        {/* left — back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/dashboard/lens" style={{ ...iconBtn, width: "auto", padding: "0 12px", gap: 6, textDecoration: "none", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Back
          </a>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1 }}>🛩</div>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>Drone Mark</span>
          </div>
        </div>
        {/* right — actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={undo} title="Undo (⌘Z)" style={{ ...iconBtn }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>↩</button>
          <button onClick={redo} title="Redo (⌘Y)" style={{ ...iconBtn }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>↪</button>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <button onClick={() => fileRef.current?.click()} title="Upload Photo" style={{ ...iconBtn }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>📷</button>
          <button onClick={doExport} style={{ ...btnBase, height: 34, padding: "0 16px", borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontSize: 12, fontWeight: 700, gap: 5, boxShadow: "0 2px 12px rgba(245,158,11,0.25)" }}>
            <span>⬇</span> Export
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhotoUpload} />
      <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onLogoUpload} />

      {/* ═══ BODY ═══ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ═══ LEFT TOOL RAIL ═══ */}
        <div style={{ width: 68, flexShrink: 0, background: "#111116", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 2, overflowY: "auto" }}>
          {TOOLS.map(t => {
            const active = tool === t.id;
            return (
              <button key={t.id} onClick={() => selectTool(t.id)} title={t.label} style={{
                ...btnBase, width: 54, height: 52, flexDirection: "column", gap: 2, borderRadius: 8,
                background: active ? "rgba(99,102,241,0.15)" : "none",
                color: active ? "#6366f1" : "rgba(255,255,255,0.4)",
                fontSize: 9, fontWeight: 600, transition: "all 0.12s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
          {/* separator */}
          <div style={{ width: 38, height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />
          {/* upload shortcut */}
          <button onClick={() => fileRef.current?.click()} title="Upload Photo" style={{ ...btnBase, width: 54, height: 52, flexDirection: "column", gap: 2, borderRadius: 8, color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>📷</span><span>Photo</span>
          </button>
          {shapes.length > 0 && (
            <button onClick={clearAll} title="Clear All" style={{ ...btnBase, width: 54, height: 52, flexDirection: "column", gap: 2, borderRadius: 8, color: "rgba(239,68,68,0.6)", fontSize: 9, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🗑</span><span>Clear</span>
            </button>
          )}
        </div>

        {/* ═══ CENTER CANVAS ═══ */}
        <div ref={canvasRef} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
          backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.015) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.015) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.015) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.015) 75%)",
          backgroundSize: "28px 28px",
          backgroundPosition: "0 0, 0 14px, 14px -14px, -14px 0px",
        }}>
          {!photo ? (
            <div style={{ textAlign: "center", maxWidth: 420 }}>
              <div style={{ width: 110, height: 110, borderRadius: 22, background: "linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, margin: "0 auto 20px" }}>🛩</div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.75)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>Drone Mark</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, margin: "0 0 20px" }}>Upload a drone or aerial photo to start annotating. Draw lot lines, drop branded pins, add measurements and labels.</p>
              <button onClick={() => fileRef.current?.click()} style={{ padding: "11px 28px", borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 2px 16px rgba(245,158,11,0.25)" }}>📷 Upload Photo</button>
            </div>
          ) : (
            <div style={{ width: dW * sc, height: dH * sc }}>
              <div style={{ width: natW, height: natH, transform: `scale(${(dW * sc) / natW})`, transformOrigin: "top left", position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
                <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} crossOrigin="anonymous" draggable={false} />
                <svg ref={svgRef} viewBox={`0 0 ${natW} ${natH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: tool === "select" ? "default" : "crosshair" }}
                  onClick={onCanvasClick} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onDoubleClick={onDblClick}>
                  {shapes.map(renderShape)}
                  {renderPreview()}
                </svg>
              </div>
            </div>
          )}
          {/* ── Zoom Bar ── */}
          {photo && (
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "rgba(17,17,22,0.92)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
              <button onClick={() => setZoom(Math.max(25, zoom - 15))} style={{ ...iconBtn, width: 26, height: 26, fontSize: 14, border: "none" }}>−</button>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", minWidth: 40, textAlign: "center" }}>{zoom}%</span>
              <button onClick={() => setZoom(Math.min(300, zoom + 15))} style={{ ...iconBtn, width: 26, height: 26, fontSize: 14, border: "none" }}>+</button>
              <button onClick={() => setZoom(100)} title="Reset zoom" style={{ ...iconBtn, width: 26, height: 26, fontSize: 12, border: "none", color: "rgba(255,255,255,0.3)" }}>⟲</button>
              <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>{natW}×{natH}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>{shapes.length} obj</span>
            </div>
          )}
        </div>

        {/* ═══ RIGHT PROPERTIES PANEL ═══ */}
        <div style={{ width: 280, flexShrink: 0, background: "#111116", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* panel header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>🎨</span>
            <span style={{ fontSize: 12, fontWeight: 800, flex: 1, letterSpacing: "-0.01em" }}>{panelTitle}</span>
          </div>

          {/* ── editing actions ── */}
          {isEditing && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6 }}>
              <button onClick={duplicateSel} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.08)", color: "#6366f1", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Duplicate</button>
              <button onClick={() => deleteShape(sel.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
            </div>
          )}

          {/* ── idle state ── */}
          {showIdle && (
            <div style={{ padding: "28px 20px" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, margin: "0 0 20px", textAlign: "center" }}>Click a shape to edit its properties, or choose a tool to start drawing.</p>
              <Section title="Keyboard Shortcuts" icon="⌨" defaultOpen={false}>
                {[["Esc", "Cancel drawing"], ["Del", "Delete selected"], ["⌘Z", "Undo"], ["⌘Y", "Redo"], ["Dbl-click", "Finish polygon"], ["Drag handle", "Reshape"]].map(([k, d], i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" }}>{k}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{d}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* ── stroke color ── */}
          {showStroke && (
            <Section title={isEditing ? "Shape Color" : "Stroke Color"} icon="🎨" defaultOpen={true}>
              <ColorPicker value={editableColor} onChange={handleColorChange} />
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "6px 0 5px" }}>Brokerage</p>
              <SwatchGrid colors={BROKERAGE_COLORS} current={editableColor} onSelect={handleColorChange} />
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "8px 0 5px" }}>Accent</p>
              <SwatchGrid colors={ACCENT_COLORS} current={editableColor} onSelect={handleColorChange} />
            </Section>
          )}

          {/* ── line width ── */}
          {showWidth && (
            <Section title="Line Width" icon="━" defaultOpen={true}>
              <Slider min={1} max={14} value={editableWidth} onChange={handleWidthChange} suffix="px" />
            </Section>
          )}

          {/* ── fill opacity ── */}
          {showFill && (
            <Section title="Fill Opacity" icon="◧" defaultOpen={true}>
              <Slider min={0} max={80} value={editableFill} onChange={handleFillChange} suffix="%" />
            </Section>
          )}

          {/* ── pin settings ── */}
          {showPin && (
            <>
              <Section title="Pin Color" icon="📍" defaultOpen={true}>
                <ColorPicker value={isEditing && sel?.type === "pin" ? sel.color : uiPinColor} onChange={handlePinColorChange} />
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "6px 0 5px" }}>Brokerage</p>
                <SwatchGrid colors={BROKERAGE_COLORS} current={isEditing && sel?.type === "pin" ? sel.color : uiPinColor} onSelect={handlePinColorChange} />
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "8px 0 5px" }}>Accent</p>
                <SwatchGrid colors={ACCENT_COLORS} current={isEditing && sel?.type === "pin" ? sel.color : uiPinColor} onSelect={handlePinColorChange} />
              </Section>
              <Section title="Pin Size" icon="↕" defaultOpen={true}>
                <Slider min={80} max={400} value={isEditing && sel?.type === "pin" ? (sel.size || 200) : uiPinSize} onChange={v => { if (isEditing && sel?.type === "pin") editSel("size", v); else setPinSize(v); }} suffix="px" />
              </Section>
              <Section title="Logo" icon="🖼" defaultOpen={true}>
                {sty.current.logo ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={sty.current.logo} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div style={{ flex: 1, display: "flex", gap: 6 }}>
                      <button onClick={() => logoRef.current?.click()} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Replace</button>
                      <button onClick={() => { sty.current.logo = null; setUiLogoKey(k => k + 1); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "none", color: "rgba(239,68,68,0.5)", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => logoRef.current?.click()} style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: 14, textAlign: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Click to upload logo</span>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── label settings ── */}
          {showLabel && (
            <>
              <Section title="Label Text" icon="T" defaultOpen={true}>
                <input value={isEditing && sel?.type === "label" ? (sel.text || "") : uiLabelText}
                  onChange={e => { if (isEditing && sel?.type === "label") editSel("text", e.target.value); else setLabelText(e.target.value); }}
                  placeholder='e.g. "LOT #1 · 1,508m²"'
                  style={inputStyle} />
                {!isEditing && !uiLabelText.trim() && (
                  <p style={{ fontSize: 10, color: "rgba(245,158,11,0.6)", marginTop: 6, marginBottom: 0 }}>Type label text before clicking canvas</p>
                )}
              </Section>
              <Section title="Font Size" icon="↕" defaultOpen={true}>
                <Slider min={10} max={200} value={isEditing && sel?.type === "label" ? (sel.fontSize || 28) : uiLabelFs} onChange={v => { if (isEditing && sel?.type === "label") editSel("fontSize", v); else setLabelFs(v); }} suffix="px" />
              </Section>
              <Section title="Text Color" icon="🎨" defaultOpen={true}>
                <ColorPicker value={isEditing && sel?.type === "label" ? (sel.color || "#ffffff") : uiLabelColor} onChange={v => { if (isEditing && sel?.type === "label") editSel("color", v); else setLabelColor(v); }} />
                <SwatchGrid colors={ACCENT_COLORS} current={isEditing && sel?.type === "label" ? (sel.color || "#ffffff") : uiLabelColor} onSelect={v => { if (isEditing && sel?.type === "label") editSel("color", v); else setLabelColor(v); }} />
              </Section>
              <Section title="Background Style" icon="◧" defaultOpen={true}>
                <div style={{ display: "flex", gap: 4 }}>
                  {bgModeOptions.map(m => (
                    <button key={m} onClick={() => handleBgModeChange(m)} style={{
                      flex: 1, padding: "6px 0", borderRadius: 6, fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: currentBgMode() === m ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                      background: currentBgMode() === m ? "rgba(99,102,241,0.15)" : "none",
                      color: currentBgMode() === m ? "#6366f1" : "rgba(255,255,255,0.4)",
                    }}>{bgModeLabels[m]}</button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── measure settings ── */}
          {showMeasure && (
            <>
              <Section title="Measurement Text" icon="📐" defaultOpen={true}>
                <input value={sel.measureText || ""} onChange={e => editSel("measureText", e.target.value)} placeholder='e.g. "15 m" or "50 ft"'
                  style={inputStyle} />
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6, marginBottom: 0 }}>Type the measurement to display on the line</p>
              </Section>
              <Section title="Text Size" icon="↕" defaultOpen={true}>
                <Slider min={14} max={120} value={sel.measureFs || 0} onChange={v => editSel("measureFs", v)} suffix="px" />
              </Section>
            </>
          )}

          {/* ── measure defaults for tool (not editing) ── */}
          {!isEditing && tool === "measure" && (
            <Section title="Measurement" icon="📐" defaultOpen={true}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 4px", lineHeight: 1.5 }}>Draw a line on the canvas, then select it to add measurement text</p>
            </Section>
          )}

          {/* spacer */}
          <div style={{ flex: 1 }} />

          {/* layer count */}
          {shapes.length > 0 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", margin: 0, textAlign: "center" }}>{shapes.length} object{shapes.length !== 1 ? "s" : ""} on canvas</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TOAST ═══ */}
      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", padding: "10px 22px", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 10, zIndex: 100, boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>✓ {toast}</div>}
      {showGate && <GateOverlay gateType={gateType} toolName="Drone Mark" onClose={() => setShowGate(false)} />}
    </div>
  );
}
