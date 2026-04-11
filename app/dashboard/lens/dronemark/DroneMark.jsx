"use client";
import { useState, useRef, useEffect } from "react";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function hexToRgba(hex, a) { const c = hex.replace("#",""); if (c.length < 6) return `rgba(0,0,0,${a})`; return `rgba(${parseInt(c.substring(0,2),16)},${parseInt(c.substring(2,4),16)},${parseInt(c.substring(4,6),16)},${a})`; }

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
  { id: "select", label: "Select", icon: "↖" },
  { id: "polygon", label: "Lot Lines", icon: "⬡" },
  { id: "rect", label: "Rectangle", icon: "▭" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "pin", label: "Pin", icon: "📍" },
  { id: "label", label: "Label", icon: "T" },
  { id: "measure", label: "Measure", icon: "📐" },
  { id: "arrow", label: "Arrow", icon: "➤" },
];

function PinSvg({ color, size, logo, text }) {
  const s = size || 200;
  const clipId = useRef("pc" + uid()).current;
  const filtId = useRef("pf" + uid()).current;
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

function SwatchGrid({ colors, current, onSelect, showLabels }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap: showLabels ? 4 : 6 }}>
      {colors.map(c => {
        const hex = typeof c === "string" ? c : c.hex;
        const label = typeof c === "string" ? null : c.label;
        const active = current === hex;
        return (
          <div key={hex} onClick={() => onSelect(hex)} title={label||hex} style={{
            display: showLabels ? "flex" : "block", alignItems:"center", gap:6,
            padding: showLabels ? "4px 8px" : 0, borderRadius: showLabels ? 6 : 7,
            border: active ? (showLabels ? "1px solid #6366f1" : "2px solid #fff") : "1px solid rgba(255,255,255,0.07)",
            background: active && showLabels ? "rgba(99,102,241,0.12)" : showLabels ? "rgba(255,255,255,0.03)" : "none",
            cursor:"pointer", transition:"all 0.15s",
            boxShadow: active && !showLabels ? "0 0 0 2px #6366f1" : "none",
          }}>
            <div style={{ width: showLabels ? 16 : 28, height: showLabels ? 16 : 28, borderRadius: showLabels ? 4 : 7, backgroundColor:hex, flexShrink:0, border: (hex==="#ffffff"||hex==="#000000") ? "1px solid rgba(128,128,128,0.3)" : "none" }}/>
            {showLabels && label && <span style={{ fontSize:10, fontWeight:600, color: active ? "#6366f1" : "rgba(255,255,255,0.5)", whiteSpace:"nowrap" }}>{label}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function DroneMark({ agentLogo }) {
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

  // ── STYLE REF ──
  const sty = useRef({ color:"#ffffff", width:4, fill:0.12, pinColor:"#ef4444", pinSize:200, pinText:"", labelText:"", labelFs:28, labelColor:"#ffffff", labelBg:true, logo: agentLogo||null, unit:"m" });
  const [uiColor, setUiColor] = useState("#ffffff");
  const [uiWidth, setUiWidth] = useState(4);
  const [uiFill, setUiFill] = useState(12);
  const [uiPinColor, setUiPinColor] = useState("#ef4444");
  const [uiPinSize, setUiPinSize] = useState(200);
  const [uiPinText, setUiPinText] = useState("");
  const [uiLabelText, setUiLabelText] = useState("");
  const [uiLabelFs, setUiLabelFs] = useState(28);
  const [uiLogoKey, setUiLogoKey] = useState(0); // force re-render for logo changes

  function setColor(v) { sty.current.color = v; setUiColor(v); }
  function setWidth(v) { sty.current.width = v; setUiWidth(v); }
  function setFill(v) { sty.current.fill = v/100; setUiFill(v); }
  function setPinColor(v) { sty.current.pinColor = v; setUiPinColor(v); }
  function setPinSize(v) { sty.current.pinSize = v; setUiPinSize(v); }
  function setPinText(v) { sty.current.pinText = v; setUiPinText(v); }
  function setLabelText(v) { sty.current.labelText = v; setUiLabelText(v); }
  function setLabelFs(v) { sty.current.labelFs = v; setUiLabelFs(v); }

  useEffect(() => { if (agentLogo) { sty.current.logo = agentLogo; setUiLogoKey(k=>k+1); } }, [agentLogo]);

  const svgRef = useRef(null);
  const fileRef = useRef(null);
  const logoRef = useRef(null);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  // ── HISTORY ──
  function pushHist(ns) { const h = histRef.current; h.stack = [...h.stack.slice(0, h.idx+1), ns]; h.idx = h.stack.length-1; }
  function undo() { const h = histRef.current; if (h.idx > 0) { h.idx--; setShapes(h.stack[h.idx]); } }
  function redo() { const h = histRef.current; if (h.idx < h.stack.length-1) { h.idx++; setShapes(h.stack[h.idx]); } }
  function addShape(s) { setShapes(prev => { const ns = [...prev, s]; pushHist(ns); return ns; }); }
  function updateShape(id, u) { setShapes(prev => { const ns = prev.map(s => s.id===id ? {...s,...u} : s); pushHist(ns); return ns; }); }
  function updateLive(id, u) { setShapes(prev => prev.map(s => s.id===id ? {...s,...u} : s)); }
  function deleteShape(id) { setShapes(prev => { const ns = prev.filter(s => s.id!==id); pushHist(ns); return ns; }); if (selId===id) setSelId(null); }
  function clearAll() { setShapes([]); setSelId(null); histRef.current = { stack: [[]], idx: 0 }; }

  function getPos(e) { const svg = svgRef.current; if (!svg) return {x:0,y:0}; const r = svg.getBoundingClientRect(); return { x:(e.clientX-r.left)*(natW/r.width), y:(e.clientY-r.top)*(natH/r.height) }; }

  // ── CANVAS EVENTS ──
  function onCanvasClick(e) {
    if (e.target.closest("[data-handle]")) return;
    if (e.target.closest("[data-sid]") && tool==="select") return;
    const p = getPos(e), s = sty.current;
    if (tool==="polygon") { if (!isDrawing) { setIsDrawing(true); setDrawPts([p]); } else { const f=drawPts[0], d=Math.sqrt((p.x-f.x)**2+(p.y-f.y)**2); if (drawPts.length>=3 && d<30*(natW/1000)) { addShape({id:uid(),type:"polygon",points:[...drawPts],color:s.color,width:s.width,fillOpacity:s.fill}); setIsDrawing(false); setDrawPts([]); } else setDrawPts([...drawPts,p]); } }
    else if (tool==="pin") addShape({id:uid(),type:"pin",x:p.x,y:p.y,color:s.pinColor,size:s.pinSize,logo:s.logo,text:s.pinText});
    else if (tool==="label") { if (!s.labelText.trim()) { notify("Type label text first"); return; } addShape({id:uid(),type:"label",x:p.x,y:p.y,text:s.labelText,fontSize:s.labelFs,color:s.labelColor,bg:s.labelBg}); }
    else if (tool==="select") setSelId(null);
  }
  function onMouseDown(e) { const p=getPos(e); if (tool==="rect") { setRectStart(p); setRectCur(p); } else if (tool==="line"||tool==="measure"||tool==="arrow") { setLineStart(p); setLineCur(p); } }
  function onMouseMove(e) {
    const p=getPos(e);
    if (tool==="rect"&&rectStart) setRectCur(p);
    else if ((tool==="line"||tool==="measure"||tool==="arrow")&&lineStart) setLineCur(p);
    else if (drag&&dragStart) {
      const dx=p.x-dragStart.x, dy=p.y-dragStart.y, shape=shapes.find(sh=>sh.id===drag.sid);
      if (!shape) return;
      if (drag.hi!==undefined) { if (shape.points) { const np=[...shape.points]; np[drag.hi]={x:p.x,y:p.y}; updateLive(drag.sid,{points:np}); } else if (drag.hi===0) updateLive(drag.sid,{x1:p.x,y1:p.y}); else updateLive(drag.sid,{x2:p.x,y2:p.y}); }
      else { if (shape.points) updateLive(drag.sid,{points:shape.points.map(pt=>({x:pt.x+dx,y:pt.y+dy}))}); else if (shape.x1!==undefined) updateLive(drag.sid,{x1:shape.x1+dx,y1:shape.y1+dy,x2:shape.x2+dx,y2:shape.y2+dy}); else updateLive(drag.sid,{x:(shape.x||0)+dx,y:(shape.y||0)+dy}); }
      setDragStart(p);
    }
    if (tool==="polygon"&&isDrawing) setLineCur(p);
  }
  function onMouseUp(e) {
    const p=getPos(e), s=sty.current;
    if (tool==="rect"&&rectStart) { const x1=Math.min(rectStart.x,p.x),y1=Math.min(rectStart.y,p.y),x2=Math.max(rectStart.x,p.x),y2=Math.max(rectStart.y,p.y); if (Math.abs(x2-x1)>10&&Math.abs(y2-y1)>10) addShape({id:uid(),type:"rect",points:[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}],color:s.color,width:s.width,fillOpacity:s.fill}); setRectStart(null); setRectCur(null); }
    else if ((tool==="line"||tool==="arrow")&&lineStart) { if (Math.sqrt((p.x-lineStart.x)**2+(p.y-lineStart.y)**2)>10) addShape({id:uid(),type:tool==="arrow"?"arrow":"line",x1:lineStart.x,y1:lineStart.y,x2:p.x,y2:p.y,color:s.color,width:s.width}); setLineStart(null); setLineCur(null); }
    else if (tool==="measure"&&lineStart) { if (Math.sqrt((p.x-lineStart.x)**2+(p.y-lineStart.y)**2)>10) addShape({id:uid(),type:"measure",x1:lineStart.x,y1:lineStart.y,x2:p.x,y2:p.y,color:s.color,width:s.width,measureText:"",unit:s.unit}); setLineStart(null); setLineCur(null); }
    if (drag) { pushHist([...shapes]); setDrag(null); setDragStart(null); }
  }
  function onShapeDown(e, id) { e.stopPropagation(); if (tool==="select") { setSelId(id); setDrag({sid:id}); setDragStart(getPos(e)); } }
  function onHandleDown(e, sid, hi) { e.stopPropagation(); setSelId(sid); setDrag({sid,hi}); setDragStart(getPos(e)); }
  function onDblClick() { if (tool==="polygon"&&isDrawing&&drawPts.length>=3) { const s=sty.current; addShape({id:uid(),type:"polygon",points:[...drawPts],color:s.color,width:s.width,fillOpacity:s.fill}); setIsDrawing(false); setDrawPts([]); } }
  function cancelDraw() { setIsDrawing(false); setDrawPts([]); setRectStart(null); setRectCur(null); setLineStart(null); setLineCur(null); }

  useEffect(() => { function h(e) { if (e.key==="Escape") cancelDraw(); if ((e.key==="Delete"||e.key==="Backspace")&&selId&&!e.target.closest("input,textarea")) { e.preventDefault(); deleteShape(selId); } if ((e.metaKey||e.ctrlKey)&&e.key==="z") { e.preventDefault(); undo(); } if ((e.metaKey||e.ctrlKey)&&e.key==="y") { e.preventDefault(); redo(); } } window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); });

  function onPhotoUpload(e) { const f=e.target.files?.[0]; if (!f) return; const url=URL.createObjectURL(f); const img=new Image(); img.onload=()=>{ setNatW(img.naturalWidth); setNatH(img.naturalHeight); setPhoto(url); setShapes([]); histRef.current={stack:[[]],idx:0}; }; img.src=url; }
  function onLogoUpload(e) { const f=e.target.files?.[0]; if (!f) return; const reader=new FileReader(); reader.onload=(ev)=>{ sty.current.logo=ev.target.result; setUiLogoKey(k=>k+1); }; reader.readAsDataURL(f); }

  async function doExport() {
    if (!photo) { notify("Upload photo first"); return; }
    setSelId(null); await new Promise(r=>setTimeout(r,50));
    try {
      const svg=svgRef.current; if (!svg) return;
      const canvas=document.createElement("canvas"); canvas.width=natW; canvas.height=natH;
      const ctx=canvas.getContext("2d");
      const img=new Image(); img.crossOrigin="anonymous";
      await new Promise((res,rej)=>{ img.onload=res; img.onerror=rej; img.src=photo; });
      ctx.drawImage(img,0,0,natW,natH);
      const svgData=new XMLSerializer().serializeToString(svg);
      const svgBlob=new Blob([svgData],{type:"image/svg+xml;charset=utf-8"});
      const svgUrl=URL.createObjectURL(svgBlob);
      const svgImg=new Image();
      await new Promise((res,rej)=>{ svgImg.onload=res; svgImg.onerror=rej; svgImg.src=svgUrl; });
      ctx.drawImage(svgImg,0,0,natW,natH); URL.revokeObjectURL(svgUrl);
      const link=document.createElement("a"); link.download=`drone-${Date.now()}.png`; link.href=canvas.toDataURL("image/png"); link.click();
      notify("Exported!");
    } catch (err) { console.error(err); notify("Export failed"); }
  }

  // ── SELECTED SHAPE EDITING ──
  const sel = shapes.find(s => s.id===selId);

  // When a shape is selected, update a shape's property
  function editSel(prop, val) { if (!sel) return; updateShape(sel.id, { [prop]: val }); }

  // ── DISPLAY ──
  const aspect = natW/natH;
  let dW = 700, dH = 700/aspect;
  if (dH > 500) { dH = 500; dW = 500*aspect; }
  const sc = zoom/100;
  const hR = Math.max(10, Math.min(16, natW*0.007));

  // ── RENDER SHAPE ──
  function renderShape(shape) {
    const isSel = shape.id===selId;
    const cur = tool==="select" ? "move" : "default";
    if (shape.type==="polygon"||shape.type==="rect") {
      const pts = shape.points.map(p=>`${p.x},${p.y}`).join(" ");
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e=>onShapeDown(e,shape.id)} style={{cursor:cur}}>
        <polygon points={pts} fill={hexToRgba(shape.color,shape.fillOpacity||0)} stroke={shape.color} strokeWidth={shape.width} strokeLinejoin="round"/>
        <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={Math.max(24,(shape.width||4)+16)}/>
        {isSel && shape.points.map((p,i)=>(<circle key={i} data-handle cx={p.x} cy={p.y} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{cursor:"grab"}} onMouseDown={e=>onHandleDown(e,shape.id,i)}/>))}
      </g>);
    }
    if (shape.type==="line"||shape.type==="arrow") {
      const mId=`arr-${shape.id}`;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e=>onShapeDown(e,shape.id)} style={{cursor:cur}}>
        {shape.type==="arrow"&&<defs><marker id={mId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill={shape.color}/></marker></defs>}
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round" markerEnd={shape.type==="arrow"?`url(#${mId})`:undefined}/>
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth={Math.max(24,(shape.width||4)+16)}/>
        {isSel&&<><circle data-handle cx={shape.x1} cy={shape.y1} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{cursor:"grab"}} onMouseDown={e=>onHandleDown(e,shape.id,0)}/><circle data-handle cx={shape.x2} cy={shape.y2} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{cursor:"grab"}} onMouseDown={e=>onHandleDown(e,shape.id,1)}/></>}
      </g>);
    }
    if (shape.type==="measure") {
      const dx=shape.x2-shape.x1, dy=shape.y2-shape.y1, dist=Math.sqrt(dx*dx+dy*dy);
      const mx=(shape.x1+shape.x2)/2, my=(shape.y1+shape.y2)/2, ang=Math.atan2(dy,dx)*180/Math.PI;
      const txt=shape.measureText||`${Math.round(dist/10)} ${shape.unit||"m"}`;
      const fs=Math.max(22,Math.min(40,dist*0.08)), tL=Math.max(14,dist*0.04), pX=-dy/dist*tL, pY=dx/dist*tL;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e=>onShapeDown(e,shape.id)} style={{cursor:cur}}>
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round"/>
        <line x1={shape.x1+pX} y1={shape.y1+pY} x2={shape.x1-pX} y2={shape.y1-pY} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round"/>
        <line x1={shape.x2+pX} y1={shape.y2+pY} x2={shape.x2-pX} y2={shape.y2-pY} stroke={shape.color} strokeWidth={shape.width} strokeLinecap="round"/>
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth={Math.max(24,(shape.width||4)+16)}/>
        <g transform={`translate(${mx},${my-8})`}><text textAnchor="middle" fill={shape.color} fontSize={fs} fontWeight="800" fontFamily="Helvetica Neue, sans-serif" stroke="rgba(0,0,0,0.5)" strokeWidth="4" paintOrder="stroke" transform={ang>90||ang<-90?`rotate(${ang+180})`:`rotate(${ang})`}>{txt}</text></g>
        {isSel&&<><circle data-handle cx={shape.x1} cy={shape.y1} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{cursor:"grab"}} onMouseDown={e=>onHandleDown(e,shape.id,0)}/><circle data-handle cx={shape.x2} cy={shape.y2} r={hR} fill="#fff" stroke="#6366f1" strokeWidth={3} style={{cursor:"grab"}} onMouseDown={e=>onHandleDown(e,shape.id,1)}/></>}
      </g>);
    }
    if (shape.type==="pin") {
      const sz=shape.size||200;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e=>onShapeDown(e,shape.id)} transform={`translate(${(shape.x||0)-sz/2},${(shape.y||0)-sz})`} style={{cursor:cur}}>
        <PinSvg color={shape.color} size={sz} logo={shape.logo} text={shape.text}/>
        {isSel&&<rect x={-6} y={-6} width={sz+12} height={sz+12} fill="none" stroke="#6366f1" strokeWidth={3} strokeDasharray="8 5" rx={8}/>}
      </g>);
    }
    if (shape.type==="label") {
      const fs=shape.fontSize||28;
      return (<g key={shape.id} data-sid={shape.id} onMouseDown={e=>onShapeDown(e,shape.id)} style={{cursor:cur}}>
        {shape.bg&&<rect x={(shape.x||0)-6} y={(shape.y||0)-fs-4} width={(shape.text||"").length*fs*0.62+24} height={fs+16} fill="rgba(0,0,0,0.55)" rx={6}/>}
        <text x={(shape.x||0)+6} y={shape.y} fill={shape.color||"#fff"} fontSize={fs} fontWeight="700" fontFamily="Helvetica Neue, Arial, sans-serif" stroke={shape.bg?"none":"rgba(0,0,0,0.5)"} strokeWidth={shape.bg?0:4} paintOrder="stroke">{shape.text}</text>
        {isSel&&<rect x={(shape.x||0)-10} y={(shape.y||0)-fs-10} width={(shape.text||"").length*fs*0.62+32} height={fs+28} fill="none" stroke="#6366f1" strokeWidth={3} strokeDasharray="8 5" rx={6}/>}
      </g>);
    }
    return null;
  }

  function renderPreview() {
    const parts=[], s=sty.current;
    if (tool==="polygon"&&isDrawing&&drawPts.length>0) parts.push(<g key="pp"><polyline points={drawPts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinejoin="round"/>{drawPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={6} fill={i===0?"#fff":s.color} stroke={i===0?s.color:"#fff"} strokeWidth={2}/>)}{lineCur&&<line x1={drawPts[drawPts.length-1].x} y1={drawPts[drawPts.length-1].y} x2={lineCur.x} y2={lineCur.y} stroke={s.color} strokeWidth={s.width} strokeDasharray="8 6" opacity={0.5}/>}</g>);
    if (tool==="rect"&&rectStart&&rectCur) { const x=Math.min(rectStart.x,rectCur.x),y=Math.min(rectStart.y,rectCur.y); parts.push(<rect key="rp" x={x} y={y} width={Math.abs(rectCur.x-rectStart.x)} height={Math.abs(rectCur.y-rectStart.y)} fill={hexToRgba(s.color,s.fill)} stroke={s.color} strokeWidth={s.width}/>); }
    if ((tool==="line"||tool==="arrow"||tool==="measure")&&lineStart&&lineCur) parts.push(<line key="lp" x1={lineStart.x} y1={lineStart.y} x2={lineCur.x} y2={lineCur.y} stroke={s.color} strokeWidth={s.width} strokeDasharray="8 6" opacity={0.6}/>);
    return parts;
  }

  // ── Whether we're editing a selected shape ──
  const isEditing = tool==="select" && sel;
  const editableColor = isEditing ? sel.color : uiColor;
  const editableWidth = isEditing ? (sel.width||4) : uiWidth;
  const editableFill = isEditing ? Math.round((sel.fillOpacity||0)*100) : uiFill;

  function handleColorChange(v) { if (isEditing) editSel("color",v); else setColor(v); }
  function handleWidthChange(v) { if (isEditing) editSel("width",v); else setWidth(v); }
  function handleFillChange(v) { if (isEditing) editSel("fillOpacity",v/100); else setFill(v); }
  function handlePinColorChange(v) { if (isEditing && sel?.type==="pin") editSel("color",v); else setPinColor(v); }

  const L = (text) => <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, marginTop:0 }}>{text}</p>;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0a0a0f", fontFamily:"'DM Sans',-apple-system,sans-serif", color:"#e4e4ea" }}>
      {/* ── LEFT PANEL ── */}
      <div style={{ width:300, background:"#111116", borderRight:"1px solid rgba(255,255,255,0.07)", overflowY:"auto", flexShrink:0 }}>
        <div style={{ padding:"16px 16px 12px", fontSize:14, fontWeight:800, borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:7 }}>
          <span style={{fontSize:16}}>🛩</span> Drone Mark
        </div>
        <div style={{ padding:14 }}>
          {/* Tools */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, marginBottom:16 }}>
            {TOOLS.map(t=>(
              <button key={t.id} onClick={()=>{setTool(t.id);cancelDraw();if(t.id==="select"){}else setSelId(null);}} style={{
                padding:"8px 0",borderRadius:8,border:tool===t.id?"1px solid #6366f1":"1px solid rgba(255,255,255,0.07)",
                background:tool===t.id?"rgba(99,102,241,0.12)":"none",color:tool===t.id?"#6366f1":"rgba(255,255,255,0.4)",
                cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:9,fontWeight:600,fontFamily:"inherit",
              }}><span style={{fontSize:18}}>{t.icon}</span>{t.label}</button>
            ))}
          </div>

          {/* Upload */}
          <div onClick={()=>fileRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.1)", borderRadius:10, padding:16, textAlign:"center", cursor:"pointer", marginBottom:16 }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>{photo?"Replace Photo":"Upload Drone Photo"}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={onPhotoUpload}/>

          {/* ── SELECTED SHAPE BANNER ── */}
          {isEditing && (
            <div style={{ padding:"8px 10px", borderRadius:8, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:"#6366f1", fontWeight:700 }}>Editing: {sel.type==="polygon"?"Lot Lines":sel.type==="rect"?"Rectangle":sel.type==="pin"?"Pin":sel.type==="label"?"Label":sel.type==="measure"?"Measure":sel.type==="arrow"?"Arrow":"Line"}</span>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>{const s2=shapes.find(sh=>sh.id===sel.id);if(!s2)return;const n={...s2,id:uid()};if(n.points)n.points=n.points.map(p=>({x:p.x+30,y:p.y+30}));if(n.x!==undefined){n.x+=30;n.y=(n.y||0)+30;}if(n.x1!==undefined){n.x1+=30;n.y1=(n.y1||0)+30;n.x2+=30;n.y2=(n.y2||0)+30;}addShape(n);}} style={{padding:"3px 8px",borderRadius:5,border:"none",background:"rgba(99,102,241,0.15)",color:"#6366f1",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Duplicate</button>
                <button onClick={()=>deleteShape(sel.id)} style={{padding:"3px 8px",borderRadius:5,border:"none",background:"rgba(239,68,68,0.12)",color:"#ef4444",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
              </div>
            </div>
          )}

          {/* ── STYLES ── */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:14, marginTop:4 }}>
            {/* Color - for lines/shapes or selected shape */}
            {(!isEditing || sel?.type!=="pin") && <>
              {L(isEditing ? "Shape Color" : "Line Color")}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <input type="color" value={editableColor} onChange={e=>handleColorChange(e.target.value)} style={{ width:34, height:34, borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", padding:0, background:"none" }}/>
                <input value={editableColor} onChange={e=>handleColorChange(e.target.value)} style={{ width:90, padding:"6px 8px", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"#e4e4ea", fontSize:12, fontFamily:"monospace", outline:"none" }}/>
              </div>
              {L("Brokerage Presets")}
              <SwatchGrid colors={BROKERAGE_COLORS} current={editableColor} onSelect={handleColorChange} showLabels/>
              <div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={editableColor} onSelect={handleColorChange}/></div>
              <div style={{marginBottom:16}}/>
            </>}

            {/* Pin color - shown when pin tool selected or pin shape selected */}
            {(tool==="pin" || (isEditing && sel?.type==="pin")) && <>
              {L("Pin Color")}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <input type="color" value={isEditing&&sel?.type==="pin"?sel.color:uiPinColor} onChange={e=>handlePinColorChange(e.target.value)} style={{ width:34, height:34, borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", padding:0, background:"none" }}/>
                <input value={isEditing&&sel?.type==="pin"?sel.color:uiPinColor} onChange={e=>handlePinColorChange(e.target.value)} style={{ width:90, padding:"6px 8px", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"#e4e4ea", fontSize:12, fontFamily:"monospace", outline:"none" }}/>
              </div>
              {L("Brokerage Presets")}
              <SwatchGrid colors={BROKERAGE_COLORS} current={isEditing&&sel?.type==="pin"?sel.color:uiPinColor} onSelect={handlePinColorChange} showLabels/>
              <div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={isEditing&&sel?.type==="pin"?sel.color:uiPinColor} onSelect={handlePinColorChange}/></div>
              <div style={{marginBottom:16}}/>
            </>}

            {/* Width */}
            {(!isEditing || (sel?.type!=="pin"&&sel?.type!=="label")) && <>
              {L("Line Width")}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <input type="range" min={1} max={14} value={editableWidth} onChange={e=>handleWidthChange(Number(e.target.value))} style={{flex:1,accentColor:"#6366f1"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#e4e4ea",minWidth:32,textAlign:"right"}}>{editableWidth}px</span>
              </div>
            </>}

            {/* Fill */}
            {(!isEditing || sel?.type==="polygon"||sel?.type==="rect") && <>
              {L("Fill Opacity")}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <input type="range" min={0} max={80} value={editableFill} onChange={e=>handleFillChange(Number(e.target.value))} style={{flex:1,accentColor:"#6366f1"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#e4e4ea",minWidth:32,textAlign:"right"}}>{editableFill}%</span>
              </div>
            </>}

            {/* Pin settings */}
            {(tool==="pin"||(isEditing&&sel?.type==="pin")) && <>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12, marginTop:4 }}>
                {L("Pin Size")}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <input type="range" min={80} max={400} value={isEditing&&sel?.type==="pin"?(sel.size||200):uiPinSize} onChange={e=>{const v=Number(e.target.value);if(isEditing&&sel?.type==="pin")editSel("size",v);else setPinSize(v);}} style={{flex:1,accentColor:"#6366f1"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#e4e4ea",minWidth:38,textAlign:"right"}}>{isEditing&&sel?.type==="pin"?(sel.size||200):uiPinSize}px</span>
                </div>
                {L("Pin Label")}
                <input value={isEditing&&sel?.type==="pin"?(sel.text||""):uiPinText} onChange={e=>{if(isEditing&&sel?.type==="pin")editSel("text",e.target.value);else setPinText(e.target.value);}} placeholder="e.g. 1500 m² lot"
                  style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"#e4e4ea", fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" }}/>
                {L("Logo")}
                {sty.current.logo ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <img src={sty.current.logo} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:"cover", border:"1px solid rgba(255,255,255,0.1)" }}/>
                    <button onClick={()=>{sty.current.logo=null;setUiLogoKey(k=>k+1);}} style={{ flex:1, padding:"6px 0", borderRadius:6, border:"1px solid rgba(255,255,255,0.07)", background:"none", color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Remove</button>
                  </div>
                ) : (
                  <div onClick={()=>logoRef.current?.click()} style={{ border:"2px dashed rgba(255,255,255,0.1)", borderRadius:10, padding:12, textAlign:"center", cursor:"pointer" }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>Upload Logo</span>
                  </div>
                )}
                <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={onLogoUpload}/>
              </div>
            </>}

            {/* Label settings */}
            {(tool==="label"||(isEditing&&sel?.type==="label")) && <>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12, marginTop:4 }}>
                {L("Label Text")}
                <input value={isEditing&&sel?.type==="label"?(sel.text||""):uiLabelText} onChange={e=>{if(isEditing&&sel?.type==="label")editSel("text",e.target.value);else setLabelText(e.target.value);}} placeholder="e.g. LOT #1 · 1,508m²"
                  style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"#e4e4ea", fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" }}/>
                {L("Font Size")}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <input type="range" min={14} max={80} value={isEditing&&sel?.type==="label"?(sel.fontSize||28):uiLabelFs} onChange={e=>{const v=Number(e.target.value);if(isEditing&&sel?.type==="label")editSel("fontSize",v);else setLabelFs(v);}} style={{flex:1,accentColor:"#6366f1"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#e4e4ea",minWidth:32,textAlign:"right"}}>{isEditing&&sel?.type==="label"?(sel.fontSize||28):uiLabelFs}px</span>
                </div>
              </div>
            </>}

            {/* Measure edit */}
            {isEditing&&sel?.type==="measure"&&<>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12, marginTop:4 }}>
                {L("Measurement Text")}
                <input value={sel.measureText||""} onChange={e=>editSel("measureText",e.target.value)} placeholder="e.g. 15 m"
                  style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"#e4e4ea", fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" }}/>
              </div>
            </>}
          </div>

          {/* Undo/Redo/Clear */}
          <div style={{ display:"flex", gap:6, marginTop:12 }}>
            <button onClick={undo} style={{ flex:1, padding:"7px 0", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"none", color:"#e4e4ea", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>↩ Undo</button>
            <button onClick={redo} style={{ flex:1, padding:"7px 0", borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"none", color:"#e4e4ea", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>↪ Redo</button>
          </div>
          {shapes.length > 0 && <button onClick={clearAll} style={{ width:"100%", marginTop:6, padding:"7px 0", borderRadius:7, border:"1px solid rgba(239,68,68,0.25)", background:"none", color:"#ef4444", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>🗑 Clear All</button>}
          <button onClick={doExport} style={{ width:"100%", marginTop:12, padding:"10px 0", borderRadius:9, border:"none", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 12px rgba(245,158,11,0.3)" }}>⬇ Export PNG</button>

          {/* Shortcuts */}
          <div style={{ marginTop:16, padding:10, borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginTop:0, marginBottom:6 }}>Shortcuts</p>
            {[["Esc","Cancel drawing"],["Del","Delete selected"],["⌘Z","Undo"],["⌘Y","Redo"],["Dbl-click","Finish polygon"],["Drag handle","Reshape"]].map(([k,d],i)=>(
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                <span style={{ fontSize:9, fontWeight:700, color:"#6366f1", background:"rgba(99,102,241,0.1)", padding:"2px 6px", borderRadius:4, fontFamily:"monospace" }}>{k}</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{ flex:1, background:"#080810", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {!photo ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ width:120, height:120, borderRadius:24, background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, margin:"0 auto 16px" }}>🛩</div>
            <p style={{ fontSize:20, fontWeight:800, color:"rgba(255,255,255,0.7)", margin:"0 0 8px" }}>Drone Mark</p>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", maxWidth:380, lineHeight:1.7 }}>Upload a drone photo, draw lot lines, drop branded pins, and add labels.</p>
            <button onClick={()=>fileRef.current?.click()} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"#fff", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>📷 Upload Photo</button>
          </div>
        ) : (
          <div style={{ width:dW*sc, height:dH*sc }}>
            <div style={{ width:natW, height:natH, transform:`scale(${(dW*sc)/natW})`, transformOrigin:"top left", position:"relative" }}>
              <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} crossOrigin="anonymous" draggable={false}/>
              <svg ref={svgRef} viewBox={`0 0 ${natW} ${natH}`} style={{ position:"absolute", inset:0, width:"100%", height:"100%", cursor:tool==="select"?"default":"crosshair" }}
                onClick={onCanvasClick} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onDoubleClick={onDblClick}>
                {shapes.map(renderShape)}
                {renderPreview()}
              </svg>
            </div>
          </div>
        )}
        {photo && (
          <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"#111116", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)" }}>
            <button onClick={()=>setZoom(Math.max(25,zoom-15))} style={{ width:28, height:28, borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", minWidth:40, textAlign:"center" }}>{zoom}%</span>
            <button onClick={()=>setZoom(Math.min(300,zoom+15))} style={{ width:28, height:28, borderRadius:7, border:"1px solid rgba(255,255,255,0.07)", background:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", padding:"0 6px" }}>{natW}×{natH} · {shapes.length} obj</span>
          </div>
        )}
      </div>
      {toast && <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", padding:"10px 22px", background:"#10b981", color:"#fff", fontSize:12, fontWeight:700, borderRadius:10, zIndex:100 }}>✓ {toast}</div>}
    </div>
  );
}
