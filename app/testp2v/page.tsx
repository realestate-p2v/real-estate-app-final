"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import {
  ChevronDown, Download, Upload, Image as ImageIcon, PenTool, Home, DollarSign,
  CheckCircle, X, Loader2, Palette, CreditCard, Phone, Mail, User, MapPin,
  Calendar, Play, FileText, Sparkles, Film, Music, Check, Type, Eye, Layers,
  ZoomIn, ZoomOut, LayoutTemplate, Settings, RotateCcw, Share2, Undo2, Redo2,
  ChevronLeft, ChevronRight, Paintbrush,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", ""); if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", ""); if (c.length < 6) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(c.substring(0,2),16)},${parseInt(c.substring(2,4),16)},${parseInt(c.substring(4,6),16)},${alpha})`;
}
function responsiveSize(base: number, text: string, maxChars: number): number {
  if (!text || text.length <= maxChars) return base;
  return Math.max(base * 0.5, Math.round(base * Math.max(maxChars / text.length, 0.55)));
}
function darken(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#",""),16);
  return `rgb(${Math.max(0,(n>>16)-Math.round(2.55*pct))},${Math.max(0,((n>>8)&0xff)-Math.round(2.55*pct))},${Math.max(0,(n&0xff)-Math.round(2.55*pct))})`;
}
function getBadgeConfig(id: string) {
  const m: Record<string,{text:string;color:string}> = {
    "just-listed":{text:"JUST LISTED",color:"#2563eb"},"open-house":{text:"OPEN HOUSE",color:"#059669"},
    "price-reduced":{text:"PRICE REDUCED",color:"#dc2626"},"just-sold":{text:"JUST SOLD",color:"#d97706"},
  };
  return m[id] || m["just-listed"];
}

/* ═══════════════════════════════════════════════════════
   INFOBAR TEMPLATE
   ═══════════════════════════════════════════════════════ */
function InfoBarTemplate({ size, listingPhoto, headshot, logo, address, beds, baths, sqft, price, agentName, phone, brokerage, badgeText, badgeColor, fontFamily, barColor, accentColor }: any) {
  const w = size.width, h = size.height, isStory = size.id==="story", isPostcard = size.id==="postcard", unit = w/1080;
  const accent = accentColor||"#ffffff", usedBadge = accentColor||badgeColor, barLight = isLightColor(barColor);
  const tp = barLight?"#111827":"#ffffff", ts = barLight?"rgba(17,24,39,0.55)":"rgba(255,255,255,0.55)";
  const tm = barLight?"rgba(17,24,39,0.40)":"rgba(255,255,255,0.35)", dc = barLight?"rgba(0,0,0,0.10)":"rgba(255,255,255,0.12)";
  const an = agentName||"Agent Name", br = brokerage||"Brokerage", ph = phone||"(555) 000-0000";
  const ad = address||"123 Main Street";
  const det = [beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  ·  ")||"3 BD  ·  2 BA  ·  1,800 SF";
  const pr = price?`$${price}`:"$000,000";
  const pp = isPostcard?55:58, barH = h*(1-pp/100);
  const px = Math.round((isPostcard?44:isStory?56:36)*unit), py = Math.round((isStory?28:20)*unit);
  const hs = Math.round(barH*(isStory?0.36:isPostcard?0.78:0.52)), hb = Math.round((isStory?4:isPostcard?4:3)*unit);
  const bH = Math.round(barH*(isStory?0.072:isPostcard?0.16:0.14)), bF = Math.round(barH*(isStory?0.036:isPostcard?0.065:0.052));
  const anF = responsiveSize(Math.round(barH*(isStory?0.080:isPostcard?0.125:0.082)),an,18);
  const brF = responsiveSize(Math.round(barH*(isStory?0.056:isPostcard?0.080:0.055)),br,24);
  const phF = Math.round(barH*(isStory?0.054:isPostcard?0.074:0.052));
  const adF = responsiveSize(Math.round(barH*(isStory?0.072:isPostcard?0.110:0.094)),ad,20);
  const dtF = Math.round(barH*(isStory?0.048:isPostcard?0.074:0.055));
  const prF = Math.round(barH*(isStory?0.105:isPostcard?0.185:0.15));

  const Headshot = () => headshot ? (
    <div style={{width:hs,height:hs,borderRadius:"50%",padding:hb,background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.4)})`:barLight?"linear-gradient(135deg,rgba(0,0,0,0.15),rgba(0,0,0,0.05))":"linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))",flexShrink:0}}>
      <img src={headshot} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block"}} />
    </div>
  ) : <div style={{width:hs,height:hs,borderRadius:"50%",backgroundColor:barLight?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.06)",border:`${hb}px solid ${dc}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><User style={{width:hs*0.38,height:hs*0.38,color:tm}} /></div>;

  const Photo = () => (
    <div style={{position:"absolute",top:0,left:0,right:0,height:`${pp}%`}}>
      {listingPhoto ? <img src={listingPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <div style={{width:"100%",height:"100%",backgroundColor:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageIcon style={{width:64*unit,height:64*unit,color:"rgba(255,255,255,0.12)"}} /></div>}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.round(140*unit),backgroundImage:`linear-gradient(to top,${barColor} 0%,${hexToRgba(barColor,0.85)} 30%,${hexToRgba(barColor,0.4)} 65%,transparent 100%)`}} />
    </div>
  );
  const Badge = () => (
    <div style={{position:"absolute",top:`calc(${pp}% - ${Math.round(bH*0.5)}px)`,right:px,zIndex:10}}>
      <div style={{display:"inline-flex",alignItems:"center",height:bH,padding:`0 ${Math.round(22*unit)}px`,backgroundColor:usedBadge,borderRadius:Math.round(4*unit),boxShadow:`0 ${Math.round(4*unit)}px ${Math.round(20*unit)}px ${hexToRgba(usedBadge,0.45)}`}}>
        <span style={{fontSize:bF,fontWeight:800,color:isLightColor(usedBadge)?"#111":"#fff",letterSpacing:"0.14em",textTransform:"uppercase" as const,lineHeight:1}}>{badgeText}</span>
      </div>
    </div>
  );
  const RightCol = () => (
    <div style={{flex:1,textAlign:"right" as const,minWidth:0,display:"flex",flexDirection:"column" as const,justifyContent:"center"}}>
      <p style={{fontSize:adF,fontWeight:700,color:tp,lineHeight:1.25,margin:0,overflowWrap:"break-word" as const}}>{ad}</p>
      <p style={{fontSize:dtF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(6*unit),letterSpacing:"0.04em"}}>{det}</p>
      <div style={{width:Math.round(60*unit),height:Math.round(2*unit),backgroundColor:accentColor||dc,marginLeft:"auto",marginTop:Math.round(10*unit),marginBottom:Math.round(8*unit),borderRadius:1,opacity:accentColor?0.7:1}} />
      <p style={{fontSize:prF,fontWeight:800,color:accent,lineHeight:1.0,margin:0,letterSpacing:"-0.01em",textShadow:accentColor&&!barLight?`0 ${Math.round(2*unit)}px ${Math.round(12*unit)}px ${hexToRgba(accentColor,0.3)}`:"none"}}>{pr}</p>
    </div>
  );

  if (isStory) {
    return (
      <div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
        <Photo /><Badge />
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${100-pp}%`,backgroundColor:barColor}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:Math.round(3*unit),backgroundColor:accent,opacity:accentColor?0.8:0.15}} />
          <div style={{position:"absolute",inset:0,display:"flex",padding:`${py}px ${Math.round(44*unit)}px ${py}px ${px}px`,gap:Math.round(28*unit)}}>
            <div style={{flex:"0 0 auto",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",maxWidth:"44%",gap:Math.round(12*unit)}}>
              <Headshot />
              <div style={{textAlign:"center" as const,minWidth:0}}>
                <p style={{fontSize:anF,fontWeight:700,color:tp,lineHeight:1.15,margin:0,whiteSpace:"nowrap"}}>{an}</p>
                <p style={{fontSize:brF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(5*unit)}}>{br}</p>
                <p style={{fontSize:phF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(3*unit)}}>{ph}</p>
              </div>
              {logo && <img src={logo} alt="" style={{maxWidth:Math.round(hs*1.3),maxHeight:Math.round(barH*0.14),objectFit:"contain" as const,marginTop:Math.round(6*unit)}} />}
            </div>
            <div style={{width:Math.round(1.5*unit),alignSelf:"stretch",margin:`${Math.round(barH*0.08)}px 0`,backgroundColor:dc,flexShrink:0}} />
            <RightCol />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
      <Photo /><Badge />
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${100-pp}%`,backgroundColor:barColor}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:Math.round(3*unit),backgroundColor:accent,opacity:accentColor?0.8:0.15}} />
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:`${py}px ${px}px`,gap:Math.round(24*unit)}}>
          <div style={{display:"flex",alignItems:"center",gap:Math.round(18*unit),flex:"0 0 auto",maxWidth:"44%"}}>
            <Headshot />
            <div style={{minWidth:0}}>
              <p style={{fontSize:anF,fontWeight:700,color:tp,lineHeight:1.15,margin:0,whiteSpace:"nowrap"}}>{an}</p>
              <p style={{fontSize:brF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(4*unit)}}>{br}</p>
              <p style={{fontSize:phF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(2*unit)}}>{ph}</p>
            </div>
          </div>
          <div style={{width:Math.round(1.5*unit),alignSelf:"stretch",margin:`${Math.round(barH*0.12)}px 0`,backgroundColor:dc,flexShrink:0}} />
          <RightCol />
        </div>
        {logo && <img src={logo} alt="" style={{position:"absolute",bottom:Math.round(20*unit),right:px,maxWidth:Math.round(barH*0.30),maxHeight:Math.round(barH*0.16),objectFit:"contain" as const}} />}
      </div>
    </div>
  );
}

/* ═══ OPEN HOUSE ═══ */
function OpenHouseTemplate({ size, listingPhoto, headshot, logo, address, beds, baths, sqft, price, date, time, agentName, phone, brokerage, fontFamily, barColor, accentColor }: any) {
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff",badgeBg=accentColor||"#059669",barLight=isLightColor(barColor),pad=Math.round(44*unit);
  const ad=address||"123 Main Street",dt=date||"Saturday, March 22",tm2=time||"1:00 PM – 4:00 PM";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  ·  ")||"3 BD  ·  2 BA  ·  1,800 SF";
  const pr=price?`$${price}`:"$000,000",an=agentName||"Agent Name";
  const cl=[brokerage,phone].filter(Boolean).join("  ·  ")||"Brokerage  ·  (555) 000-0000";
  const bFs=Math.round((isStory?68:isPostcard?42:36)*unit),dFs=Math.round((isStory?58:isPostcard?36:32)*unit);
  const tFs=Math.round((isStory?44:isPostcard?28:24)*unit);
  const aFs=responsiveSize(Math.round((isStory?58:isPostcard?36:32)*unit),ad,22);
  const pFs=Math.round((isStory?86:isPostcard?52:46)*unit);
  const agFs=responsiveSize(Math.round((isStory?52:isPostcard?34:30)*unit),an,20);
  const cFs=responsiveSize(Math.round((isStory?40:isPostcard?26:22)*unit),cl,35);
  const hsz=Math.round((isStory?180:isPostcard?120:110)*unit);
  const abH=Math.round((isStory?220:isPostcard?140:130)*unit);
  const ts=`0 ${Math.round(2*unit)}px ${Math.round(8*unit)}px rgba(0,0,0,0.5)`;
  const detFs=Math.round((isStory?44:isPostcard?28:24)*unit);

  return (
    <div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
      {listingPhoto?<img src={listingPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,backgroundColor:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageIcon style={{width:64*unit,height:64*unit,color:"rgba(255,255,255,0.12)"}} /></div>}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 25%,transparent 40%)"}} />
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.35) 20%,transparent 45%)"}} />
      <div style={{position:"absolute",top:0,left:0,right:0,height:isStory?"26%":"34%",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`0 ${pad}px`,textAlign:"center" as const}}>
        <div style={{display:"inline-flex",alignItems:"center",padding:`${Math.round((isStory?16:8)*unit)}px ${Math.round((isStory?44:24)*unit)}px`,backgroundColor:badgeBg,borderRadius:Math.round(6*unit),boxShadow:`0 ${Math.round(4*unit)}px ${Math.round(24*unit)}px ${hexToRgba(badgeBg,0.4)}`}}>
          <span style={{fontSize:bFs,fontWeight:800,color:isLightColor(badgeBg)?"#111":"#fff",letterSpacing:"0.16em",textTransform:"uppercase" as const,lineHeight:1}}>Open House</span>
        </div>
        <p style={{fontSize:dFs,fontWeight:800,color:"#fff",margin:0,marginTop:Math.round(18*unit),textShadow:ts}}>{dt}</p>
        <p style={{fontSize:tFs,fontWeight:500,color:"rgba(255,255,255,0.75)",margin:0,marginTop:Math.round(6*unit),textShadow:ts}}>{tm2}</p>
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:`0 ${pad}px`}}>
        <div style={{textAlign:"center" as const,marginBottom:Math.round(14*unit)}}>
          <p style={{fontSize:aFs,fontWeight:700,color:"#fff",lineHeight:1.2,margin:0,textShadow:ts}}>{ad}</p>
          <p style={{fontSize:detFs,fontWeight:500,color:"rgba(255,255,255,0.70)",margin:0,marginTop:Math.round(6*unit),textShadow:ts}}>{det}</p>
          <div style={{width:Math.round(50*unit),height:Math.round(2*unit),backgroundColor:accentColor||"rgba(255,255,255,0.20)",margin:`${Math.round(10*unit)}px auto ${Math.round(8*unit)}px`,borderRadius:1,opacity:accentColor?0.7:1}} />
          <p style={{fontSize:pFs,fontWeight:800,color:accent,lineHeight:1.0,margin:0,textShadow:accentColor?`0 ${Math.round(2*unit)}px ${Math.round(14*unit)}px ${hexToRgba(accentColor,0.35)}`:ts}}>{pr}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(14*unit),height:abH,padding:`0 ${Math.round(24*unit)}px`,backgroundColor:hexToRgba(barColor,0.88),borderRadius:`${Math.round(14*unit)}px ${Math.round(14*unit)}px 0 0`}}>
          {headshot?<img src={headshot} alt="" style={{width:hsz,height:hsz,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`${Math.round(2.5*unit)}px solid ${accentColor?hexToRgba(accentColor,0.5):"rgba(255,255,255,0.25)"}`}} />:<div style={{width:hsz,height:hsz,borderRadius:"50%",backgroundColor:barLight?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><User style={{width:hsz*0.38,height:hsz*0.38,color:"rgba(255,255,255,0.25)"}} /></div>}
          <div style={{minWidth:0}}><p style={{fontSize:agFs,fontWeight:700,color:barLight?"#111827":"#fff",margin:0,whiteSpace:"nowrap"}}>{an}</p><p style={{fontSize:cFs,fontWeight:500,color:barLight?"rgba(17,24,39,0.50)":"rgba(255,255,255,0.50)",margin:0,marginTop:Math.round(2*unit)}}>{cl}</p></div>
          {logo&&<img src={logo} alt="" style={{maxWidth:Math.round((isStory?260:150)*unit),maxHeight:Math.round((isStory?110:64)*unit),objectFit:"contain" as const,flexShrink:0,marginLeft:"auto"}} />}
        </div>
      </div>
    </div>
  );
}

/* ═══ YARD SIGN SPLIT BAR ═══ */
function YardSignSplitBar({width,height,headshot,logo,agentName,phone,email,brokerage,officeName,officePhone,headerText,topColor,bottomColor,fontFamily,qrDataUrl,bulletPoints}:any) {
  const topH=Math.round(height*0.15),bottomH=Math.round(height*0.15),centerH=height-topH-bottomH;
  const tL=isLightColor(topColor),bL=isLightColor(bottomColor),u=width/5400;
  const nt=agentName||"AGENT NAME",pt=phone||"321-555-4321",ot=officeName||brokerage||"OFFICE NAME";
  const hSz=Math.round(centerH*0.42),hdrSz=Math.round(topH*0.48);
  const nSz=responsiveSize(Math.round(centerH*0.072),nt,16),pSz=Math.round(centerH*0.058),dSz=Math.round(centerH*0.038);
  const bNSz=responsiveSize(Math.round(bottomH*0.30),ot,18),bPSz=Math.round(bottomH*0.22);
  const tC=tL?"#000":"#fff",bC=bL?"#000":"#fff",tR=tL?"rgba(0,0,0,0.20)":"rgba(255,255,255,0.30)",bR=bL?"rgba(0,0,0,0.15)":"rgba(255,255,255,0.25)";
  return (
    <div style={{width,height,fontFamily,display:"flex",flexDirection:"column" as const}}>
      <div style={{height:topH,backgroundColor:topColor,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:Math.round(width*0.03)}}><div style={{width:Math.round(width*0.07),height:Math.round(3*u),backgroundColor:tR}} /><p style={{fontSize:hdrSz,fontWeight:900,color:tC,letterSpacing:"0.14em",textTransform:"uppercase" as const,margin:0,lineHeight:1}}>{headerText||"FOR SALE"}</p><div style={{width:Math.round(width*0.07),height:Math.round(3*u),backgroundColor:tR}} /></div>
      </div>
      <div style={{height:centerH,backgroundColor:"#fff",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(centerH*0.06)}px ${Math.round(width*0.08)}px`,gap:Math.round(centerH*0.03)}}>
        {headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`}} />:<div style={{width:hSz,height:hSz,backgroundColor:"#f3f4f6",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:"#9ca3af"}} /></div>}
        <p style={{fontSize:nSz,fontWeight:800,color:"#111",margin:0,textAlign:"center" as const,letterSpacing:"0.05em",textTransform:"uppercase" as const,whiteSpace:"nowrap"}}>{nt}</p>
        <div style={{width:Math.round(width*0.10),height:Math.round(4*u),backgroundColor:topColor,borderRadius:2}} />
        <p style={{fontSize:pSz,fontWeight:600,color:"#333",margin:0,textAlign:"center" as const}}>{pt}</p>
        {email&&<p style={{fontSize:dSz,fontWeight:400,color:"#666",margin:0,textAlign:"center" as const}}>{email}</p>}
        {bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.02)}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:dSz,fontWeight:600,color:"#444",textTransform:"uppercase" as const}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.01)}px`,color:topColor}}>·</span>}{bp}</span>))}</div>}
        {(logo||qrDataUrl)&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.03),marginTop:Math.round(centerH*0.01)}}>{logo&&<img src={logo} alt="" style={{maxHeight:Math.round(centerH*0.12),maxWidth:Math.round(width*0.25),objectFit:"contain" as const}} />}{qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(centerH*0.22),height:Math.round(centerH*0.22),borderRadius:Math.round(4*u)}} />}</div>}
      </div>
      <div style={{height:bottomH,backgroundColor:bottomColor,display:"flex",alignItems:"center",justifyContent:"center",padding:`0 ${Math.round(width*0.06)}px`}}>
        <div style={{textAlign:"center" as const}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.025)}}><div style={{width:Math.round(width*0.05),height:Math.round(2*u),backgroundColor:bR}} /><p style={{fontSize:bNSz,fontWeight:800,color:bC,margin:0,letterSpacing:"0.05em"}}>{ot}</p><div style={{width:Math.round(width*0.05),height:Math.round(2*u),backgroundColor:bR}} /></div>{officePhone&&<p style={{fontSize:bPSz,fontWeight:600,color:bC,margin:0,marginTop:Math.round(height*0.008)}}>{officePhone}</p>}</div>
      </div>
    </div>
  );
}

/* ═══ YARD SIGN SIDEBAR ═══ */
function YardSignSidebar({width,height,headshot,logo,agentName,phone,email,brokerage,website,headerText,sidebarColor,mainBgColor,fontFamily,qrDataUrl,bulletPoints}:any) {
  const sW=Math.round(width*0.16),mW=width-sW,sL=isLightColor(sidebarColor),mL=isLightColor(mainBgColor);
  const mT=mL?"#111":"#fff",mM=mL?"#555":"rgba(255,255,255,0.55)",u=width/5400;
  const nt=agentName||"AGENT NAME",pt=phone||"206.866.6678",bt=brokerage||"BROKERAGE";
  const hSz=Math.round(mW*0.38),hdrSz=Math.round(height*0.042),nSz=responsiveSize(Math.round(height*0.044),nt,16);
  const pSz=Math.round(height*0.034),dSz=Math.round(height*0.022),bSz=Math.round(height*0.020),lSz=Math.round(sW*0.55);
  const sC=sL?"#000":"#fff",sM=sL?"rgba(0,0,0,0.20)":"rgba(255,255,255,0.20)";
  return (
    <div style={{width,height,fontFamily,display:"flex"}}>
      <div style={{width:sW,height,background:`linear-gradient(to bottom,${sidebarColor},${darken(sidebarColor,12)})`,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"space-between",padding:`${Math.round(height*0.04)}px ${Math.round(sW*0.08)}px`}}>
        {logo&&<img src={logo} alt="" style={{width:lSz,height:lSz,objectFit:"contain" as const}} />}
        <p style={{fontSize:Math.round(sW*0.20),fontWeight:800,color:sC,writingMode:"vertical-rl" as any,textOrientation:"mixed" as any,letterSpacing:"0.14em",textTransform:"uppercase" as const,opacity:0.9}}>{bt}</p>
        {logo&&<img src={logo} alt="" style={{width:lSz,height:lSz,objectFit:"contain" as const}} />}
        {!logo&&<div style={{width:Math.round(sW*0.4),height:Math.round(2*u),backgroundColor:sM}} />}
      </div>
      <div style={{width:mW,height,backgroundColor:mainBgColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(height*0.02)}px ${Math.round(width*0.04)}px`,textAlign:"center" as const,position:"relative",gap:Math.round(height*0.008)}}>
        <div style={{backgroundColor:sidebarColor,padding:`${Math.round(height*0.012)}px ${Math.round(width*0.06)}px`,borderRadius:Math.round(6*u),marginBottom:Math.round(height*0.012)}}><p style={{fontSize:hdrSz,fontWeight:900,color:sL?"#000":"#fff",letterSpacing:"0.12em",textTransform:"uppercase" as const,margin:0,lineHeight:1}}>{headerText||"FOR SALE"}</p></div>
        {headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${sidebarColor}`}} />:<div style={{width:hSz,height:hSz,borderRadius:"50%",backgroundColor:mL?"#e5e7eb":"rgba(255,255,255,0.08)",border:`${Math.round(6*u)}px solid ${sidebarColor}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:mM}} /></div>}
        <div style={{width:Math.round(width*0.08),height:Math.round(3*u),backgroundColor:sidebarColor,opacity:0.4}} />
        <p style={{fontSize:nSz,fontWeight:800,color:mT,margin:0,letterSpacing:"0.06em",textTransform:"uppercase" as const,whiteSpace:"nowrap"}}>{nt}</p>
        <p style={{fontSize:dSz,color:mM,margin:0,textTransform:"uppercase" as const,letterSpacing:"0.08em",fontWeight:500}}>Real Estate Agent</p>
        <div style={{width:Math.round(width*0.08),height:Math.round(3*u),backgroundColor:sidebarColor,opacity:0.4}} />
        <p style={{fontSize:pSz,fontWeight:700,color:mT,margin:0}}>{pt}</p>
        {website&&<p style={{fontSize:dSz,color:mM,margin:0,marginTop:Math.round(height*0.008)}}>{website}</p>}
        {email&&<p style={{fontSize:dSz,color:mM,margin:0,marginTop:Math.round(height*0.005)}}>{email}</p>}
        {bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.015),marginTop:Math.round(height*0.015),flexWrap:"wrap" as const}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:bSz,fontWeight:600,color:mT,opacity:0.7}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.008)}px`,color:sidebarColor}}>·</span>}{bp}</span>))}</div>}
        {qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(height*0.12),height:Math.round(height*0.12),marginTop:Math.round(height*0.015),borderRadius:Math.round(4*u)}} />}
      </div>
    </div>
  );
}

/* ═══ YARD SIGN TOP HEAVY ═══ */
function YardSignTopHeavy({width,height,headshot,logo,agentName,phone,email,brokerage,headerText,topColor,bottomColor,fontFamily,qrDataUrl,bulletPoints}:any) {
  const topH=Math.round(height*0.38),bottomH=height-topH,tL=isLightColor(topColor),bL=isLightColor(bottomColor);
  const u=width/5400,hdrSz=Math.round(topH*0.28),hSz=Math.round(bottomH*0.38);
  const bT=bL?"#111":"#fff",bM=bL?"#555":"rgba(255,255,255,0.65)";
  const nt=agentName||"Agent Name",pt=phone||"305.555.7315",bt=brokerage||"";
  const nSz=responsiveSize(Math.round(bottomH*0.08),nt,16),pSz=Math.round(bottomH*0.065),dSz=Math.round(bottomH*0.04);
  return (
    <div style={{width,height,fontFamily,display:"flex",flexDirection:"column" as const}}>
      <div style={{height:topH,backgroundColor:topColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:Math.round(width*0.06),textAlign:"center" as const}}>
        <p style={{fontSize:hdrSz,fontWeight:900,color:tL?"#000":"#fff",letterSpacing:"0.05em",textTransform:"uppercase" as const,lineHeight:1.0,margin:0}}>{headerText||"FOR SALE"}</p>
        {logo&&<img src={logo} alt="" style={{maxHeight:Math.round(topH*0.22),maxWidth:Math.round(width*0.45),objectFit:"contain" as const,marginTop:Math.round(topH*0.08)}} />}
        {!logo&&bt&&<p style={{fontSize:Math.round(topH*0.10),fontWeight:700,color:tL?"#000":"#fff",marginTop:Math.round(topH*0.06),textTransform:"uppercase" as const,letterSpacing:"0.08em",margin:0}}>{bt}</p>}
      </div>
      <div style={{height:bottomH,backgroundColor:bottomColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(width*0.03)}px ${Math.round(width*0.06)}px`,textAlign:"center" as const,gap:Math.round(bottomH*0.01)}}>
        {headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`}} />:<div style={{width:hSz,height:hSz,backgroundColor:bL?"#e5e7eb":"rgba(255,255,255,0.08)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:bM}} /></div>}
        <p style={{fontSize:nSz,fontWeight:800,color:bT,lineHeight:1.1,margin:0}}>{nt}</p>
        <p style={{fontSize:dSz,color:bM,textTransform:"uppercase" as const,letterSpacing:"0.05em",margin:0}}>Real Estate Agent</p>
        <p style={{fontSize:pSz,fontWeight:700,color:bT,margin:0}}>{pt}</p>
        {email&&<p style={{fontSize:dSz,color:bM,margin:0}}>{email}</p>}
        {bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.02),marginTop:Math.round(bottomH*0.015),flexWrap:"wrap" as const}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:dSz,fontWeight:600,color:bT,opacity:0.7}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.008)}px`,color:topColor}}>·</span>}{bp}</span>))}</div>}
        {qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(bottomH*0.18),height:Math.round(bottomH*0.18),borderRadius:4}} />}
      </div>
    </div>
  );
}

/* ═══ PROPERTY PDF PAGE ═══ */
function PropertyPdfPage({pageNumber,address,cityStateZip,price,beds,baths,sqft,description,features,photos,accentColor,fontFamily}:any) {
  const W=2550,H=3300,accent=accentColor||"#0e7490",hBar=14,margin=80;
  const fLines=features?features.split("\n").filter(Boolean):[];
  const dLines=description?description.split("\n").filter(Boolean):[];
  const estFH=fLines.length*80+(fLines.length>0?90:0);
  const maxDL=Math.floor((1400-estFH)/60);
  let p1D=dLines,ovD:string[]=[];
  if(dLines.length>maxDL&&maxDL>0){p1D=dLines.slice(0,maxDL);ovD=dLines.slice(maxDL);}
  if(pageNumber===0){
    const hp=photos[0]||null,p2=photos[1]||null,p3=photos[2]||null;
    const aT=address||"Property Name",cT=cityStateZip||"City, State",pT=price?`$${price}`:"$000,000";
    const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  ·  ");
    const heroH=Math.round(H*0.42),lW=Math.round(W*0.48),rW=W-lW,pd=100;
    return (
      <div style={{width:W,height:H,backgroundColor:"#fff",fontFamily,position:"relative",padding:margin}}>
        <div style={{position:"absolute",top:margin,left:margin,right:margin,height:hBar,backgroundColor:accent}} />
        <div style={{position:"absolute",top:margin+hBar,left:margin,right:margin,height:heroH,overflow:"hidden"}}>
          {hp?<img src={hp} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",backgroundColor:"#f0efea",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:56}}>HERO PHOTO</span></div>}
        </div>
        <div style={{position:"absolute",top:heroH+hBar+margin,left:margin,right:margin,bottom:margin+hBar,display:"flex"}}>
          <div style={{width:lW,padding:`${pd*0.6}px ${pd*0.6}px ${pd*0.5}px ${pd*0.3}px`,display:"flex",flexDirection:"column" as const,justifyContent:"flex-start",overflow:"hidden"}}>
            <p style={{fontSize:50,color:accent,fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase" as const,margin:0}}>Introducing</p>
            <p style={{fontSize:responsiveSize(102,aT,18),color:"#1a1a1a",fontWeight:800,lineHeight:1.05,margin:0,marginTop:12}}>{aT}</p>
            <p style={{fontSize:42,color:"#666",fontWeight:500,margin:0,marginTop:10}}>{cT}</p>
            <div style={{width:70,height:4,backgroundColor:accent,marginTop:28,borderRadius:2}} />
            <p style={{fontSize:112,fontWeight:800,color:accent,margin:0,marginTop:14,lineHeight:1.0}}>{pT}</p>
            {det&&<p style={{fontSize:42,color:"#555",fontWeight:600,margin:0,marginTop:10,letterSpacing:"0.06em"}}>{det}</p>}
            {fLines.length>0&&<div style={{marginTop:36}}><p style={{fontSize:38,fontWeight:700,color:"#333",letterSpacing:"0.10em",textTransform:"uppercase" as const,margin:0,marginBottom:16}}>Key Features</p><div style={{fontSize:38,color:"#444",lineHeight:2.0}}>{fLines.map((f:string,i:number)=>(<div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}><span style={{color:accent,flexShrink:0,fontWeight:700,fontSize:28,marginTop:5}}>—</span><span style={{fontWeight:500}}>{f.replace(/^[•\-*]\s*/,"")}</span></div>))}</div></div>}
            {p1D.length>0&&<div style={{marginTop:32}}><p style={{fontSize:38,fontWeight:700,color:"#333",letterSpacing:"0.10em",textTransform:"uppercase" as const,margin:0,marginBottom:14}}>About This Property</p><div style={{fontSize:38,color:"#555",lineHeight:1.7}}>{p1D.map((p:string,i:number)=><p key={i} style={{margin:0,marginBottom:10}}>{p}</p>)}</div></div>}
          </div>
          <div style={{width:3,backgroundColor:accent,opacity:0.15,marginTop:Math.round(pd*0.5),marginBottom:Math.round(pd*0.5),flexShrink:0}} />
          <div style={{width:rW,display:"flex",flexDirection:"column" as const,padding:`${Math.round(pd*0.4)}px ${Math.round(pd*0.3)}px ${Math.round(pd*0.4)}px ${Math.round(pd*0.4)}px`,gap:10}}>
            <div style={{flex:1,borderRadius:16,overflow:"hidden"}}>{p2?<img src={p2} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",backgroundColor:"#f0efea",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:44}}>Photo 2</span></div>}</div>
            <div style={{flex:1,borderRadius:16,overflow:"hidden"}}>{p3?<img src={p3} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",backgroundColor:"#f5f5f0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:44}}>Photo 3</span></div>}</div>
          </div>
        </div>
        <div style={{position:"absolute",bottom:margin,left:margin,right:margin,height:hBar,backgroundColor:accent}} />
      </div>
    );
  }
  // Grid pages
  const startIdx=3+(pageNumber-1)*6;
  const pgPhotos=photos.slice(startIdx,startIdx+6);
  const pgPad=100,pgGap=24,gridH=H-pgPad*2-80-hBar,colW=Math.round((W-pgPad*2-pgGap)/2),rows=3;
  const photoH=Math.round((gridH-pgGap*(rows-1))/rows);
  return (
    <div style={{width:W,height:H,backgroundColor:"#fff",fontFamily,position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:hBar,backgroundColor:accent}} />
      <div style={{padding:`${pgPad+hBar}px ${pgPad}px ${pgPad}px`,display:"flex",gap:pgGap}}>
        <div style={{width:colW,display:"flex",flexDirection:"column" as const,gap:pgGap}}>{[0,2,4].map(idx=>{const p=pgPhotos[idx];return <div key={idx} style={{height:photoH,borderRadius:16,overflow:"hidden",backgroundColor:p?undefined:"#f5f5f0"}}>{p&&<img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />}</div>;})}</div>
        <div style={{width:colW,display:"flex",flexDirection:"column" as const,gap:pgGap}}>{[1,3,5].map(idx=>{const p=pgPhotos[idx];return <div key={idx} style={{height:photoH,borderRadius:16,overflow:"hidden",backgroundColor:p?undefined:"#f5f5f0"}}>{p&&<img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />}</div>;})}</div>
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:hBar,backgroundColor:accent}} />
    </div>
  );
}

/* ═══ BRANDING CARD TEMPLATE ═══ */
function BrandingCardTemplate({orientation,logo,headshot,agentName,phone:ph2,email,brokerage,tagline,website,address:addr,cityState,price:pr2,features,bgColor,accentColor,bgPhoto,fontFamily}:any) {
  const w=orientation.width,h=orientation.height,isV=orientation.id==="vertical";
  const isLBg=bgColor&&!bgPhoto?isLightColor(bgColor):false;
  const tC=isLBg?"#1a1a2e":"#fff",tM=isLBg?"rgba(26,26,46,0.50)":"rgba(255,255,255,0.55)";
  const bC=isLBg?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.12)",accent=accentColor||tC;
  const nt=agentName||"Agent Name",hasProp=!!(addr||pr2);
  if(isV){
    const u=w/1080,inset=Math.round(24*u),rad=Math.round(24*u),bd=Math.round(3*u),pad=Math.round(36*u);
    const hSz=Math.round(560*u),fb=Math.round(8*u),nFs=responsiveSize(Math.round(80*u),nt,14);
    return (
      <div style={{width:w,height:h,background:"transparent",position:"relative"}}>
        <div style={{position:"absolute",top:inset,left:inset,right:inset,bottom:inset,borderRadius:rad,border:`${bd}px solid ${bC}`,backgroundColor:bgColor||"#14532d",overflow:"hidden",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:pad,fontFamily}}>
          {bgPhoto&&<><img src={bgPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} /><div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.55)"}} /></>}
          <div style={{position:"relative",zIndex:1,textAlign:"center" as const,width:"100%",display:"flex",flexDirection:"column" as const,alignItems:"center",gap:Math.round(10*u)}}>
            {logo&&<img src={logo} alt="" style={{maxWidth:Math.round(400*u),maxHeight:Math.round(160*u),objectFit:"contain" as const,marginBottom:Math.round(14*u)}} />}
            {headshot?<div style={{padding:fb,background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.3)})`:bC,borderRadius:Math.round(20*u)}}><img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:Math.round(14*u),display:"block"}} /></div>:<div style={{width:hSz,height:hSz,backgroundColor:"rgba(255,255,255,0.06)",border:`${fb}px solid ${bC}`,borderRadius:Math.round(20*u),display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:100*u,height:100*u,color:tM}} /></div>}
            <p style={{fontSize:nFs,fontWeight:800,color:accent,margin:0,marginTop:Math.round(18*u),whiteSpace:"nowrap"}}>{nt}</p>
            <div style={{width:Math.round(70*u),height:3,backgroundColor:accent,opacity:0.4,margin:`${Math.round(6*u)}px 0`}} />
            {brokerage&&<p style={{fontSize:Math.round(40*u),color:tM,margin:0,fontWeight:500}}>{brokerage}</p>}
            <div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:Math.round(8*u),marginTop:Math.round(8*u)}}>
              {ph2&&<span style={{fontSize:Math.round(44*u),color:tC,fontWeight:700}}>{ph2}</span>}
              {email&&<span style={{fontSize:Math.round(38*u),color:tC,opacity:0.85}}>{email}</span>}
            </div>
            {website&&<><div style={{width:"60%",height:1,backgroundColor:bC,marginTop:Math.round(10*u)}} /><p style={{fontSize:Math.round(40*u),color:tC,fontWeight:600,margin:0,marginTop:Math.round(6*u)}}>{website}</p></>}
            {tagline&&<p style={{fontSize:Math.round(34*u),color:accentColor||tM,fontStyle:"italic",margin:0,marginTop:Math.round(8*u)}}>{tagline}</p>}
            {hasProp&&<div style={{marginTop:Math.round(24*u),paddingTop:Math.round(20*u),borderTop:`2px solid ${bC}`,width:"80%"}}>{addr&&<p style={{fontSize:responsiveSize(Math.round(60*u),addr,16),fontWeight:700,color:tC,margin:0,lineHeight:1.1}}>{addr}</p>}{cityState&&<p style={{fontSize:Math.round(40*u),fontWeight:500,color:tM,margin:0,marginTop:Math.round(8*u)}}>{cityState}</p>}{pr2&&<p style={{fontSize:Math.round(56*u),fontWeight:800,color:accent,margin:0,marginTop:Math.round(14*u)}}>${pr2}</p>}{features&&<div style={{marginTop:Math.round(12*u),color:tM,fontSize:Math.round(34*u),lineHeight:1.6}}>{features.split("\n").filter(Boolean).map((f:string,i:number)=><div key={i}>{f}</div>)}</div>}</div>}
          </div>
        </div>
      </div>
    );
  }
  // Landscape
  const u=w/1920,uh=h/1080,inset=Math.round(36*u),rad=Math.round(20*u),bdW=Math.round(3*u);
  const padX=Math.round(80*u),padY=Math.round(60*uh),innerH=h-inset*2-bdW*2;
  const hSz=Math.round(innerH*0.62),hBd=Math.round(10*u),nFs=responsiveSize(Math.round(h*0.095),nt,14);
  const cC=isLBg?"#111":"#fff",cM=isLBg?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.75)";
  const aBg=accentColor||(isLBg?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.08)");
  return (
    <div style={{width:w,height:h,background:"transparent",position:"relative"}}>
      <div style={{position:"absolute",top:inset,left:inset,right:inset,bottom:inset,borderRadius:rad,border:`${bdW}px solid ${bC}`,backgroundColor:bgColor||"#14532d",overflow:"hidden",fontFamily}}>
        {bgPhoto&&<><img src={bgPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} /><div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.55)"}} /></>}
        {!bgPhoto&&<><div style={{position:"absolute",top:-Math.round(h*0.15),right:-Math.round(w*0.02),width:Math.round(w*0.18),height:Math.round(h*0.55),backgroundColor:aBg,transform:"rotate(25deg)",opacity:0.4}} /><div style={{position:"absolute",top:Math.round(h*0.35),right:-Math.round(w*0.05),width:Math.round(w*0.15),height:Math.round(h*0.55),backgroundColor:aBg,transform:"rotate(25deg)",opacity:0.25}} /></>}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",width:"100%",height:"100%",padding:`${padY}px ${padX}px`}}>
          <div style={{flex:1,display:"flex",flexDirection:"column" as const,justifyContent:"center",minWidth:0,paddingRight:Math.round(40*u)}}>
            {(logo||brokerage)&&<div style={{display:"flex",alignItems:"center",gap:Math.round(14*u),marginBottom:Math.round(28*u)}}>{logo&&<img src={logo} alt="" style={{maxWidth:Math.round((w-inset*2)*0.08),maxHeight:Math.round(innerH*0.14),objectFit:"contain" as const}} />}{brokerage&&<p style={{fontSize:Math.round(h*0.038),color:cM,margin:0,fontWeight:600}}>{brokerage}</p>}</div>}
            <p style={{fontSize:nFs,fontWeight:900,color:cC,margin:0,lineHeight:1.05,whiteSpace:"nowrap",textTransform:"uppercase" as const}}>{nt}</p>
            <p style={{fontSize:Math.round(h*0.048),fontWeight:500,color:cM,margin:0,marginTop:Math.round(h*0.008)}}>{tagline||"Real Estate Agent"}</p>
            <div style={{width:Math.round(60*u),height:Math.round(5*u),backgroundColor:accent,marginTop:Math.round(h*0.035),marginBottom:Math.round(h*0.03),borderRadius:3}} />
            <div style={{display:"flex",flexDirection:"column" as const,gap:Math.round(h*0.018)}}>
              {ph2&&<p style={{fontSize:Math.round(h*0.055),color:cC,fontWeight:700,margin:0}}>{ph2}</p>}
              {email&&<p style={{fontSize:Math.round(h*0.046),color:cC,fontWeight:500,margin:0,opacity:0.9}}>{email}</p>}
              {website&&<p style={{fontSize:Math.round(h*0.042),color:cC,fontWeight:500,margin:0,opacity:0.8}}>{website}</p>}
            </div>
            {hasProp&&<div style={{marginTop:Math.round(h*0.03),paddingTop:Math.round(h*0.02),borderTop:`2px solid ${bC}`}}><div style={{display:"flex",alignItems:"baseline",gap:Math.round(16*u),flexWrap:"wrap" as const}}>{addr&&<span style={{fontSize:Math.round(h*0.040),fontWeight:600,color:cC}}>{addr}{cityState?`, ${cityState}`:""}</span>}{pr2&&<span style={{fontSize:Math.round(h*0.050),fontWeight:800,color:accent}}>${pr2}</span>}</div>{features&&<div style={{marginTop:Math.round(h*0.008),color:tM,fontSize:Math.round(h*0.032),lineHeight:1.5}}>{features.split("\n").filter(Boolean).map((f:string,i:number)=><span key={i}>{i>0?"  ·  ":""}{f}</span>)}</div>}</div>}
          </div>
          <div style={{flexShrink:0}}>
            {headshot?<div style={{padding:hBd,borderRadius:"50%",background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.4)})`:`linear-gradient(135deg,${bC},transparent)`,boxShadow:`0 ${Math.round(10*u)}px ${Math.round(36*u)}px rgba(0,0,0,0.25)`}}><img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",display:"block"}} /></div>:<div style={{width:hSz,height:hSz,borderRadius:"50%",backgroundColor:"rgba(255,255,255,0.04)",border:`${hBd}px solid ${bC}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:tM}} /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const TEMPLATES = [
  {id:"just-listed",label:"Just Listed",icon:Home,color:"#10b981"},{id:"open-house",label:"Open House",icon:Calendar,color:"#6366f1"},
  {id:"price-reduced",label:"Price Reduced",icon:DollarSign,color:"#f59e0b"},{id:"just-sold",label:"Just Sold",icon:CheckCircle,color:"#ef4444"},
];
const SIZES = [
  {id:"square",label:"Square",sublabel:"1080×1080",width:1080,height:1080},
  {id:"story",label:"Story",sublabel:"1080×1920",width:1080,height:1920},
  {id:"postcard",label:"Postcard",sublabel:"1800×1200",width:1800,height:1200},
];
const YARD_SIGN_SIZES = [{id:"18x24",label:'18×24"',sublabel:"Standard",width:5400,height:7200},{id:"24x36",label:'24×36"',sublabel:"Large",width:7200,height:10800}];
const BRAND_ORIENTATIONS = [{id:"landscape",label:"Landscape",sublabel:"1920×1080",width:1920,height:1080},{id:"vertical",label:"Vertical",sublabel:"1080×1920",width:1080,height:1920}];
const TABS = [{id:"templates",label:"Listing Graphics",icon:PenTool},{id:"branding-card",label:"Branding",icon:CreditCard},{id:"yard-sign",label:"Yard Sign",icon:MapPin},{id:"property-pdf",label:"Property Sheet",icon:FileText}];
const LEFT_PANELS: Record<string,{id:string;label:string;icon:any}[]> = {
  templates:[{id:"templates",label:"Templates",icon:LayoutTemplate},{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],
  "yard-sign":[{id:"design",label:"Design",icon:LayoutTemplate},{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Colors",icon:Palette}],
  "branding-card":[{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],
  "property-pdf":[{id:"text",label:"Details",icon:Type},{id:"photos",label:"Photos",icon:ImageIcon},{id:"styles",label:"Styles",icon:Palette}],
};
const BROKERAGE_COLORS = [{hex:"#b40101",label:"KW Red"},{hex:"#666666",label:"KW Gray"},{hex:"#003399",label:"CB Blue"},{hex:"#012169",label:"CB Navy"},{hex:"#003da5",label:"RM Blue"},{hex:"#dc1c2e",label:"RM Red"},{hex:"#b5985a",label:"C21 Gold"},{hex:"#1c1c1c",label:"C21 Black"},{hex:"#000000",label:"CMP Black"},{hex:"#002349",label:"SIR Blue"},{hex:"#552448",label:"BH Purple"},{hex:"#1c3f6e",label:"EXP Blue"},{hex:"#006341",label:"HH Green"},{hex:"#d4272e",label:"EXT Red"},{hex:"#e31937",label:"ERA Red"},{hex:"#a02021",label:"RF Red"},{hex:"#ffffff",label:"White"}];
const ACCENT_COLORS = ["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#71717a","#ffffff","#000000"];
const FONT_OPTIONS = [{id:"serif",label:"Classic Serif",family:"Georgia, 'Times New Roman', serif",sample:"Elegant Home"},{id:"sans",label:"Clean Sans",family:"'Helvetica Neue', Arial, sans-serif",sample:"Modern Living"},{id:"modern",label:"Modern",family:"'Trebuchet MS', 'Gill Sans', sans-serif",sample:"Fresh Start"},{id:"elegant",label:"Elegant",family:"'Palatino Linotype', 'Book Antiqua', Palatino, serif",sample:"Luxury Estate"}];
const YARD_DESIGNS = [{id:"split-bar",label:"Split Bar",desc:"Top & bottom bars"},{id:"sidebar",label:"Sidebar",desc:"Vertical side accent"},{id:"top-heavy",label:"Top Heavy",desc:"Large header block"}];
const DEMO_PHOTOS = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"];
const DEMO_PROPERTIES = [
  {id:"p1",address:"742 Evergreen Terrace",city:"Springfield",state:"IL",beds:"4",baths:"3",sqft:"2,450",price:"485,000",features:"Hardwood floors\nUpdated kitchen\nLarge backyard"},
  {id:"p2",address:"221B Baker Street",city:"London",state:"UK",beds:"2",baths:"1",sqft:"1,200",price:"1,250,000",features:"Historic building\nFireplace\nCity views"},
  {id:"p3",address:"10 Ocean Drive",city:"Miami Beach",state:"FL",beds:"5",baths:"4",sqft:"3,800",price:"2,100,000",features:"Oceanfront\nPool & spa\nSmart home"},
];

/* ═══ SHARED UI COMPONENTS ═══ */
function UploadZone({label,imageUrl,onUpload,onClear,uploading,compact}:{label:string;imageUrl:string|null;onUpload:(f:File)=>void;onClear:()=>void;uploading:boolean;compact?:boolean}) {
  const ref=useRef<HTMLInputElement>(null);
  const [drag,setDrag]=useState(false);
  if(imageUrl) return (
    <div className="group" style={{position:"relative",borderRadius:12,overflow:"hidden",aspectRatio:compact?"1":"4/3"}}>
      <img src={imageUrl} alt={label} style={{width:"100%",height:"100%",objectFit:"cover"}} />
      <div className="ghov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",opacity:0,transition:"opacity 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={onClear} style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#333" /></button></div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"5px 8px",background:"linear-gradient(transparent,rgba(0,0,0,0.6))",fontSize:10,color:"#fff",fontWeight:600}}>{label}</div>
    </div>
  );
  return (
    <div onClick={()=>ref.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)onUpload(f);}}
      style={{aspectRatio:compact?"1":"4/3",borderRadius:12,border:`2px dashed ${drag?"var(--sa)":"rgba(255,255,255,0.10)"}`,background:drag?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.02)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",transition:"all 0.2s"}}>
      {uploading?<Loader2 size={18} color="rgba(255,255,255,0.3)" className="animate-spin" />:<><Upload size={16} color="rgba(255,255,255,0.25)" /><span style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:600}}>{label}</span></>}
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)onUpload(f);e.target.value="";}} />
    </div>
  );
}
function Section({title,icon:Icon,defaultOpen=true,children}:{title:string;icon?:any;defaultOpen?:boolean;children:ReactNode}) {
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"13px 20px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:700,fontFamily:"var(--sf)"}}>
        {Icon&&<Icon size={14} color="rgba(255,255,255,0.35)" />}<span style={{flex:1,textAlign:"left"}}>{title}</span><ChevronDown size={13} color="rgba(255,255,255,0.25)" style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}} />
      </button>
      {open&&<div style={{padding:"0 20px 16px"}}>{children}</div>}
    </div>
  );
}
function ColorPicker({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  return (<div style={{display:"flex",alignItems:"center",gap:10}}><input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{width:34,height:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:0,background:"none"}} /><input className="fi" value={value} onChange={e=>onChange(e.target.value)} style={{width:90,fontFamily:"monospace",fontSize:12}} /></div>);
}
function SwatchGrid({colors,current,onSelect,showLabels}:{colors:any[];current:string;onSelect:(h:string)=>void;showLabels?:boolean}) {
  return (<div style={{display:"flex",flexWrap:"wrap",gap:showLabels?4:6}}>{colors.map(c=>{const hex=typeof c==="string"?c:c.hex,label=typeof c==="string"?null:c.label;
    if(showLabels) return <button key={hex+(label||"")} onClick={()=>onSelect(hex)} title={label||hex} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:6,border:current===hex?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.08)",background:current===hex?"rgba(99,102,241,0.12)":"none",cursor:"pointer",transition:"all 0.15s",fontFamily:"var(--sf)"}}><span style={{width:14,height:14,borderRadius:3,flexShrink:0,border:"1px solid rgba(0,0,0,0.15)",backgroundColor:hex}} /><span style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.5)",whiteSpace:"nowrap"}}>{label}</span></button>;
    return <div key={hex} onClick={()=>onSelect(hex)} title={label||hex} style={{width:26,height:26,borderRadius:6,backgroundColor:hex,border:current===hex?"2px solid #fff":"1px solid rgba(255,255,255,0.08)",boxShadow:current===hex?"0 0 0 2px var(--sa)":"none",cursor:"pointer",transition:"all 0.15s"}} />;
  })}</div>);
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function DesignStudioV2() {
  const [activeTab,setActiveTab]=useState("templates");
  const [leftPanel,setLeftPanel]=useState("templates");
  const [selectedTemplate,setSelectedTemplate]=useState("just-listed");
  const [selectedSize,setSelectedSize]=useState("square");
  const [zoom,setZoom]=useState(100);
  // Property selector
  const [selectedPropertyId,setSelectedPropertyId]=useState<string|null>(null);
  // Shared fields
  const [listingPhoto,setListingPhoto]=useState<string|null>(DEMO_PHOTOS[0]);
  const [headshot,setHeadshot]=useState<string|null>(null);
  const [logo,setLogo]=useState<string|null>(null);
  const [address,setAddress]=useState("742 Evergreen Terrace, Springfield");
  const [beds,setBeds]=useState("4");const [baths,setBaths]=useState("3");const [sqft,setSqft]=useState("2,450");const [price,setPrice]=useState("485,000");
  const [date,setDate]=useState("Saturday, March 22");const [time,setTime]=useState("1:00 PM – 4:00 PM");
  const [agentName,setAgentName]=useState("Sarah Mitchell");const [phone,setPhone]=useState("(555) 234-5678");
  const [agentEmail,setAgentEmail]=useState("");const [brokerage,setBrokerage]=useState("Compass");
  const [barColor,setBarColor]=useState("#111827");const [accentColor,setAccentColor]=useState("");const [fontId,setFontId]=useState("sans");
  // Media
  const [mediaMode,setMediaMode]=useState<"image"|"video">("image");
  const [selectedVideo,setSelectedVideo]=useState<any>(null);
  const [overlayMusic,setOverlayMusic]=useState("");const [musicExpanded,setMusicExpanded]=useState(false);
  // Yard sign
  const [yardDesign,setYardDesign]=useState("split-bar");const [yardSignSize,setYardSignSize]=useState("18x24");
  const [yardHeaderText,setYardHeaderText]=useState("FOR SALE");
  const [yardTopColor,setYardTopColor]=useState("#dc1c2e");const [yardBottomColor,setYardBottomColor]=useState("#003da5");
  const [yardSidebarColor,setYardSidebarColor]=useState("#1c1c1c");const [yardMainBgColor,setYardMainBgColor]=useState("#ffffff");
  const [yardWebsite,setYardWebsite]=useState("");const [yardOfficeName,setYardOfficeName]=useState("");const [yardOfficePhone,setYardOfficePhone]=useState("");
  const [yardBullet1,setYardBullet1]=useState("");const [yardBullet2,setYardBullet2]=useState("");const [yardBullet3,setYardBullet3]=useState("");
  // Property PDF
  const [pdfAddress,setPdfAddress]=useState("");const [pdfCityStateZip,setPdfCityStateZip]=useState("");
  const [pdfPrice,setPdfPrice]=useState("");const [pdfBeds,setPdfBeds]=useState("");const [pdfBaths,setPdfBaths]=useState("");const [pdfSqft,setPdfSqft]=useState("");
  const [pdfDescription,setPdfDescription]=useState("");const [pdfFeatures,setPdfFeatures]=useState("");
  const [pdfPhotos,setPdfPhotos]=useState<string[]>([]);const [pdfPreviewPage,setPdfPreviewPage]=useState(0);const [pdfAccentColor,setPdfAccentColor]=useState("#0e7490");
  // Branding card
  const [brandHeadshot,setBrandHeadshot]=useState<string|null>(null);const [brandLogo,setBrandLogo]=useState<string|null>(null);
  const [brandBgPhoto,setBrandBgPhoto]=useState<string|null>(null);
  const [brandAgentName,setBrandAgentName]=useState("Sarah Mitchell");const [brandPhone,setBrandPhone]=useState("(555) 234-5678");
  const [brandEmail,setBrandEmail]=useState("");const [brandBrokerage,setBrandBrokerage]=useState("Compass");
  const [brandTagline,setBrandTagline]=useState("");const [brandWebsite,setBrandWebsite]=useState("");
  const [brandAddress,setBrandAddress]=useState("");const [brandCityState,setBrandCityState]=useState("");
  const [brandPrice,setBrandPrice]=useState("");const [brandFeatures,setBrandFeatures]=useState("");
  const [brandBgColor,setBrandBgColor]=useState("#14532d");const [brandAccentColor,setBrandAccentColor]=useState("");
  const [brandOrientation,setBrandOrientation]=useState("landscape");const [brandFont,setBrandFont]=useState("serif");
  // UI
  const [exporting,setExporting]=useState(false);const [showRight,setShowRight]=useState(true);const [notification,setNotification]=useState<string|null>(null);
  const previewRef=useRef<HTMLDivElement>(null);

  const currentSize=SIZES.find(s=>s.id===selectedSize)!;
  const currentYardSize=YARD_SIGN_SIZES.find(s=>s.id===yardSignSize)!;
  const currentBrandOr=BRAND_ORIENTATIONS.find(o=>o.id===brandOrientation)!;
  const fontFamily=FONT_OPTIONS.find(f=>f.id===fontId)?.family||FONT_OPTIONS[1].family;
  const brandFontFamily=FONT_OPTIONS.find(f=>f.id===brandFont)?.family||FONT_OPTIONS[0].family;
  const badge=getBadgeConfig(selectedTemplate);
  const currentPanels=LEFT_PANELS[activeTab]||LEFT_PANELS.templates;

  useEffect(()=>{setLeftPanel(currentPanels[0].id);},[activeTab]);
  const notify=(msg:string)=>{setNotification(msg);setTimeout(()=>setNotification(null),3000);};
  const handleExport=async()=>{setExporting(true);await new Promise(r=>setTimeout(r,2000));notify("Design exported!");setExporting(false);};

  // Property selector handler
  const handleSelectProperty=(id:string)=>{
    if(id==="__new__"){setSelectedPropertyId(null);setAddress("");setBeds("");setBaths("");setSqft("");setPrice("");setPdfAddress("");setPdfCityStateZip("");setPdfBeds("");setPdfBaths("");setPdfSqft("");setPdfPrice("");setPdfFeatures("");setBrandAddress("");setBrandCityState("");setBrandPrice("");setBrandFeatures("");return;}
    const prop=DEMO_PROPERTIES.find(p=>p.id===id);if(!prop)return;
    setSelectedPropertyId(prop.id);
    const full=[prop.address,prop.city,prop.state].filter(Boolean).join(", ");
    setAddress(full);setPdfAddress(prop.address);setBrandAddress(prop.address);
    const cs=[prop.city,prop.state].filter(Boolean).join(", ");setPdfCityStateZip(cs);setBrandCityState(cs);
    setBeds(prop.beds);setPdfBeds(prop.beds);setBaths(prop.baths);setPdfBaths(prop.baths);
    setSqft(prop.sqft);setPdfSqft(prop.sqft);setPrice(prop.price);setPdfPrice(prop.price);setBrandPrice(prop.price);
    if(prop.features){setPdfFeatures(prop.features);setBrandFeatures(prop.features);}
  };

  // PDF page count
  const pdfPhotosAfterP1=Math.max(0,pdfPhotos.length-3);
  const pdfTotalPages=1+Math.ceil(pdfPhotosAfterP1/6);

  // Preview dims
  const getPreviewDims=useCallback(()=>{
    let w:number,h:number;
    if(activeTab==="yard-sign"){w=currentYardSize.width;h=currentYardSize.height;}
    else if(activeTab==="property-pdf"){w=2550;h=3300;}
    else if(activeTab==="branding-card"){w=currentBrandOr.width;h=currentBrandOr.height;}
    else{w=currentSize.width;h=currentSize.height;}
    const maxW=580,maxH=560;const s=Math.min(maxW/w,maxH/h,1)*(zoom/100);
    return {scale:s,pW:w*s,pH:h*s,rawW:w,rawH:h};
  },[activeTab,currentSize,currentYardSize,currentBrandOr,zoom]);
  const {scale,pW,pH,rawW,rawH}=getPreviewDims();

  // Canvas content
  const renderPreview=()=>{
    if(activeTab==="templates"){
      const photo=mediaMode==="video"?(selectedVideo?.thumbnail||null):listingPhoto;
      if(selectedTemplate==="open-house") return <OpenHouseTemplate size={currentSize} listingPhoto={photo} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} date={date} time={time} agentName={agentName} phone={phone} brokerage={brokerage} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor} />;
      return <InfoBarTemplate size={currentSize} listingPhoto={photo} headshot={headshot} logo={logo} address={address} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} badgeText={badge.text} badgeColor={badge.color} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor} />;
    }
    if(activeTab==="yard-sign"){
      const ys={width:currentYardSize.width,height:currentYardSize.height,headshot,logo,agentName,phone,email:agentEmail,brokerage,headerText:yardHeaderText,fontFamily,qrDataUrl:null,bulletPoints:[yardBullet1,yardBullet2,yardBullet3]};
      if(yardDesign==="sidebar") return <YardSignSidebar {...ys} website={yardWebsite} sidebarColor={yardSidebarColor} mainBgColor={yardMainBgColor} />;
      if(yardDesign==="top-heavy") return <YardSignTopHeavy {...ys} topColor={yardTopColor} bottomColor={yardBottomColor} />;
      return <YardSignSplitBar {...ys} officeName={yardOfficeName} officePhone={yardOfficePhone} topColor={yardTopColor} bottomColor={yardBottomColor} />;
    }
    if(activeTab==="property-pdf") return <PropertyPdfPage pageNumber={pdfPreviewPage} address={pdfAddress} cityStateZip={pdfCityStateZip} price={pdfPrice} beds={pdfBeds} baths={pdfBaths} sqft={pdfSqft} description={pdfDescription} features={pdfFeatures} photos={pdfPhotos} accentColor={pdfAccentColor} fontFamily={fontFamily} />;
    if(activeTab==="branding-card") return <BrandingCardTemplate orientation={currentBrandOr} logo={brandLogo} headshot={brandHeadshot} agentName={brandAgentName} phone={brandPhone} email={brandEmail} brokerage={brandBrokerage} tagline={brandTagline} website={brandWebsite} address={brandAddress} cityState={brandCityState} price={brandPrice} features={brandFeatures} bgColor={brandBgColor} accentColor={brandAccentColor} bgPhoto={brandBgPhoto} fontFamily={brandFontFamily} />;
    return null;
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
    :root{--sb:#0c0c10;--ss:#151519;--ss2:#1c1c22;--sbr:rgba(255,255,255,0.06);--sa:#6366f1;--sag:rgba(99,102,241,0.15);--st:#e4e4ea;--std:rgba(255,255,255,0.4);--stm:rgba(255,255,255,0.2);--suc:#10b981;--sc:#09090d;--sf:'DM Sans',-apple-system,sans-serif;}
    *{margin:0;padding:0;box-sizing:border-box;}.sr{font-family:var(--sf);background:var(--sb);color:var(--st);height:100vh;display:flex;flex-direction:column;overflow:hidden;-webkit-font-smoothing:antialiased;}
    .st{height:54px;background:var(--ss);border-bottom:1px solid var(--sbr);display:flex;align-items:center;padding:0 14px;gap:6px;flex-shrink:0;z-index:20;}
    .slg{display:flex;align-items:center;gap:9px;padding-right:18px;border-right:1px solid var(--sbr);margin-right:6px;}
    .slm{width:30px;height:30px;background:linear-gradient(135deg,var(--sa),#a855f7);border-radius:8px;display:flex;align-items:center;justify-content:center;}
    .stb{display:flex;gap:1px;background:rgba(255,255,255,0.03);border-radius:9px;padding:3px;}
    .stbi{padding:6px 14px;border-radius:7px;border:none;background:none;color:var(--std);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:var(--sf);}
    .stbi:hover{color:var(--st);background:rgba(255,255,255,0.04);}.stbi.ac{color:#fff;background:var(--sa);box-shadow:0 2px 8px rgba(99,102,241,0.3);}
    .ssp{flex:1;}.sac{display:flex;align-items:center;gap:6px;}
    .bi{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:var(--sf);}.bi:hover{background:rgba(255,255,255,0.05);color:var(--st);}
    .bx{padding:7px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,var(--sa),#7c3aed);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;box-shadow:0 2px 12px rgba(99,102,241,0.3);font-family:var(--sf);}.bx:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(99,102,241,0.4);}.bx:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
    .sb{flex:1;display:flex;overflow:hidden;}.slr{width:68px;background:var(--ss);border-right:1px solid var(--sbr);display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:2px;flex-shrink:0;}
    .rb{width:54px;padding:9px 0;border-radius:9px;border:none;background:none;color:var(--std);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;font-family:var(--sf);}.rb span{font-size:9px;font-weight:600;}.rb:hover{background:rgba(255,255,255,0.04);color:var(--st);}.rb.ac{background:var(--sag);color:var(--sa);}
    .slp{width:310px;background:var(--ss);border-right:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;}.slp::-webkit-scrollbar{width:4px;}.slp::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
    .ph{padding:16px 20px 12px;font-size:14px;font-weight:800;letter-spacing:-0.02em;border-bottom:1px solid var(--sbr);display:flex;align-items:center;gap:7px;position:sticky;top:0;background:var(--ss);z-index:5;}
    .sc{flex:1;background:var(--sc);display:flex;flex-direction:column;position:relative;overflow:hidden;}
    .scb{position:absolute;inset:0;opacity:0.025;background-image:linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%);background-size:28px 28px;background-position:0 0,0 14px,14px -14px,-14px 0px;}
    .scc{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
    .spf{border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 20px 60px rgba(0,0,0,0.5);transition:all 0.3s;}
    .sct{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--ss);border-radius:10px;border:1px solid var(--sbr);box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:10;}
    .zd{font-size:11px;font-weight:700;color:var(--std);min-width:40px;text-align:center;user-select:none;}.td{width:1px;height:18px;background:var(--sbr);margin:0 3px;}
    .sp{padding:4px 10px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:var(--sf);}.sp:hover{background:rgba(255,255,255,0.05);color:var(--st);}.sp.ac{background:var(--sa);color:#fff;border-color:var(--sa);}
    .srp{width:280px;background:var(--ss);border-left:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;}.srp::-webkit-scrollbar{width:4px;}.srp::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
    .fl{font-size:10px;font-weight:700;color:var(--std);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;display:block;}
    .fi{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;transition:all 0.15s;}.fi:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}.fi::placeholder{color:var(--stm);}
    .fg{margin-bottom:12px;}.fr{display:flex;gap:7px;}
    .fo{padding:9px 12px;border-radius:9px;border:1px solid var(--sbr);background:none;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;margin-bottom:5px;font-family:var(--sf);}.fo:hover{background:rgba(255,255,255,0.03);}.fo.ac{border-color:var(--sa);background:var(--sag);}
    .tg{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
    .tc{border-radius:10px;border:2px solid var(--sbr);background:rgba(255,255,255,0.015);cursor:pointer;transition:all 0.2s;overflow:hidden;padding:12px;text-align:center;font-family:var(--sf);}.tc:hover{border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);}.tc.ac{border-color:var(--sa);background:var(--sag);}
    .tiw{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:10px 22px;background:var(--suc);color:#fff;font-size:12px;font-weight:700;border-radius:10px;box-shadow:0 8px 32px rgba(16,185,129,0.3);z-index:100;animation:ti 0.3s ease;font-family:var(--sf);}
    @keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(16px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    .animate-spin{animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}
    .group:hover .ghov{opacity:1!important;}
    .ta{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;resize:none;transition:all 0.15s;}.ta:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}
    .ps{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:rgba(255,255,255,0.03);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;appearance:none;cursor:pointer;}.ps:focus{border-color:var(--sa);}
    @media(max-width:1100px){.slp{width:260px;}.srp{width:240px;}}@media(max-width:850px){.slr,.slp,.srp{display:none;}}
  `;

  return (
    <><style>{css}</style>
    <div className="sr">
      {/* TOP BAR */}
      <div className="st">
        <div className="slg"><div className="slm"><PenTool size={14} color="#fff" /></div><span style={{fontSize:14,fontWeight:800,letterSpacing:"-0.03em"}}>Design Studio</span></div>
        <div className="stb">{TABS.map(t=><button key={t.id} className={`stbi ${activeTab===t.id?"ac":""}`} onClick={()=>setActiveTab(t.id)}><t.icon size={13} />{t.label}</button>)}</div>
        {/* Property selector */}
        <div style={{marginLeft:12,display:"flex",alignItems:"center",gap:8}}>
          <Home size={14} color="var(--sa)" />
          <select className="ps" value={selectedPropertyId||""} onChange={e=>handleSelectProperty(e.target.value)} style={{width:200}}>
            <option value="">Select property...</option>
            {DEMO_PROPERTIES.map(p=><option key={p.id} value={p.id}>{p.address}, {p.city}</option>)}
            <option value="__new__">＋ Enter manually</option>
          </select>
        </div>
        <div className="ssp" />
        <div className="sac">
          <button className="bi" title="Undo"><Undo2 size={15} /></button><button className="bi" title="Redo"><Redo2 size={15} /></button><div className="td" />
          <button className="bx" onClick={handleExport} disabled={exporting}>{exporting?<><Loader2 size={14} className="animate-spin" /> Exporting...</>:<><Download size={14} /> Export</>}</button>
        </div>
      </div>

      {/* BODY */}
      <div className="sb">
        <div className="slr">{currentPanels.map(p=><button key={p.id} className={`rb ${leftPanel===p.id?"ac":""}`} onClick={()=>setLeftPanel(p.id)}><p.icon size={18} /><span>{p.label}</span></button>)}</div>

        <div className="slp">
          {/* LISTING: Templates */}
          {activeTab==="templates"&&leftPanel==="templates"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)" /> Templates</div><div style={{padding:14}}><div className="tg">{TEMPLATES.map(t=><button key={t.id} className={`tc ${selectedTemplate===t.id?"ac":""}`} onClick={()=>setSelectedTemplate(t.id)}><div className="tiw" style={{background:`${t.color}20`}}><t.icon size={18} color={t.color} /></div><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{t.label}</div></button>)}</div></div></>}

          {/* LISTING/YARD/BRAND: Uploads */}
          {(activeTab==="templates"||activeTab==="yard-sign"||activeTab==="branding-card")&&leftPanel==="uploads"&&<>
            <div className="ph"><Upload size={15} color="var(--sa)" /> Media</div>
            <div style={{padding:14}}>
              {activeTab==="templates"&&<>
                <div style={{display:"flex",gap:3,padding:3,background:"rgba(255,255,255,0.04)",borderRadius:10,marginBottom:14}}>
                  <button onClick={()=>{setMediaMode("image");setSelectedVideo(null);}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 0",borderRadius:8,border:"none",background:mediaMode==="image"?"var(--sa)":"none",color:mediaMode==="image"?"#fff":"var(--std)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--sf)",boxShadow:mediaMode==="image"?"0 2px 8px rgba(99,102,241,0.3)":"none"}}><ImageIcon size={14} /> Image</button>
                  <button onClick={()=>{setMediaMode("video");setListingPhoto(null);}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 0",borderRadius:8,border:"none",background:mediaMode==="video"?"var(--sa)":"none",color:mediaMode==="video"?"#fff":"var(--std)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--sf)",boxShadow:mediaMode==="video"?"0 2px 8px rgba(99,102,241,0.3)":"none"}}><Play size={14} /> Video</button>
                </div>
                {mediaMode==="image"&&<UploadZone label="Listing Photo" imageUrl={listingPhoto} onUpload={f=>setListingPhoto(URL.createObjectURL(f))} onClear={()=>setListingPhoto(null)} uploading={false} />}
                {mediaMode==="video"&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:12}}><Film size={13} color="#f59e0b" /><span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>Video exports limited to 119s</span></div>}
              </>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:activeTab==="templates"?10:0}}>
                <UploadZone label="Headshot" imageUrl={activeTab==="branding-card"?brandHeadshot:headshot} onUpload={f=>{const u=URL.createObjectURL(f);setHeadshot(u);setBrandHeadshot(u);}} onClear={()=>{setHeadshot(null);setBrandHeadshot(null);}} uploading={false} compact />
                <UploadZone label="Logo" imageUrl={activeTab==="branding-card"?brandLogo:logo} onUpload={f=>{const u=URL.createObjectURL(f);setLogo(u);setBrandLogo(u);}} onClear={()=>{setLogo(null);setBrandLogo(null);}} uploading={false} compact />
              </div>
              {activeTab==="branding-card"&&<div style={{marginTop:10}}><UploadZone label="Background Photo (optional)" imageUrl={brandBgPhoto} onUpload={f=>setBrandBgPhoto(URL.createObjectURL(f))} onClear={()=>setBrandBgPhoto(null)} uploading={false} /></div>}
              {activeTab==="templates"&&mediaMode==="image"&&<div style={{marginTop:18}}><span className="fl">Stock Photos</span><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:6}}>{DEMO_PHOTOS.map((url,i)=><div key={i} onClick={()=>setListingPhoto(url)} style={{aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"pointer",border:listingPhoto===url?"2px solid var(--sa)":"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /></div>)}</div></div>}
            </div>
          </>}

          {/* LISTING: Details */}
          {activeTab==="templates"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)" /> Details</div>
            <Section title="Property" icon={Home}><div className="fg"><label className="fl">Address</label><input className="fi" value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St" /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e=>setBeds(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e=>setBaths(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e=>setSqft(e.target.value)} /></div></div><div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e=>setPrice(e.target.value)} /></div>{selectedTemplate==="open-house"&&<div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Date</label><input className="fi" value={date} onChange={e=>setDate(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Time</label><input className="fi" value={time} onChange={e=>setTime(e.target.value)} /></div></div>}</Section>
            <Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)} /></div></div></Section>
          </>}

          {/* LISTING: Styles */}
          {activeTab==="templates"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)" /> Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${fontId===f.id?"ac":""}`} onClick={()=>setFontId(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section>
            <Section title="Info Bar Color" icon={Paintbrush}><ColorPicker value={barColor} onChange={setBarColor} /><div style={{marginTop:10}}><span className="fl">Brokerage Presets</span><SwatchGrid colors={BROKERAGE_COLORS} current={barColor} onSelect={setBarColor} showLabels /></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={accentColor||"#ffffff"} onChange={setAccentColor} />{accentColor&&<button onClick={()=>setAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={accentColor} onSelect={setAccentColor} /></div></Section>
          </>}

          {/* YARD: Design */}
          {activeTab==="yard-sign"&&leftPanel==="design"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)" /> Yard Sign Design</div><div style={{padding:14}}><div className="tg" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>{YARD_DESIGNS.map(d=><button key={d.id} className={`tc ${yardDesign===d.id?"ac":""}`} onClick={()=>setYardDesign(d.id)}><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{d.label}</div><div style={{fontSize:9,color:"var(--std)",marginTop:2}}>{d.desc}</div></button>)}</div><div style={{marginTop:14}}><span className="fl">Sign Size</span><div className="fr" style={{marginTop:4}}>{YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center"}} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}</div></div></div></>}

          {/* YARD: Details */}
          {activeTab==="yard-sign"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)" /> Sign Details</div>
            <Section title="Header & Agent" icon={User}><div className="fg"><label className="fl">Header Text</label><input className="fi" value={yardHeaderText} onChange={e=>setYardHeaderText(e.target.value)} /></div><div className="fg"><label className="fl">Agent Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e=>setAgentEmail(e.target.value)} /></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)} /></div>
              {yardDesign==="split-bar"&&<div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Office Name</label><input className="fi" value={yardOfficeName} onChange={e=>setYardOfficeName(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Office Phone</label><input className="fi" value={yardOfficePhone} onChange={e=>setYardOfficePhone(e.target.value)} /></div></div>}
              {yardDesign==="sidebar"&&<div className="fg"><label className="fl">Website</label><input className="fi" value={yardWebsite} onChange={e=>setYardWebsite(e.target.value)} placeholder="www.janesmith.com" /></div>}
            </Section>
            <Section title="Property Highlights" icon={Home}><div className="fg"><input className="fi" value={yardBullet1} onChange={e=>setYardBullet1(e.target.value)} placeholder="e.g. 3 BDR / 2 BTH" /></div><div className="fg"><input className="fi" value={yardBullet2} onChange={e=>setYardBullet2(e.target.value)} placeholder="e.g. Pool & Spa" /></div><div className="fg"><input className="fi" value={yardBullet3} onChange={e=>setYardBullet3(e.target.value)} placeholder="e.g. Ocean View" /></div></Section>
          </>}

          {/* YARD: Colors */}
          {activeTab==="yard-sign"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)" /> Colors</div>
            {yardDesign==="split-bar"&&<><Section title="Top Bar" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels /></div></Section><Section title="Bottom Bar" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels /></div></Section></>}
            {yardDesign==="sidebar"&&<><Section title="Sidebar Color" icon={Paintbrush}><ColorPicker value={yardSidebarColor} onChange={setYardSidebarColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardSidebarColor} onSelect={setYardSidebarColor} showLabels /></div></Section><Section title="Main Background" icon={Paintbrush}><ColorPicker value={yardMainBgColor} onChange={setYardMainBgColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardMainBgColor} onSelect={setYardMainBgColor} showLabels /></div></Section></>}
            {yardDesign==="top-heavy"&&<><Section title="Top Section" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels /></div></Section><Section title="Bottom Section" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels /></div></Section></>}
          </>}

          {/* PDF: Details */}
          {activeTab==="property-pdf"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)" /> Property Details</div>
            <Section title="Address & Price" icon={MapPin}><div className="fg"><label className="fl">Address</label><input className="fi" value={pdfAddress} onChange={e=>setPdfAddress(e.target.value)} /></div><div className="fg"><label className="fl">City, State, Zip</label><input className="fi" value={pdfCityStateZip} onChange={e=>setPdfCityStateZip(e.target.value)} /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={pdfPrice} onChange={e=>setPdfPrice(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={pdfBeds} onChange={e=>setPdfBeds(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={pdfBaths} onChange={e=>setPdfBaths(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Sq Ft</label><input className="fi" value={pdfSqft} onChange={e=>setPdfSqft(e.target.value)} /></div></div></Section>
            <Section title="Description" icon={FileText} defaultOpen={false}><textarea className="ta" rows={6} value={pdfDescription} onChange={e=>setPdfDescription(e.target.value)} placeholder="Property description..." /></Section>
            <Section title="Key Features" icon={Sparkles}><textarea className="ta" rows={6} value={pdfFeatures} onChange={e=>setPdfFeatures(e.target.value)} placeholder="One feature per line..." /></Section>
          </>}

          {/* PDF: Photos */}
          {activeTab==="property-pdf"&&leftPanel==="photos"&&<><div className="ph"><ImageIcon size={15} color="var(--sa)" /> Photos ({pdfPhotos.length}/25)</div><div style={{padding:14}}>
            <p style={{fontSize:11,color:"var(--std)",marginBottom:10}}>First 3 photos appear on page 1. Remaining fill grids.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{pdfPhotos.map((url,i)=><div key={i} className="group" style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} /><div style={{position:"absolute",top:2,left:2,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>{i<3?`★${i+1}`:i+1}</div><button className="ghov" onClick={()=>setPdfPhotos(p=>p.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}><X size={10} /></button></div>)}
              {pdfPhotos.length<25&&<label style={{aspectRatio:"1",borderRadius:8,border:"2px dashed var(--sbr)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"var(--std)"}}><Upload size={16} /><span style={{fontSize:9,fontWeight:600}}>Add</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{Array.from(e.target.files||[]).forEach(f=>{setPdfPhotos(p=>[...p,URL.createObjectURL(f)]);});e.target.value="";}} /></label>}
            </div>
          </div></>}

          {/* PDF: Styles */}
          {activeTab==="property-pdf"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)" /> Accent Color</div>
            <Section title="Color" icon={Paintbrush}><ColorPicker value={pdfAccentColor} onChange={setPdfAccentColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} showLabels /></div><div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} /></div></Section>
          </>}

          {/* BRAND: Details */}
          {activeTab==="branding-card"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)" /> Card Details</div>
            <Section title="Agent Info" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={brandAgentName} onChange={e=>setBrandAgentName(e.target.value)} /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={brandPhone} onChange={e=>setBrandPhone(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={brandEmail} onChange={e=>setBrandEmail(e.target.value)} /></div></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brandBrokerage} onChange={e=>setBrandBrokerage(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Tagline</label><input className="fi" value={brandTagline} onChange={e=>setBrandTagline(e.target.value)} /></div></div><div className="fg"><label className="fl">Website</label><input className="fi" value={brandWebsite} onChange={e=>setBrandWebsite(e.target.value)} /></div></Section>
            <Section title="Property (optional)" icon={Home} defaultOpen={false}><div className="fg"><label className="fl">Address</label><input className="fi" value={brandAddress} onChange={e=>setBrandAddress(e.target.value)} /></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">City, State</label><input className="fi" value={brandCityState} onChange={e=>setBrandCityState(e.target.value)} /></div><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={brandPrice} onChange={e=>setBrandPrice(e.target.value)} /></div></div><div className="fg"><label className="fl">Features</label><textarea className="ta" rows={3} value={brandFeatures} onChange={e=>setBrandFeatures(e.target.value)} /></div></Section>
          </>}

          {/* BRAND: Styles */}
          {activeTab==="branding-card"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)" /> Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${brandFont===f.id?"ac":""}`} onClick={()=>setBrandFont(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section>
            <Section title="Background Color" icon={Paintbrush}><ColorPicker value={brandBgColor} onChange={setBrandBgColor} /><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={brandBgColor} onSelect={setBrandBgColor} showLabels /></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={brandAccentColor||"#ffffff"} onChange={setBrandAccentColor} />{brandAccentColor&&<button onClick={()=>setBrandAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={brandAccentColor} onSelect={setBrandAccentColor} /></div></Section>
            <Section title="Orientation" icon={Layers}><div className="fr">{BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center"}} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}</div></Section>
          </>}
        </div>

        {/* CANVAS */}
        <div className="sc">
          <div className="scb" />
          <div className="scc">
            <div className="spf" style={{width:pW,height:pH}}>
              <div ref={previewRef} style={{width:rawW,height:rawH,transform:`scale(${scale})`,transformOrigin:"top left"}}>{renderPreview()}</div>
            </div>
          </div>
          <div className="sct">
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.max(50,zoom-10))}><ZoomOut size={13} /></button>
            <div className="zd">{zoom}%</div>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.min(200,zoom+10))}><ZoomIn size={13} /></button>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(100)}><RotateCcw size={13} /></button>
            <div className="td" />
            {activeTab==="templates"&&SIZES.map(s=><button key={s.id} className={`sp ${selectedSize===s.id?"ac":""}`} onClick={()=>setSelectedSize(s.id)}>{s.label}</button>)}
            {activeTab==="yard-sign"&&YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}
            {activeTab==="property-pdf"&&pdfTotalPages>1&&<><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.max(0,pdfPreviewPage-1))}><ChevronLeft size={13} /></button><span className="zd">Pg {pdfPreviewPage+1}/{pdfTotalPages}</span><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.min(pdfTotalPages-1,pdfPreviewPage+1))}><ChevronRight size={13} /></button></>}
            {activeTab==="branding-card"&&BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}
          </div>
        </div>

        {/* RIGHT PANEL */}
        {showRight&&<div className="srp">
          <div className="ph"><Settings size={14} color="var(--sa)" /> Properties<div style={{flex:1}} /><button className="bi" style={{width:26,height:26}} onClick={()=>setShowRight(false)}><X size={11} /></button></div>
          <Section title="Export" icon={Download}>
            <button className="bx" style={{width:"100%",justifyContent:"center",padding:"11px 0"}} onClick={handleExport} disabled={exporting}>{exporting?<><Loader2 size={14} className="animate-spin" /> Exporting...</>:<><Download size={14} /> {activeTab==="property-pdf"?"Download PDF":"Download PNG"}</>}</button>
            <div style={{display:"flex",gap:5,marginTop:6}}><button className="bi" style={{flex:1,width:"auto",fontSize:11,gap:4,fontWeight:600}}><Film size={13} /> Video</button><button className="bi" style={{flex:1,width:"auto",fontSize:11,gap:4,fontWeight:600}}><Share2 size={13} /> Share</button></div>
          </Section>
          <Section title="Layers" icon={Layers} defaultOpen={false}><div style={{display:"flex",flexDirection:"column",gap:3}}>{(activeTab==="templates"?[{n:"Badge",i:"🏷️"},{n:"Price",i:"💲"},{n:"Info Bar",i:"📋"},{n:"Agent",i:"👤"},{n:"Photo",i:"🖼️"}]:activeTab==="yard-sign"?[{n:"Header",i:"🏷️"},{n:"Agent",i:"👤"},{n:"Background",i:"🖼️"}]:activeTab==="property-pdf"?[{n:"Photos",i:"🖼️"},{n:"Details",i:"📋"},{n:"Features",i:"✨"}]:[{n:"Headshot",i:"👤"},{n:"Info",i:"📋"},{n:"Background",i:"🖼️"}]).map((l,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:7,background:"rgba(255,255,255,0.02)",border:"1px solid var(--sbr)",fontSize:11,color:"var(--std)"}}><span>{l.i}</span><span style={{flex:1,fontWeight:600}}>{l.n}</span><Eye size={13} color="var(--sa)" /></div>)}</div></Section>
        </div>}
      </div>

      {notification&&<div className="toast"><CheckCircle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:7}} />{notification}</div>}
    </div></>
  );
}
