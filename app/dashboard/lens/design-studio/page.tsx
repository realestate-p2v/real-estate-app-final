"use client";
import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import {
  ChevronDown, Download, Upload, Image as ImageIcon, PenTool, Home, DollarSign,
  CheckCircle, X, Loader2, Palette, CreditCard, User, MapPin,
  Calendar, Play, FileText, Sparkles, Film, Music, Check, Type, Eye, Layers,
  ZoomIn, ZoomOut, LayoutTemplate, Settings, RotateCcw, Share2, Undo2, Redo2,
  ChevronLeft, ChevronRight, Paintbrush, Sun, Moon, Printer, Globe, Video,
  Clock, ArrowUp, ArrowDown, Trash2, Lock,
} from "lucide-react";
import { GateOverlay } from "@/components/gate-overlay";
import {
  isLightColor,
  hexToRgba,
  responsiveSize,
  darken,
  getBadgeConfig,
  truncateText,
} from "@/components/design-studio/helpers";
import { InfoBarTemplate } from "@/components/design-studio/info-bar-template";
import { ToolHeader } from "@/components/tool-header";
import { useRouter, useSearchParams } from "next/navigation";


// ─── MagazineCoverTemplate ───────────────────────────────────────────────────
function MagazineCoverTemplate({size,listingPhoto,videoElement,headshot,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,logo,fontFamily,barColor,accentColor,brandShadow,badgeText}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff";
  const ad=address||"123 Main Street";const ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  \u00b7  ")||"";
  const pr=price?`$${price}`:"$000,000";
  const brand=[agentName,phone].filter(Boolean).join("  \u00b7  ")||"";
  const br=brokerage||"";
  const ts=`0 ${Math.round(2*unit)}px ${Math.round(10*unit)}px rgba(0,0,0,0.7)`;
  const bts=brandShadow?`0 ${Math.round(2*unit)}px ${Math.round(8*unit)}px rgba(0,0,0,0.6)`:"none";
  const prFs=Math.round((isStory?120:isPostcard?90:80)*unit);
  const adFs=responsiveSize(Math.round((isStory?42:isPostcard?30:26)*unit),ad,22);
  const detFs=Math.round((isStory?28:isPostcard?20:18)*unit);
  const badgeFs=Math.round((isStory?22:isPostcard?16:14)*unit);
  const brandFs=Math.round((isStory?42:isPostcard?30:26)*unit);
  const hsSize=Math.round((isStory?110:isPostcard?80:72)*unit);
  const logoH=Math.round((isStory?80:60)*unit);const logoW=Math.round((isStory?260:180)*unit);
  const pad=Math.round(48*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
    {videoElement?<div data-video-area style={{position:"absolute",inset:0,overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{position:"absolute",inset:0,backgroundColor:"#0f0f1a"}}/>}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.2) 30%,rgba(0,0,0,0.75) 70%,rgba(0,0,0,0.9) 100%)"}}/>
    <div style={{position:"absolute",top:pad,left:pad}}><div style={{display:"inline-flex",padding:`${Math.round(6*unit)}px ${Math.round(16*unit)}px`,backgroundColor:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:Math.round(4*unit),border:"1px solid rgba(255,255,255,0.15)"}}><span style={{fontSize:badgeFs,fontWeight:800,color:"#fff",letterSpacing:"0.2em",textTransform:"uppercase" as const}}>{badgeText||"Just Listed"}</span></div></div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:`0 ${pad}px ${Math.round(24*unit)}px`,display:"flex",flexDirection:"column" as const,alignItems:"flex-start",gap:Math.round(6*unit)}}>
      <p style={{fontSize:adFs,fontWeight:600,color:"rgba(255,255,255,0.85)",margin:0,textShadow:ts}}>{ad}{ad2?` | ${ad2}`:""}</p>
      {det&&<p style={{fontSize:detFs,fontWeight:400,color:"rgba(255,255,255,0.45)",margin:0,letterSpacing:"0.1em",textShadow:ts}}>{det}</p>}
      <p style={{fontSize:prFs,fontWeight:900,color:"#fff",margin:0,marginTop:Math.round(4*unit),lineHeight:0.95,letterSpacing:"-0.03em",textShadow:`0 ${Math.round(4*unit)}px ${Math.round(20*unit)}px rgba(0,0,0,0.5)`}}>{pr}</p>
      <div style={{width:"100%",display:"flex",alignItems:"center",gap:Math.round(16*unit),marginTop:Math.round(16*unit),paddingTop:Math.round(14*unit),borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        {headshot&&<img src={headshot} alt="" style={{width:hsSize,height:hsSize,borderRadius:"50%",objectFit:"cover",border:`${Math.round(3*unit)}px solid rgba(255,255,255,0.25)`,boxShadow:brandShadow?"0 4px 16px rgba(0,0,0,0.5)":"none"}}/>}
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:brandFs,fontWeight:700,color:"rgba(255,255,255,0.85)",margin:0,textShadow:bts}}>{brand}</p>
          {br&&<p style={{fontSize:Math.round(brandFs*0.7),fontWeight:500,color:"rgba(255,255,255,0.5)",margin:0,marginTop:Math.round(4*unit),textShadow:bts}}>{br}</p>}
        </div>
        {logo&&<img src={logo} alt="" style={{maxHeight:logoH,maxWidth:logoW,objectFit:"contain" as const,filter:brandShadow?"drop-shadow(0 2px 8px rgba(0,0,0,0.5))":"none"}}/>}
      </div>
    </div>
  </div>);
}

// ─── SplitDiagonalTemplate ───────────────────────────────────────────────────
function SplitDiagonalTemplate({size,listingPhoto,videoElement,headshot,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,logo,fontFamily,barColor,accentColor,brandShadow,badgeText}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff";const barLight=isLightColor(barColor);
  const tp=barLight?"#111827":"#ffffff",ts2=barLight?"rgba(17,24,39,0.5)":"rgba(255,255,255,0.5)";
  const ad=address||"123 Main Street";const ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join(" \u00b7 ")||"";
  const pr=price?`$${price}`:"$000,000";
  const brand=[agentName,phone].filter(Boolean).join(" \u00b7 ")||"";
  const br=brokerage||"";
  const split=isStory?40:35;
  const badgeFs=Math.round((isStory?52:isPostcard?36:32)*unit);
  const adFs=responsiveSize(Math.round((isStory?48:isPostcard?34:30)*unit),ad,18);
  const detFs=Math.round((isStory?34:isPostcard?24:22)*unit);
  const prFs=Math.round((isStory?84:isPostcard?60:54)*unit);
  const brandFs=Math.round((isStory?48:isPostcard?34:30)*unit);
  const hsSize=Math.round((isStory?100:isPostcard?72:64)*unit);
  const logoH=Math.round((isStory?70:50)*unit);const logoW=Math.round((isStory?200:140)*unit);
  const pad=Math.round(40*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
    <div style={{position:"absolute",inset:0,backgroundColor:barColor}}/>
    <div style={{position:"absolute",inset:0,clipPath:`polygon(${split}% 0, 100% 0, 100% 100%, ${split-15}% 100%)`}}>
      {videoElement?<div data-video-area style={{width:"100%",height:"100%",overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1a1a2e"}}/>}
    </div>
    <div style={{position:"absolute",top:0,left:0,width:`${split+5}%`,height:"100%",display:"flex",flexDirection:"column" as const,justifyContent:"center",padding:`${pad}px ${Math.round(30*unit)}px ${pad}px ${pad}px`,gap:Math.round(14*unit)}}>
      <p style={{fontSize:badgeFs,fontWeight:900,color:accent,letterSpacing:"0.12em",textTransform:"uppercase" as const,lineHeight:1.1,margin:0}}>{(badgeText||"JUST LISTED").split(" ").map((word:string,i:number,arr:string[])=>(<span key={i}>{word}{i<arr.length-1&&<br/>}</span>))}</p>
      <div style={{width:Math.round(50*unit),height:Math.round(3*unit),backgroundColor:accent,borderRadius:2,opacity:0.7}}/>
      <p style={{fontSize:adFs,fontWeight:700,color:tp,lineHeight:1.2,margin:0}}>{ad}</p>
      {ad2&&<p style={{fontSize:Math.round(adFs*0.8),fontWeight:500,color:ts2,margin:0}}>{ad2}</p>}
      {det&&<p style={{fontSize:detFs,fontWeight:400,color:ts2,margin:0,letterSpacing:"0.06em"}}>{det}</p>}
      <p style={{fontSize:prFs,fontWeight:900,color:accent,lineHeight:1,margin:0,marginTop:Math.round(6*unit)}}>{pr}</p>
      <div style={{marginTop:"auto",display:"flex",alignItems:"center",gap:Math.round(12*unit)}}>
        {headshot&&<img src={headshot} alt="" style={{width:hsSize,height:hsSize,borderRadius:"50%",objectFit:"cover",border:`${Math.round(3*unit)}px solid ${barLight?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.25)"}`}}/>}
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:brandFs,fontWeight:700,color:tp,margin:0}}>{brand}</p>
          {br&&<p style={{fontSize:Math.round(brandFs*0.7),fontWeight:500,color:ts2,margin:0,marginTop:Math.round(4*unit)}}>{br}</p>}
        </div>
        {logo&&<img src={logo} alt="" style={{maxHeight:logoH,maxWidth:logoW,objectFit:"contain" as const}}/>}
      </div>
    </div>
  </div>);
}

// ─── StampTemplate ───────────────────────────────────────────────────────────
function StampTemplate({size,listingPhoto,videoElement,headshot,badgeText,badgeColor,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,logo,fontFamily,barColor,accentColor,brandShadow}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||badgeColor||"#ffffff";
  const ad=address||"123 Main Street";const ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join(" \u00b7 ")||"";
  const pr=price?`$${price}`:"$000,000";
  const brand=[agentName,phone].filter(Boolean).join(" \u00b7 ")||"";
  const br=brokerage||"";
  const ts=`0 ${Math.round(2*unit)}px ${Math.round(10*unit)}px rgba(0,0,0,0.6)`;
  const bts=brandShadow?`0 ${Math.round(2*unit)}px ${Math.round(8*unit)}px rgba(0,0,0,0.6)`:"none";
  const stampW=Math.round((isStory?340:isPostcard?280:260)*unit);
  const stampH=Math.round((isStory?160:isPostcard?120:110)*unit);
  const stampFs=Math.round((isStory?46:isPostcard?36:32)*unit);
  const adFs=responsiveSize(Math.round((isStory?50:isPostcard?36:32)*unit),ad,20);
  const detFs=Math.round((isStory?34:isPostcard?24:22)*unit);
  const prFs=Math.round((isStory?76:isPostcard?54:48)*unit);
  const brandFs=Math.round((isStory?48:isPostcard?34:30)*unit);
  const hsSize=Math.round((isStory?100:isPostcard?72:64)*unit);
  const logoH=Math.round((isStory?70:50)*unit);const logoW=Math.round((isStory?200:140)*unit);
  const pad=Math.round(44*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>
    {videoElement?<div data-video-area style={{position:"absolute",inset:0,overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{position:"absolute",inset:0,backgroundColor:"#0f0f1a"}}/>}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.7) 100%)"}}/>
    <div style={{position:"absolute",top:Math.round(30*unit),right:Math.round(30*unit),transform:"rotate(-12deg)",width:stampW,height:stampH,border:`${Math.round(4*unit)}px solid ${badgeColor}`,borderRadius:Math.round(8*unit),display:"flex",alignItems:"center",justifyContent:"center",backgroundColor:hexToRgba(badgeColor,0.15),backdropFilter:"blur(4px)"}}><span style={{fontSize:stampFs,fontWeight:900,color:badgeColor,letterSpacing:"0.14em",textTransform:"uppercase" as const,textAlign:"center" as const,lineHeight:1.2,textShadow:`0 1px 4px ${hexToRgba(badgeColor,0.3)}`}}>{badgeText}</span></div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:`0 ${pad}px ${Math.round(24*unit)}px`,display:"flex",flexDirection:"column" as const,gap:Math.round(6*unit)}}>
      <div style={{width:Math.round(60*unit),height:Math.round(2*unit),backgroundColor:accent,borderRadius:1,opacity:0.6,marginBottom:Math.round(4*unit)}}/>
      <p style={{fontSize:adFs,fontWeight:700,color:"#fff",margin:0,textShadow:ts}}>{ad}{ad2?` | ${ad2}`:""}</p>
      {det&&<p style={{fontSize:detFs,fontWeight:400,color:"rgba(255,255,255,0.5)",margin:0,letterSpacing:"0.08em",textShadow:ts}}>{det}</p>}
      <p style={{fontSize:prFs,fontWeight:900,color:"#fff",margin:0,lineHeight:1,textShadow:ts}}>{pr}</p>
      <div style={{display:"flex",alignItems:"center",gap:Math.round(12*unit),marginTop:Math.round(10*unit),paddingTop:Math.round(10*unit),borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        {headshot&&<img src={headshot} alt="" style={{width:hsSize,height:hsSize,borderRadius:"50%",objectFit:"cover",border:`${Math.round(3*unit)}px solid rgba(255,255,255,0.25)`,boxShadow:brandShadow?"0 4px 16px rgba(0,0,0,0.5)":"none"}}/>}
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:brandFs,fontWeight:700,color:"rgba(255,255,255,0.85)",margin:0,textShadow:bts}}>{brand}</p>
          {br&&<p style={{fontSize:Math.round(brandFs*0.7),fontWeight:500,color:"rgba(255,255,255,0.5)",margin:0,marginTop:Math.round(4*unit),textShadow:bts}}>{br}</p>}
        </div>
        {logo&&<img src={logo} alt="" style={{maxHeight:logoH,maxWidth:logoW,objectFit:"contain" as const,filter:brandShadow?"drop-shadow(0 2px 8px rgba(0,0,0,0.5))":"none"}}/>}
      </div>
    </div>
  </div>);
}

// ─── CinematicTemplate ───────────────────────────────────────────────────────
function CinematicTemplate({size,listingPhoto,videoElement,headshot,badgeText,badgeColor,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,logo,fontFamily,barColor,accentColor,brandShadow}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff";
  const barPct=isStory?14:16;
  const barH=Math.round(h*barPct/100);
  const ad=address||"123 Main Street";const ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join(" \u00b7 ")||"";
  const pr=price?`$${price}`:"$000,000";
  const brand=[agentName,phone].filter(Boolean).join(" \u00b7 ")||"";
  const br=brokerage||"";
  const badgeFs=Math.round((isStory?32:isPostcard?22:20)*unit);
  const adFs=responsiveSize(Math.round((isStory?38:isPostcard?28:26)*unit),ad,24);
  const prFs=Math.round((isStory?64:isPostcard?46:42)*unit);
  const detFs=Math.round((isStory?30:isPostcard?22:20)*unit);
  const brandFs=Math.round((isStory?44:isPostcard?34:30)*unit);
  const hsSize=Math.round((isStory?80:isPostcard?60:52)*unit);
  const logoH=Math.round((isStory?70:50)*unit);const logoW=Math.round((isStory?200:140)*unit);
  const pad=Math.round(36*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily,backgroundColor:"#000"}}>
    <div style={{position:"absolute",top:barH,left:0,right:0,bottom:barH,overflow:"hidden"}}>
      {videoElement?<div data-video-area style={{width:"100%",height:"100%",overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1a1a2e"}}/>}
      <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 60px rgba(0,0,0,0.4)"}}/>
    </div>
    <div style={{position:"absolute",top:0,left:0,right:0,height:barH,backgroundColor:"#000",display:"flex",alignItems:"center",justifyContent:"space-between",padding:`0 ${pad}px`}}>
      <div style={{display:"inline-flex",padding:`${Math.round(5*unit)}px ${Math.round(14*unit)}px`,backgroundColor:badgeColor,borderRadius:Math.round(3*unit)}}><span style={{fontSize:badgeFs,fontWeight:800,color:isLightColor(badgeColor)?"#111":"#fff",letterSpacing:"0.14em",textTransform:"uppercase" as const}}>{badgeText}</span></div>
      <p style={{fontSize:adFs,fontWeight:600,color:"rgba(255,255,255,0.8)",margin:0}}>{ad}{ad2?` \u00b7 ${ad2}`:""}</p>
    </div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:barH,backgroundColor:"#000",display:"flex",alignItems:"center",justifyContent:"space-between",padding:`0 ${pad}px`}}>
      <div>
        <p style={{fontSize:prFs,fontWeight:900,color:"#fff",margin:0,lineHeight:1}}>{pr}</p>
        {det&&<p style={{fontSize:detFs,fontWeight:400,color:"rgba(255,255,255,0.4)",margin:0,marginTop:Math.round(2*unit),letterSpacing:"0.06em"}}>{det}</p>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:Math.round(14*unit)}}>
        {headshot&&<img src={headshot} alt="" style={{width:hsSize,height:hsSize,borderRadius:"50%",objectFit:"cover",border:`${Math.round(2*unit)}px solid rgba(255,255,255,0.2)`}}/>}
        <div style={{textAlign:"right" as const,flex:1}}>
          <p style={{fontSize:brandFs,fontWeight:700,color:"rgba(255,255,255,0.85)",margin:0}}>{brand}</p>
          {br&&<p style={{fontSize:Math.round(brandFs*0.65),fontWeight:500,color:"rgba(255,255,255,0.45)",margin:0,marginTop:Math.round(2*unit)}}>{br}</p>}
        </div>
        {logo&&<img src={logo} alt="" style={{maxHeight:logoH,maxWidth:logoW,objectFit:"contain" as const}}/>}
      </div>
    </div>
  </div>);
}

// ─── BoldFrameTemplate ───────────────────────────────────────────────────────
function BoldFrameTemplate({size,listingPhoto,videoElement,headshot,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,logo,fontFamily,barColor,accentColor,brandShadow,badgeText}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const frameColor=accentColor||barColor||"#dc2626";
  const frameW=Math.round((isStory?90:isPostcard?70:76)*unit);
  const ad=address||"123 Main Street";const ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join(" \u00b7 ")||"";
  const pr=price?`$${price}`:"$000,000";
  const brand=[agentName,phone].filter(Boolean).join(" \u00b7 ")||"";
  const br=brokerage||"";
  const frameLight=isLightColor(frameColor);
  const ts=`0 ${Math.round(2*unit)}px ${Math.round(10*unit)}px rgba(0,0,0,0.6)`;
  const badgeFs=Math.round((isStory?24:isPostcard?18:16)*unit);
  const prFs=Math.round((isStory?96:isPostcard?68:60)*unit);
  const adFs=responsiveSize(Math.round((isStory?36:isPostcard?24:22)*unit),ad,20);
  const detFs=Math.round((isStory?24:isPostcard?16:14)*unit);
  const brandFs=Math.round((isStory?34:isPostcard?24:20)*unit);
  const hsSize=Math.round((isStory?64:isPostcard?50:44)*unit);
  const logoH=Math.round((isStory?60:44)*unit);const logoW=Math.round((isStory?160:110)*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily,backgroundColor:frameColor}}>
    <div style={{position:"absolute",top:frameW,left:frameW,right:frameW,bottom:frameW,overflow:"hidden",borderRadius:Math.round(4*unit)}}>
      {videoElement?<div data-video-area style={{width:"100%",height:"100%",overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#0f0f1a"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.15) 40%,rgba(0,0,0,0.55) 100%)"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:Math.round(30*unit),textAlign:"center" as const,gap:Math.round(8*unit)}}>
        <p style={{fontSize:prFs,fontWeight:900,color:"#fff",margin:0,lineHeight:0.95,letterSpacing:"-0.02em",textShadow:ts}}>{pr}</p>
        <p style={{fontSize:adFs,fontWeight:600,color:"rgba(255,255,255,0.85)",margin:0,textShadow:ts}}>{ad}{ad2?` | ${ad2}`:""}</p>
        {det&&<p style={{fontSize:detFs,fontWeight:400,color:"rgba(255,255,255,0.5)",margin:0,letterSpacing:"0.08em",textShadow:ts}}>{det}</p>}
      </div>
    </div>
    <div style={{position:"absolute",top:0,left:0,right:0,height:frameW,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:badgeFs,fontWeight:900,color:frameLight?"#111":"#fff",letterSpacing:"0.18em",textTransform:"uppercase" as const}}>{badgeText||"Price Reduced"}</span></div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:frameW,display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(12*unit),padding:`0 ${Math.round(20*unit)}px`}}>
      {headshot&&<img src={headshot} alt="" style={{width:hsSize,height:hsSize,borderRadius:"50%",objectFit:"cover",border:`${Math.round(2*unit)}px solid ${frameLight?"rgba(0,0,0,0.1)":"rgba(255,255,255,0.25)"}`}}/>}
      {logo&&<img src={logo} alt="" style={{maxHeight:logoH,maxWidth:logoW,objectFit:"contain" as const}}/>}
      <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-start",gap:Math.round(2*unit)}}>
        <p style={{fontSize:brandFs,fontWeight:700,color:frameLight?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.85)",margin:0}}>{brand}</p>
        {br&&<p style={{fontSize:Math.round(brandFs*0.7),fontWeight:500,color:frameLight?"rgba(0,0,0,0.45)":"rgba(255,255,255,0.5)",margin:0}}>{br}</p>}
      </div>
    </div>
  </div>);
}

// ─── OpenHouseTemplate ────────────────────────────────────────────────────────
function OpenHouseTemplate({size,listingPhoto,videoElement,headshot,logo,address,addressLine2,beds,baths,sqft,price,date,time,agentName,phone,brokerage,fontFamily,barColor,accentColor}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff",badgeBg=accentColor||"#059669",barLight=isLightColor(barColor),pad=Math.round(44*unit);
  const ad=address||"123 Main Street",ad2=addressLine2||"",dt=date||"Saturday, March 22",tm2=time||"1:00 PM \u2013 4:00 PM";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  \u00b7  ")||"3 BD  \u00b7  2 BA  \u00b7  1,800 SF";
  const pr=price?`$${price}`:"$000,000",an=agentName||"Agent Name";
  const cl=[brokerage,phone].filter(Boolean).join("  \u00b7  ")||"Brokerage  \u00b7  (555) 000-0000";
  const bFs=Math.round((isStory?68:isPostcard?42:36)*unit),dFs=Math.round((isStory?58:isPostcard?36:32)*unit),tFs=Math.round((isStory?44:isPostcard?28:24)*unit);
  const aFs=responsiveSize(Math.round((isStory?58:isPostcard?36:32)*unit),ad,22);
  const pFs=Math.round((isStory?86:isPostcard?52:46)*unit),agFs=responsiveSize(Math.round((isStory?52:isPostcard?34:30)*unit),an,20);
  const cFs=responsiveSize(Math.round((isStory?40:isPostcard?26:22)*unit),cl,35),hsz=Math.round((isStory?180:isPostcard?120:110)*unit);
  const abH=Math.round((isStory?220:isPostcard?140:130)*unit),ts2=`0 ${Math.round(2*unit)}px ${Math.round(8*unit)}px rgba(0,0,0,0.5)`;
  const detFs=Math.round((isStory?44:isPostcard?28:24)*unit);
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}>{videoElement?<div data-video-area style={{position:"absolute",inset:0,overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{position:"absolute",inset:0,backgroundColor:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageIcon style={{width:64*unit,height:64*unit,color:"rgba(255,255,255,0.12)"}}/></div>}<div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.15) 25%,transparent 40%)"}}/><div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.35) 20%,transparent 45%)"}}/><div style={{position:"absolute",top:0,left:0,right:0,height:isStory?"26%":"34%",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`0 ${pad}px`,textAlign:"center" as const}}><div style={{display:"inline-flex",alignItems:"center",padding:`${Math.round((isStory?16:8)*unit)}px ${Math.round((isStory?44:24)*unit)}px`,backgroundColor:badgeBg,borderRadius:Math.round(6*unit),boxShadow:`0 ${Math.round(4*unit)}px ${Math.round(24*unit)}px ${hexToRgba(badgeBg,0.4)}`}}><span style={{fontSize:bFs,fontWeight:800,color:isLightColor(badgeBg)?"#111":"#fff",letterSpacing:"0.16em",textTransform:"uppercase" as const,lineHeight:1}}>Open House</span></div><p style={{fontSize:dFs,fontWeight:800,color:"#fff",margin:0,marginTop:Math.round(18*unit),textShadow:ts2}}>{dt}</p><p style={{fontSize:tFs,fontWeight:500,color:"rgba(255,255,255,0.75)",margin:0,marginTop:Math.round(6*unit),textShadow:ts2}}>{tm2}</p></div><div style={{position:"absolute",bottom:0,left:0,right:0,padding:`0 ${pad}px`}}><div style={{textAlign:"center" as const,marginBottom:Math.round(14*unit)}}><p style={{fontSize:aFs,fontWeight:700,color:"#fff",lineHeight:1.2,margin:0,textShadow:ts2}}>{ad}</p>{ad2&&<p style={{fontSize:Math.round(aFs*0.75),fontWeight:500,color:"rgba(255,255,255,0.75)",margin:0,marginTop:Math.round(4*unit),textShadow:ts2}}>{ad2}</p>}<p style={{fontSize:detFs,fontWeight:500,color:"rgba(255,255,255,0.70)",margin:0,marginTop:Math.round(6*unit),textShadow:ts2}}>{det}</p><div style={{width:Math.round(50*unit),height:Math.round(2*unit),backgroundColor:accentColor||"rgba(255,255,255,0.20)",margin:`${Math.round(10*unit)}px auto ${Math.round(8*unit)}px`,borderRadius:1,opacity:accentColor?0.7:1}}/><p style={{fontSize:pFs,fontWeight:800,color:accent,lineHeight:1.0,margin:0,textShadow:accentColor?`0 ${Math.round(2*unit)}px ${Math.round(14*unit)}px ${hexToRgba(accentColor,0.35)}`:ts2}}>{pr}</p></div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(14*unit),height:abH,padding:`0 ${Math.round(24*unit)}px`,backgroundColor:hexToRgba(barColor,0.88),borderRadius:`${Math.round(14*unit)}px ${Math.round(14*unit)}px 0 0`}}>{headshot?<img src={headshot} alt="" style={{width:hsz,height:hsz,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`${Math.round(2.5*unit)}px solid ${accentColor?hexToRgba(accentColor,0.5):"rgba(255,255,255,0.25)"}`}}/>:<div style={{width:hsz,height:hsz,borderRadius:"50%",backgroundColor:barLight?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><User style={{width:hsz*0.38,height:hsz*0.38,color:"rgba(255,255,255,0.25)"}}/></div>}<div style={{minWidth:0}}><p style={{fontSize:agFs,fontWeight:700,color:barLight?"#111827":"#fff",margin:0,whiteSpace:"nowrap"}}>{an}</p><p style={{fontSize:cFs,fontWeight:500,color:barLight?"rgba(17,24,39,0.50)":"rgba(255,255,255,0.50)",margin:0,marginTop:Math.round(2*unit)}}>{cl}</p></div>{logo&&<img src={logo} alt="" style={{maxWidth:Math.round((isStory?260:150)*unit),maxHeight:Math.round((isStory?110:64)*unit),objectFit:"contain" as const,flexShrink:0,marginLeft:"auto"}}/>}</div></div></div>);
}

// ─── YardSign components ────────────────────────────────────────────────────────
function YardSignSplitBar({width,height,headshot,logo,agentName,phone,email,brokerage,officeName,officePhone,headerText,topColor,bottomColor,fontFamily,qrDataUrl,bulletPoints}:any){
  const topH=Math.round(height*0.15),bottomH=Math.round(height*0.15),centerH=height-topH-bottomH;
  const tL=isLightColor(topColor),bL=isLightColor(bottomColor),u=width/5400;
  const nt=agentName||"AGENT NAME",pt=phone||"321-555-4321",ot=officeName||brokerage||"OFFICE NAME";
  const hSz=Math.round(centerH*0.42),hdrSz=Math.round(topH*0.48);
  const nSz=responsiveSize(Math.round(centerH*0.072),nt,16),pSz=Math.round(centerH*0.058),dSz=Math.round(centerH*0.038);
  const bNSz=responsiveSize(Math.round(bottomH*0.30),ot,18),bPSz=Math.round(bottomH*0.22);
  const tC=tL?"#000":"#fff",bC=bL?"#000":"#fff",tR=tL?"rgba(0,0,0,0.20)":"rgba(255,255,255,0.30)",bR=bL?"rgba(0,0,0,0.15)":"rgba(255,255,255,0.25)";
  const showBothLines=!!(officeName&&brokerage&&officeName!==brokerage);
  return(<div style={{width,height,fontFamily,display:"flex",flexDirection:"column" as const}}><div style={{height:topH,backgroundColor:topColor,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{display:"flex",alignItems:"center",gap:Math.round(width*0.03)}}><div style={{width:Math.round(width*0.07),height:Math.round(3*u),backgroundColor:tR}}/><p style={{fontSize:hdrSz,fontWeight:900,color:tC,letterSpacing:"0.14em",textTransform:"uppercase" as const,margin:0,lineHeight:1}}>{headerText||"FOR SALE"}</p><div style={{width:Math.round(width*0.07),height:Math.round(3*u),backgroundColor:tR}}/></div></div><div style={{height:centerH,backgroundColor:"#fff",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(centerH*0.06)}px ${Math.round(width*0.08)}px`,gap:Math.round(centerH*0.03),position:"relative"}}><div style={{position:"absolute",top:0,left:Math.round(width*0.1),right:Math.round(width*0.1),height:Math.round(4*u),backgroundColor:topColor,opacity:0.15}}/>{headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`}}/>:<div style={{width:hSz,height:hSz,backgroundColor:"#f3f4f6",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:"#9ca3af"}}/></div>}<p style={{fontSize:nSz,fontWeight:800,color:"#111",margin:0,textAlign:"center" as const,letterSpacing:"0.05em",textTransform:"uppercase" as const,whiteSpace:"nowrap"}}>{nt}</p><div style={{width:Math.round(width*0.10),height:Math.round(4*u),backgroundColor:topColor,borderRadius:2}}/><p style={{fontSize:pSz,fontWeight:600,color:"#333",margin:0,textAlign:"center" as const}}>{pt}</p>{email&&<p style={{fontSize:dSz,fontWeight:400,color:"#666",margin:0,textAlign:"center" as const}}>{email}</p>}{bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.02)}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:dSz,fontWeight:600,color:"#444",textTransform:"uppercase" as const}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.01)}px`,color:topColor}}>{"\u00b7"}</span>}{bp}</span>))}</div>}{(logo||qrDataUrl)&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.03),marginTop:Math.round(centerH*0.01)}}>{logo&&<img src={logo} alt="" style={{maxHeight:Math.round(centerH*0.12),maxWidth:Math.round(width*0.25),objectFit:"contain" as const}}/>}{qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(centerH*0.22),height:Math.round(centerH*0.22),borderRadius:Math.round(4*u)}}/>}</div>}<div style={{position:"absolute",bottom:0,left:Math.round(width*0.1),right:Math.round(width*0.1),height:Math.round(4*u),backgroundColor:bottomColor,opacity:0.15}}/></div><div style={{height:bottomH,backgroundColor:bottomColor,display:"flex",alignItems:"center",justifyContent:"center",padding:`0 ${Math.round(width*0.06)}px`}}><div style={{textAlign:"center" as const}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.025)}}><div style={{width:Math.round(width*0.05),height:Math.round(2*u),backgroundColor:bR}}/><div>{showBothLines?<><p style={{fontSize:bNSz,fontWeight:800,color:bC,margin:0,letterSpacing:"0.05em"}}>{brokerage}</p><p style={{fontSize:Math.round(bNSz*0.7),fontWeight:600,color:bC,margin:0,marginTop:Math.round(height*0.004),letterSpacing:"0.03em",opacity:0.8}}>{officeName}</p></>:<p style={{fontSize:bNSz,fontWeight:800,color:bC,margin:0,letterSpacing:"0.05em"}}>{ot}</p>}</div><div style={{width:Math.round(width*0.05),height:Math.round(2*u),backgroundColor:bR}}/></div>{officePhone&&<p style={{fontSize:bPSz,fontWeight:600,color:bC,margin:0,marginTop:Math.round(height*0.008)}}>{officePhone}</p>}</div></div></div>);
}
function YardSignSidebar({width,height,headshot,logo,agentName,phone,email,brokerage,website,headerText,sidebarColor,mainBgColor,fontFamily,qrDataUrl,bulletPoints}:any){
  const sW=Math.round(width*0.16),mW=width-sW,sL=isLightColor(sidebarColor),mL=isLightColor(mainBgColor);
  const mT=mL?"#111":"#fff",mM=mL?"#555":"rgba(255,255,255,0.55)",u=width/5400;
  const nt=agentName||"AGENT NAME",pt=phone||"206.866.6678",bt=brokerage||"BROKERAGE";
  const hSz=Math.round(mW*0.38),hdrSz=Math.round(height*0.042),nSz=responsiveSize(Math.round(height*0.044),nt,16);
  const pSz=Math.round(height*0.034),dSz=Math.round(height*0.022),bSz=Math.round(height*0.020),lSz=Math.round(sW*0.55);
  const sC=sL?"#000":"#fff",sM=sL?"rgba(0,0,0,0.20)":"rgba(255,255,255,0.20)";
  return(<div style={{width,height,fontFamily,display:"flex"}}><div style={{width:sW,height,background:`linear-gradient(to bottom,${sidebarColor},${darken(sidebarColor,12)})`,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"space-between",padding:`${Math.round(height*0.04)}px ${Math.round(sW*0.08)}px`}}>{logo&&<img src={logo} alt="" style={{width:lSz,height:lSz,objectFit:"contain" as const}}/>}<p style={{fontSize:Math.round(sW*0.20),fontWeight:800,color:sC,writingMode:"vertical-rl" as any,textOrientation:"mixed" as any,letterSpacing:"0.14em",textTransform:"uppercase" as const,opacity:0.9}}>{bt}</p>{logo&&<img src={logo} alt="" style={{width:lSz,height:lSz,objectFit:"contain" as const}}/>}{!logo&&<div style={{width:Math.round(sW*0.4),height:Math.round(2*u),backgroundColor:sM}}/>}</div><div style={{width:mW,height,backgroundColor:mainBgColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(height*0.02)}px ${Math.round(width*0.04)}px`,textAlign:"center" as const,position:"relative",gap:Math.round(height*0.008)}}><div style={{backgroundColor:sidebarColor,padding:`${Math.round(height*0.012)}px ${Math.round(width*0.06)}px`,borderRadius:Math.round(6*u),marginBottom:Math.round(height*0.012)}}><p style={{fontSize:hdrSz,fontWeight:900,color:sL?"#000":"#fff",letterSpacing:"0.12em",textTransform:"uppercase" as const,margin:0,lineHeight:1}}>{headerText||"FOR SALE"}</p></div>{headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${sidebarColor}`}}/>:<div style={{width:hSz,height:hSz,borderRadius:"50%",backgroundColor:mL?"#e5e7eb":"rgba(255,255,255,0.08)",border:`${Math.round(6*u)}px solid ${sidebarColor}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:mM}}/></div>}<div style={{width:Math.round(width*0.08),height:Math.round(3*u),backgroundColor:sidebarColor,opacity:0.4}}/><p style={{fontSize:nSz,fontWeight:800,color:mT,margin:0,letterSpacing:"0.06em",textTransform:"uppercase" as const,whiteSpace:"nowrap"}}>{nt}</p><p style={{fontSize:dSz,color:mM,margin:0,textTransform:"uppercase" as const,letterSpacing:"0.08em",fontWeight:500}}>Real Estate Agent</p><div style={{width:Math.round(width*0.08),height:Math.round(3*u),backgroundColor:sidebarColor,opacity:0.4}}/><p style={{fontSize:pSz,fontWeight:700,color:mT,margin:0}}>{pt}</p>{website&&<p style={{fontSize:dSz,color:mM,margin:0,marginTop:Math.round(height*0.008)}}>{website}</p>}{email&&<p style={{fontSize:dSz,color:mM,margin:0,marginTop:Math.round(height*0.005)}}>{email}</p>}{bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.015),marginTop:Math.round(height*0.015),flexWrap:"wrap" as const}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:bSz,fontWeight:600,color:mT,opacity:0.7}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.008)}px`,color:sidebarColor}}>{"\u00b7"}</span>}{bp}</span>))}</div>}{qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(height*0.12),height:Math.round(height*0.12),marginTop:Math.round(height*0.015),borderRadius:Math.round(4*u)}}/>}</div></div>);
}
function YardSignTopHeavy({width,height,headshot,logo,agentName,phone,email,brokerage,headerText,topColor,bottomColor,fontFamily,qrDataUrl,bulletPoints}:any){
  const topH=Math.round(height*0.38),bottomH=height-topH,tL=isLightColor(topColor),bL=isLightColor(bottomColor);
  const u=width/5400,hdrSz=Math.round(topH*0.28),hSz=Math.round(bottomH*0.38);
  const bT=bL?"#111":"#fff",bM=bL?"#555":"rgba(255,255,255,0.65)";
  const nt=agentName||"Agent Name",pt=phone||"305.555.7315",bt=brokerage||"";
  const nSz=responsiveSize(Math.round(bottomH*0.08),nt,16),pSz=Math.round(bottomH*0.065),dSz=Math.round(bottomH*0.04);
  return(<div style={{width,height,fontFamily,display:"flex",flexDirection:"column" as const}}><div style={{height:topH,backgroundColor:topColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:Math.round(width*0.06),textAlign:"center" as const}}><p style={{fontSize:hdrSz,fontWeight:900,color:tL?"#000":"#fff",letterSpacing:"0.05em",textTransform:"uppercase" as const,lineHeight:1.0,margin:0}}>{headerText||"FOR SALE"}</p>{logo&&<img src={logo} alt="" style={{maxHeight:Math.round(topH*0.22),maxWidth:Math.round(width*0.45),objectFit:"contain" as const,marginTop:Math.round(topH*0.08)}}/>}{!logo&&bt&&<p style={{fontSize:Math.round(topH*0.10),fontWeight:700,color:tL?"#000":"#fff",marginTop:Math.round(topH*0.06),textTransform:"uppercase" as const,letterSpacing:"0.08em",margin:0}}>{bt}</p>}</div><div style={{height:bottomH,backgroundColor:bottomColor,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:`${Math.round(width*0.03)}px ${Math.round(width*0.06)}px`,textAlign:"center" as const,gap:Math.round(bottomH*0.01)}}>{headshot?<img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",border:`${Math.round(6*u)}px solid ${topColor}`}}/>:<div style={{width:hSz,height:hSz,backgroundColor:bL?"#e5e7eb":"rgba(255,255,255,0.08)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:bM}}/></div>}<p style={{fontSize:nSz,fontWeight:800,color:bT,lineHeight:1.1,margin:0}}>{nt}</p><p style={{fontSize:dSz,color:bM,textTransform:"uppercase" as const,letterSpacing:"0.05em",margin:0}}>Real Estate Agent</p><p style={{fontSize:pSz,fontWeight:700,color:bT,margin:0}}>{pt}</p>{email&&<p style={{fontSize:dSz,color:bM,margin:0}}>{email}</p>}{bulletPoints?.filter(Boolean).length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:Math.round(width*0.02),marginTop:Math.round(bottomH*0.015),flexWrap:"wrap" as const}}>{bulletPoints.filter(Boolean).map((bp:string,i:number)=>(<span key={i} style={{fontSize:dSz,fontWeight:600,color:bT,opacity:0.7}}>{i>0&&<span style={{margin:`0 ${Math.round(width*0.008)}px`,color:topColor}}>{"\u00b7"}</span>}{bp}</span>))}</div>}{qrDataUrl&&<img src={qrDataUrl} alt="QR" style={{width:Math.round(bottomH*0.18),height:Math.round(bottomH*0.18),borderRadius:4}}/>}</div></div>);
}

// ─── PropertyPdfPage ──────────────────────────────────────────────────────────
function PropertyPdfPage({pageNumber,address,cityStateZip,price,beds,baths,sqft,description,features,photos,accentColor,fontFamily}:any){
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
    const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  \u00b7  ");
    const heroH=Math.round(H*0.42),lW=Math.round(W*0.48),rW=W-lW,pd=100;
    return(<div style={{width:W,height:H,backgroundColor:"#fff",fontFamily,position:"relative",padding:margin}}><div style={{position:"absolute",top:margin,left:margin,right:margin,height:hBar,backgroundColor:accent}}/><div style={{position:"absolute",top:margin+hBar,left:margin,right:margin,height:heroH,overflow:"hidden"}}>{hp?<img src={hp} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#f0efea",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:56}}>HERO PHOTO</span></div>}</div><div style={{position:"absolute",top:heroH+hBar+margin,left:margin,right:margin,bottom:margin+hBar,display:"flex"}}><div style={{width:lW,padding:`${pd*0.6}px ${pd*0.6}px ${pd*0.5}px ${pd*0.3}px`,display:"flex",flexDirection:"column" as const,justifyContent:"flex-start",overflow:"hidden"}}><p style={{fontSize:50,color:accent,fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase" as const,margin:0}}>Introducing</p><p style={{fontSize:responsiveSize(102,aT,18),color:"#1a1a1a",fontWeight:800,lineHeight:1.05,margin:0,marginTop:12}}>{aT}</p><p style={{fontSize:42,color:"#666",fontWeight:500,margin:0,marginTop:10}}>{cT}</p><div style={{width:70,height:4,backgroundColor:accent,marginTop:28,borderRadius:2}}/><p style={{fontSize:112,fontWeight:800,color:accent,margin:0,marginTop:14,lineHeight:1.0}}>{pT}</p>{det&&<p style={{fontSize:42,color:"#555",fontWeight:600,margin:0,marginTop:10,letterSpacing:"0.06em"}}>{det}</p>}{fLines.length>0&&<div style={{marginTop:36}}><p style={{fontSize:38,fontWeight:700,color:"#333",letterSpacing:"0.10em",textTransform:"uppercase" as const,margin:0,marginBottom:16}}>Key Features</p><div style={{fontSize:38,color:"#444",lineHeight:2.0}}>{fLines.map((f:string,i:number)=>(<div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}><span style={{color:accent,flexShrink:0,fontWeight:700,fontSize:28,marginTop:5}}>{"\u2014"}</span><span style={{fontWeight:500}}>{f.replace(/^[\u2022\-*]\s*/,"")}</span></div>))}</div></div>}{p1D.length>0&&<div style={{marginTop:32}}><p style={{fontSize:38,fontWeight:700,color:"#333",letterSpacing:"0.10em",textTransform:"uppercase" as const,margin:0,marginBottom:14}}>About This Property</p><div style={{fontSize:38,color:"#555",lineHeight:1.7}}>{p1D.map((p:string,i:number)=><p key={i} style={{margin:0,marginBottom:10}}>{p}</p>)}</div></div>}</div><div style={{width:3,backgroundColor:accent,opacity:0.15,marginTop:Math.round(pd*0.5),marginBottom:Math.round(pd*0.5),flexShrink:0}}/><div style={{width:rW,display:"flex",flexDirection:"column" as const,padding:`${Math.round(pd*0.4)}px ${Math.round(pd*0.3)}px ${Math.round(pd*0.4)}px ${Math.round(pd*0.4)}px`,gap:10}}><div style={{flex:1,borderRadius:16,overflow:"hidden"}}>{p2?<img src={p2} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#f0efea",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:44}}>Photo 2</span></div>}</div><div style={{flex:1,borderRadius:16,overflow:"hidden"}}>{p3?<img src={p3} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#f5f5f0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#ccc",fontSize:44}}>Photo 3</span></div>}</div></div></div><div style={{position:"absolute",bottom:margin,left:margin,right:margin,height:hBar,backgroundColor:accent}}/></div>);
  }
  const hasOverflow=ovD.length>0;
  const isFirstGrid=pageNumber===1;
  const showOverflow=isFirstGrid&&hasOverflow;
  const overflowH=showOverflow?600:0;
  const startIdx=3+(pageNumber-1)*6;
  const slotsOnPage=(isFirstGrid&&hasOverflow)?4:6;
  const pgPhotos=photos.slice(startIdx,startIdx+slotsOnPage);
  const pgPad=100,pgGap=24,gridH=H-pgPad*2-80-hBar-overflowH,colW=Math.round((W-pgPad*2-pgGap)/2);
  const rows=showOverflow?2:3;
  const photoH=Math.round((gridH-pgGap*(rows-1))/rows);
  return(<div style={{width:W,height:H,backgroundColor:"#fff",fontFamily,position:"relative"}}><div style={{position:"absolute",top:0,left:0,right:0,height:hBar,backgroundColor:accent}}/>{showOverflow&&<div style={{padding:`${pgPad+hBar}px ${pgPad}px 0`,height:overflowH}}><div style={{fontSize:38,color:"#555",lineHeight:1.7,overflowWrap:"break-word" as const}}>{ovD.map((p:string,i:number)=><p key={i} style={{margin:0,marginBottom:10}}>{p}</p>)}</div></div>}<div style={{padding:`${showOverflow?pgGap:pgPad+hBar}px ${pgPad}px ${pgPad}px`,display:"flex",gap:pgGap}}><div style={{width:colW,display:"flex",flexDirection:"column" as const,gap:pgGap}}>{Array.from({length:rows},(_,r)=>r*2).map(idx=>{const p=pgPhotos[idx];return<div key={idx} style={{height:photoH,borderRadius:16,overflow:"hidden",backgroundColor:p?undefined:"#f5f5f0"}}>{p&&<img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>;})}</div><div style={{width:colW,display:"flex",flexDirection:"column" as const,gap:pgGap}}>{Array.from({length:rows},(_,r)=>r*2+1).map(idx=>{const p=pgPhotos[idx];return<div key={idx} style={{height:photoH,borderRadius:16,overflow:"hidden",backgroundColor:p?undefined:"#f5f5f0"}}>{p&&<img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>;})}</div></div><div style={{position:"absolute",bottom:0,left:0,right:0,height:hBar,backgroundColor:accent}}/></div>);
}

// ─── BrandingCardTemplate ─────────────────────────────────────────────────────
function BrandingCardTemplate({orientation,logo,headshot,agentName,phone:ph2,email,brokerage,tagline,website,address:addr,cityState,price:pr2,features,bgColor,accentColor,bgPhoto,fontFamily}:any){
  const w=orientation.width,h=orientation.height,isV=orientation.id==="vertical";
  const isLBg=bgColor&&!bgPhoto?isLightColor(bgColor):false;
  const tC=isLBg?"#1a1a2e":"#fff",tM=isLBg?"rgba(26,26,46,0.50)":"rgba(255,255,255,0.55)";
  const bC=isLBg?"rgba(0,0,0,0.12)":"rgba(255,255,255,0.12)",accent=accentColor||tC;
  const nt=agentName||"Agent Name",hasProp=!!(addr||pr2);
  if(isV){
    const u=w/1080,inset=Math.round(24*u),rad=Math.round(24*u),bd=Math.round(3*u),pad=Math.round(36*u);
    const hSz=Math.round(560*u),fb=Math.round(8*u),nFs=responsiveSize(Math.round(80*u),nt,14);
    const crnL=40,crnW=2,crnI=Math.round(36*u);
    const Corner=({top,left,right,bottom}:{top?:number;left?:number;right?:number;bottom?:number})=>(<><div style={{position:"absolute",top,left,right,bottom,width:crnL,height:crnW,backgroundColor:accent,opacity:0.35}}/><div style={{position:"absolute",top,left,right,bottom,width:crnW,height:crnL,backgroundColor:accent,opacity:0.35}}/></>);
    return(<div style={{width:w,height:h,background:"transparent",position:"relative"}}><div style={{position:"absolute",top:inset,left:inset,right:inset,bottom:inset,borderRadius:rad,border:`${bd}px solid ${bC}`,backgroundColor:bgColor||"#14532d",overflow:"hidden",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",padding:pad,fontFamily}}>{bgPhoto&&<><img src={bgPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.55)"}}/></>}<Corner top={crnI} left={crnI}/><Corner top={crnI} right={crnI}/><Corner bottom={crnI} left={crnI}/><Corner bottom={crnI} right={crnI}/><div style={{position:"relative",zIndex:1,textAlign:"center" as const,width:"100%",display:"flex",flexDirection:"column" as const,alignItems:"center",gap:Math.round(10*u)}}>{logo&&<img src={logo} alt="" style={{maxWidth:Math.round(400*u),maxHeight:Math.round(160*u),objectFit:"contain" as const,marginBottom:Math.round(14*u)}}/>}{headshot?<div style={{padding:fb,background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.3)})`:bC,borderRadius:Math.round(20*u)}}><img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:Math.round(14*u),display:"block"}}/></div>:<div style={{width:hSz,height:hSz,backgroundColor:"rgba(255,255,255,0.06)",border:`${fb}px solid ${bC}`,borderRadius:Math.round(20*u),display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:100*u,height:100*u,color:tM}}/></div>}<p style={{fontSize:nFs,fontWeight:800,color:accent,margin:0,marginTop:Math.round(18*u),whiteSpace:"nowrap"}}>{nt}</p><div style={{width:Math.round(70*u),height:3,backgroundColor:accent,opacity:0.4,margin:`${Math.round(6*u)}px 0`}}/>{brokerage&&<p style={{fontSize:Math.round(40*u),color:tM,margin:0,fontWeight:500}}>{brokerage}</p>}<div style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:Math.round(8*u),marginTop:Math.round(8*u)}}>{ph2&&<span style={{fontSize:Math.round(44*u),color:tC,fontWeight:700}}>{ph2}</span>}{email&&<span style={{fontSize:Math.round(38*u),color:tC,opacity:0.85}}>{email}</span>}</div>{website&&<><div style={{width:"60%",height:1,backgroundColor:bC,marginTop:Math.round(10*u)}}/><p style={{fontSize:Math.round(40*u),color:tC,fontWeight:600,margin:0,marginTop:Math.round(6*u)}}>{website}</p></>}{tagline&&<p style={{fontSize:Math.round(34*u),color:accentColor||tM,fontStyle:"italic",margin:0,marginTop:Math.round(8*u)}}>{tagline}</p>}{hasProp&&<div style={{marginTop:Math.round(24*u),paddingTop:Math.round(20*u),borderTop:`2px solid ${bC}`,width:"80%"}}>{addr&&<p style={{fontSize:responsiveSize(Math.round(60*u),addr,16),fontWeight:700,color:tC,margin:0,lineHeight:1.1}}>{addr}</p>}{cityState&&<p style={{fontSize:Math.round(40*u),fontWeight:500,color:tM,margin:0,marginTop:Math.round(8*u)}}>{cityState}</p>}{pr2&&<p style={{fontSize:Math.round(56*u),fontWeight:800,color:accent,margin:0,marginTop:Math.round(14*u)}}>${pr2}</p>}{features&&<div style={{marginTop:Math.round(12*u),color:tM,fontSize:Math.round(34*u),lineHeight:1.6}}>{features.split("\n").filter(Boolean).map((f:string,i:number)=><div key={i}>{f}</div>)}</div>}</div>}</div></div></div>);
  }
  const u=w/1920,uh=h/1080,inset=Math.round(36*u),rad=Math.round(20*u),bdW=Math.round(3*u);
  const padX=Math.round(80*u),padY=Math.round(60*uh),innerH=h-inset*2-bdW*2;
  const hSz=Math.round(innerH*0.62),hBd=Math.round(10*u),nFs=responsiveSize(Math.round(h*0.095),nt,14);
  const cC=isLBg?"#111":"#fff",cM=isLBg?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.75)";
  const aBg=accentColor||(isLBg?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.08)");
  return(<div style={{width:w,height:h,background:"transparent",position:"relative"}}><div style={{position:"absolute",top:inset,left:inset,right:inset,bottom:inset,borderRadius:rad,border:`${bdW}px solid ${bC}`,backgroundColor:bgColor||"#14532d",overflow:"hidden",fontFamily}}>{bgPhoto&&<><img src={bgPhoto} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,backgroundColor:"rgba(0,0,0,0.55)"}}/></>}{!bgPhoto&&<><div style={{position:"absolute",top:-Math.round(h*0.15),right:-Math.round(w*0.02),width:Math.round(w*0.18),height:Math.round(h*0.55),backgroundColor:aBg,transform:"rotate(25deg)",opacity:0.4}}/><div style={{position:"absolute",top:Math.round(h*0.35),right:-Math.round(w*0.05),width:Math.round(w*0.15),height:Math.round(h*0.55),backgroundColor:aBg,transform:"rotate(25deg)",opacity:0.25}}/></>}<div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",width:"100%",height:"100%",padding:`${padY}px ${padX}px`}}><div style={{flex:1,display:"flex",flexDirection:"column" as const,justifyContent:"center",minWidth:0,paddingRight:Math.round(40*u)}}>{(logo||brokerage)&&<div style={{display:"flex",alignItems:"center",gap:Math.round(14*u),marginBottom:Math.round(28*u)}}>{logo&&<img src={logo} alt="" style={{maxWidth:Math.round((w-inset*2)*0.08),maxHeight:Math.round(innerH*0.14),objectFit:"contain" as const}}/>}{brokerage&&<p style={{fontSize:Math.round(h*0.038),color:cM,margin:0,fontWeight:600}}>{brokerage}</p>}</div>}<p style={{fontSize:nFs,fontWeight:900,color:cC,margin:0,lineHeight:1.05,whiteSpace:"nowrap",textTransform:"uppercase" as const}}>{nt}</p><p style={{fontSize:Math.round(h*0.048),fontWeight:500,color:cM,margin:0,marginTop:Math.round(h*0.008)}}>{tagline||"Real Estate Agent"}</p><div style={{width:Math.round(60*u),height:Math.round(5*u),backgroundColor:accent,marginTop:Math.round(h*0.035),marginBottom:Math.round(h*0.03),borderRadius:3}}/><div style={{display:"flex",flexDirection:"column" as const,gap:Math.round(h*0.018)}}>{ph2&&<p style={{fontSize:Math.round(h*0.055),color:cC,fontWeight:700,margin:0}}>{ph2}</p>}{email&&<p style={{fontSize:Math.round(h*0.046),color:cC,fontWeight:500,margin:0,opacity:0.9}}>{email}</p>}{website&&<p style={{fontSize:Math.round(h*0.042),color:cC,fontWeight:500,margin:0,opacity:0.8}}>{website}</p>}</div>{hasProp&&<div style={{marginTop:Math.round(h*0.03),paddingTop:Math.round(h*0.02),borderTop:`2px solid ${bC}`}}><div style={{display:"flex",alignItems:"baseline",gap:Math.round(16*u),flexWrap:"wrap" as const}}>{addr&&<span style={{fontSize:Math.round(h*0.040),fontWeight:600,color:cC}}>{addr}{cityState?`, ${cityState}`:""}</span>}{pr2&&<span style={{fontSize:Math.round(h*0.050),fontWeight:800,color:accent}}>${pr2}</span>}</div>{features&&<div style={{marginTop:Math.round(h*0.008),color:tM,fontSize:Math.round(h*0.032),lineHeight:1.5}}>{features.split("\n").filter(Boolean).map((f:string,i:number)=><span key={i}>{i>0?"  \u00b7  ":""}{f}</span>)}</div>}</div>}</div><div style={{flexShrink:0}}>{headshot?<div style={{padding:hBd,borderRadius:"50%",background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.4)})`:bC,boxShadow:`0 ${Math.round(10*u)}px ${Math.round(36*u)}px rgba(0,0,0,0.25)`}}><img src={headshot} alt="" style={{width:hSz,height:hSz,objectFit:"cover",borderRadius:"50%",display:"block"}}/></div>:<div style={{width:hSz,height:hSz,borderRadius:"50%",backgroundColor:"rgba(255,255,255,0.04)",border:`${hBd}px solid ${bC}`,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hSz*0.35,height:hSz*0.35,color:tM}}/></div>}</div></div></div></div>);
}

// ─── ListingFlyerTemplate ─────────────
function ListingFlyerTemplate({photos,headshot,logo,address,cityState,price,beds,baths,sqft,description,amenities,agentName,phone,email,brokerage,listingUrl,videoUrl,stagingUrl,accentColor,fontFamily,unbranded}:any){
  const W=2550,H=3300;
  const accent=accentColor||"#1e3a5f";
  const accentText=isLightColor(accent)?"#111":"#fff";
  const ACCENT_BAR=12,BRAND_H=220,PHOTO_H=1240;
  const ad=address||"123 Main Street",cs=cityState||"City, State",pr=price?`$${price}`:"$000,000";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  \u00b7  ")||"3 BD  \u00b7  2 BA  \u00b7  1,800 SF";
  const an=agentName||"Agent Name";
  const am=Array.isArray(amenities)?amenities.filter(Boolean):(amenities?String(amenities).split(",").map((s:string)=>s.trim()).filter(Boolean):[]);
  const desc=truncateText(description||"",1536);
  const photoCount=(photos||[]).length;
  const p1=photos?.[0]||null,p2=photos?.[1]||null,p3=photos?.[2]||null;
  const bottomRow=photos?.slice(3,7)||[];
  const showBottomRow=photoCount>3&&bottomRow.length>0;
  const bottomPhotoH=showBottomRow?340:0;
  const totalPhotoBlockH=PHOTO_H+(showBottomRow?20+bottomPhotoH:0);
  const hasUrls=!!(listingUrl||videoUrl||stagingUrl);
  const urlRows:{icon:string;label:string;url:string}[]=[];
  if(listingUrl)urlRows.push({icon:"\ud83d\udd17",label:"View full listing:",url:listingUrl});
  if(videoUrl)urlRows.push({icon:"\ud83c\udfac",label:"Watch the video tour:",url:videoUrl});
  if(stagingUrl)urlRows.push({icon:"\ud83d\udecb\ufe0f",label:"See the staged rooms:",url:stagingUrl});
  const hsz=BRAND_H-40;
  const priceFs=responsiveSize(148,pr,10),addrFs=responsiveSize(64,ad,28),agFs=responsiveSize(52,an,20);
  const M=60;
  const brandH=unbranded?0:(ACCENT_BAR+BRAND_H);
  const photoTop=M+brandH;
  const detailsTop=photoTop+totalPhotoBlockH;
  return(
    <div style={{width:W,height:H,backgroundColor:"#fff",fontFamily,position:"relative",overflow:"hidden"}}>
      {!unbranded&&<>
        <div style={{position:"absolute",top:M,left:M,right:M,height:ACCENT_BAR,backgroundColor:accent,borderRadius:"4px 4px 0 0"}}/>
        <div style={{position:"absolute",top:M+ACCENT_BAR,left:M,right:M,height:BRAND_H,backgroundColor:accent,display:"flex",alignItems:"center",padding:`0 60px`,gap:28}}>
          {headshot?<img src={headshot} alt="" style={{width:hsz,height:hsz,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`4px solid ${hexToRgba("#ffffff",0.3)}`}}/>:<div style={{width:hsz,height:hsz,borderRadius:"50%",backgroundColor:hexToRgba("#ffffff",0.12),flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><User style={{width:hsz*0.4,height:hsz*0.4,color:hexToRgba("#ffffff",0.4)}}/></div>}
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:agFs,fontWeight:800,color:accentText,margin:0,lineHeight:1.1}}>{an}</p>
            <p style={{fontSize:40,fontWeight:500,color:hexToRgba(accentText==="#fff"?"#ffffff":"#000000",0.65),margin:0,marginTop:6}}>{brokerage||"Real Estate"}</p>
            <div style={{display:"flex",gap:32,marginTop:8}}>
              {phone&&<span style={{fontSize:38,color:hexToRgba(accentText==="#fff"?"#ffffff":"#000000",0.80),fontWeight:600}}>{phone}</span>}
              {email&&<span style={{fontSize:38,color:hexToRgba(accentText==="#fff"?"#ffffff":"#000000",0.70)}}>{email}</span>}
            </div>
          </div>
          {logo&&<img src={logo} alt="" style={{maxWidth:280,maxHeight:BRAND_H-60,objectFit:"contain",flexShrink:0}}/>}
        </div>
      </>}
      <div style={{position:"absolute",top:photoTop,left:M,right:M,height:totalPhotoBlockH}}>
        <div style={{display:"flex",width:"100%",height:PHOTO_H,gap:20}}>
          <div style={{width:`58%`,height:PHOTO_H,overflow:"hidden",flexShrink:0,borderRadius:4}}>{p1?<img src={p1} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageIcon style={{width:80,height:80,color:"rgba(255,255,255,0.1)"}}/></div>}</div>
          <div style={{flex:1,display:"flex",flexDirection:"column" as const,gap:20}}>
            <div style={{flex:1,overflow:"hidden",borderRadius:4}}>{p2?<img src={p2} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#263045"}}/>}</div>
            <div style={{flex:1,overflow:"hidden",borderRadius:4}}>{p3?<img src={p3} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1e293b"}}/>}</div>
          </div>
        </div>
        {showBottomRow&&(<div style={{display:"flex",gap:20,height:bottomPhotoH,marginTop:20}}>{Array.from({length:4},(_,i)=>{const photo=bottomRow[i]||null;return(<div key={i} style={{flex:1,overflow:"hidden",borderRadius:4}}>{photo?<img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1e293b"}}/>}</div>);})}</div>)}
      </div>
      <div style={{position:"absolute",top:detailsTop,left:M,right:M,backgroundColor:"#fff",padding:`40px 60px 28px`,borderBottom:`3px solid ${hexToRgba(accent,0.12)}`}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:40}}>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:addrFs,fontWeight:800,color:"#111",margin:0,lineHeight:1.1}}>{ad}</p>
            <p style={{fontSize:46,fontWeight:500,color:"#555",margin:0,marginTop:8}}>{cs}</p>
            <p style={{fontSize:42,fontWeight:600,color:"#444",margin:0,marginTop:10,letterSpacing:"0.04em"}}>{det}</p>
          </div>
          <p style={{fontSize:priceFs,fontWeight:900,color:accent,margin:0,lineHeight:1.0,flexShrink:0}}>{pr}</p>
        </div>
        {am.length>0&&<div style={{display:"flex",flexWrap:"wrap" as const,gap:12,marginTop:20}}>{am.map((a:string,i:number)=>(<div key={i} style={{padding:"8px 22px",borderRadius:40,border:`2px solid ${hexToRgba(accent,0.25)}`,backgroundColor:hexToRgba(accent,0.05)}}><span style={{fontSize:36,fontWeight:600,color:accent}}>{a}</span></div>))}</div>}
        {desc&&<p style={{fontSize:38,color:"#555",lineHeight:1.65,margin:0,marginTop:22}}>{desc}</p>}
      </div>
      {hasUrls&&(<div style={{position:"absolute",bottom:M+ACCENT_BAR,left:M,right:M,padding:`24px 60px`,borderTop:`3px solid ${hexToRgba(accent,0.10)}`,backgroundColor:hexToRgba(accent,0.03),display:"flex",flexDirection:"column" as const,gap:8}}>{urlRows.map((row,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:18}}><span style={{fontSize:40}}>{row.icon}</span><span style={{fontSize:36,fontWeight:700,color:"#444"}}>{row.label}</span><span style={{fontSize:36,fontWeight:500,color:accent,wordBreak:"break-all" as const}}>{row.url}</span></div>))}</div>)}
      {!hasUrls&&!unbranded&&(<div style={{position:"absolute",bottom:M+(unbranded?0:ACCENT_BAR),left:M,right:M,padding:`20px 60px`,borderTop:`3px solid ${hexToRgba(accent,0.10)}`,backgroundColor:hexToRgba(accent,0.03),display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:36,fontWeight:700,color:"#333"}}>{an}</span>{phone&&<span style={{fontSize:36,color:"#555"}}>{phone}</span>}{email&&<span style={{fontSize:36,color:"#555"}}>{email}</span>}{brokerage&&<span style={{fontSize:36,color:"#888"}}>{brokerage}</span>}</div>)}
      {!unbranded&&<div style={{position:"absolute",bottom:M,left:M,right:M,height:ACCENT_BAR,backgroundColor:accent,borderRadius:"0 0 4px 4px"}}/>}
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const REMIX_SIZES=[{id:"landscape",label:"Landscape",sublabel:"1920\u00d71080",width:1920,height:1080},{id:"story",label:"Story/Reel",sublabel:"1080\u00d71920",width:1080,height:1920},{id:"square",label:"Square",sublabel:"1080\u00d71080",width:1080,height:1080}];
interface RemixClip{id:string;sourceUrl:string;thumbnail:string|null;label:string;duration:number;trimStart:number;trimEnd:number;speed:number;order:number;}
const SPEED_PRESETS=[0.5,0.75,1,1.25,1.5,2];

function LensGate({children,locked,label}:{children:ReactNode;locked:boolean;label?:string}){
  if(!locked)return<>{children}</>;
  return<div style={{position:"relative",opacity:0.45,pointerEvents:"none",userSelect:"none"}}>{children}<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}><div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:"linear-gradient(135deg,rgba(99,102,241,0.9),rgba(168,85,247,0.9))",boxShadow:"0 4px 16px rgba(99,102,241,0.35)"}}><Lock size={11} color="#fff"/><span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>{label||"Subscribe to Lens"}</span></div></div></div>;
}

const TEMPLATES=[{id:"just-listed",label:"Just Listed",icon:Home,color:"#2563eb"},{id:"magazine-cover",label:"Listed (Magazine)",icon:Home,color:"#2563eb"},{id:"stamp-listed",label:"Listed (Stamp)",icon:Home,color:"#2563eb"},{id:"cinematic-listed",label:"Listed (Cinema)",icon:Home,color:"#2563eb"},{id:"for-rent",label:"For Rent",icon:Home,color:"#16a34a"},{id:"magazine-rent",label:"Rent (Magazine)",icon:Home,color:"#16a34a"},{id:"stamp-rent",label:"Rent (Stamp)",icon:Home,color:"#16a34a"},{id:"cinematic-rent",label:"Rent (Cinema)",icon:Home,color:"#16a34a"},{id:"frame-rent",label:"Rent (Frame)",icon:Home,color:"#16a34a"},{id:"price-reduced",label:"Price Reduced",icon:DollarSign,color:"#dc2626"},{id:"stamp-reduced",label:"Reduced (Stamp)",icon:DollarSign,color:"#dc2626"},{id:"cinematic-reduced",label:"Reduced (Cinema)",icon:DollarSign,color:"#dc2626"},{id:"bold-frame",label:"Reduced (Frame)",icon:DollarSign,color:"#dc2626"},{id:"just-sold",label:"Just Sold",icon:CheckCircle,color:"#d97706"},{id:"open-house",label:"Open House",icon:Calendar,color:"#7c3aed"}];
const SIZES=[{id:"square",label:"Square",sublabel:"1080\u00d71080",width:1080,height:1080},{id:"story",label:"Story",sublabel:"1080\u00d71920",width:1080,height:1920},{id:"postcard",label:"Postcard",sublabel:"1800\u00d71200",width:1800,height:1200}];
const YARD_SIGN_SIZES=[{id:"18x24",label:"18\u00d724\"",sublabel:"Standard",width:5400,height:7200},{id:"24x36",label:"24\u00d736\"",sublabel:"Large",width:7200,height:10800}];
const BRAND_ORIENTATIONS=[{id:"landscape",label:"Landscape",sublabel:"1920\u00d71080",width:1920,height:1080},{id:"vertical",label:"Vertical",sublabel:"1080\u00d71920",width:1080,height:1920}];
const TABS=[{id:"templates",label:"Social Content",icon:PenTool},{id:"listing-flyer",label:"Listing Flyer",icon:Printer},{id:"branding-card",label:"Branding",icon:CreditCard},{id:"yard-sign",label:"Yard Sign",icon:MapPin},{id:"property-pdf",label:"Property Sheet",icon:FileText}];
const LEFT_PANELS:Record<string,{id:string;label:string;icon:any}[]>={"video-remix":[{id:"clips",label:"Clips",icon:Film},{id:"timeline",label:"Timeline",icon:LayoutTemplate},{id:"music",label:"Music",icon:Music},{id:"styles",label:"Styles",icon:Palette}],templates:[{id:"templates",label:"Templates",icon:LayoutTemplate},{id:"uploads",label:"Media",icon:Upload},{id:"music",label:"Music",icon:Music},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],"listing-flyer":[{id:"uploads",label:"Photos",icon:ImageIcon},{id:"text",label:"Details",icon:Type},{id:"urls",label:"URLs",icon:Globe},{id:"styles",label:"Styles",icon:Palette}],"yard-sign":[{id:"design",label:"Design",icon:LayoutTemplate},{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Colors",icon:Palette}],"branding-card":[{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],"property-pdf":[{id:"text",label:"Details",icon:Type},{id:"photos",label:"Photos",icon:ImageIcon},{id:"styles",label:"Styles",icon:Palette}]};
const BROKERAGE_COLORS=[{hex:"#b40101",label:"KW Red"},{hex:"#666666",label:"KW Gray"},{hex:"#003399",label:"CB Blue"},{hex:"#012169",label:"CB Navy"},{hex:"#003da5",label:"RM Blue"},{hex:"#dc1c2e",label:"RM Red"},{hex:"#b5985a",label:"C21 Gold"},{hex:"#1c1c1c",label:"C21 Black"},{hex:"#000000",label:"CMP Black"},{hex:"#333333",label:"CMP Dark"},{hex:"#002349",label:"SIR Blue"},{hex:"#1a1a1a",label:"SIR Black"},{hex:"#552448",label:"BH Purple"},{hex:"#2d1a33",label:"BH Dark"},{hex:"#1c3f6e",label:"EXP Blue"},{hex:"#006341",label:"HH Green"},{hex:"#003d28",label:"HH Dk Green"},{hex:"#4c8c2b",label:"BHG Green"},{hex:"#d4272e",label:"EXT Red"},{hex:"#e31937",label:"ERA Red"},{hex:"#273691",label:"ERA Blue"},{hex:"#a02021",label:"RF Red"},{hex:"#ffffff",label:"White"}];
const ACCENT_COLORS=["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#71717a","#ffffff","#000000"];
const FONT_OPTIONS=[{id:"serif",label:"Classic Serif",family:"Georgia, 'Times New Roman', serif",sample:"Elegant Home"},{id:"sans",label:"Clean Sans",family:"'Helvetica Neue', Arial, sans-serif",sample:"Modern Living"},{id:"modern",label:"Modern",family:"'Trebuchet MS', 'Gill Sans', sans-serif",sample:"Fresh Start"},{id:"elegant",label:"Elegant",family:"'Palatino Linotype', 'Book Antiqua', Palatino, serif",sample:"Luxury Estate"}];
const YARD_DESIGNS=[{id:"split-bar",label:"Split Bar",desc:"Top & bottom bars"},{id:"sidebar",label:"Sidebar",desc:"Vertical side accent"},{id:"top-heavy",label:"Top Heavy",desc:"Large header block"}];
const DEMO_PHOTOS=["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"];
const AMENITY_SUGGESTIONS=["Pool","Garage","A/C","Solar","Smart Home","Ocean View","Mountain View","Fireplace","Hot Tub","EV Charger","Guest Suite","Home Office","Chef's Kitchen","Walk-in Closet","Hardwood Floors","Updated Kitchen","New Roof","Cul-de-Sac","Corner Lot","No HOA"];

// ─── Shared UI Components ─────────────────────────────────────────────────────
function UploadZone({label,imageUrl,onUpload,onClear,uploading,compact}:{label:string;imageUrl:string|null;onUpload:(f:File)=>void;onClear:()=>void;uploading:boolean;compact?:boolean}){
  const ref=useRef<HTMLInputElement>(null);const[drag,setDrag]=useState(false);
  if(imageUrl)return(<div className="group" style={{position:"relative",borderRadius:12,overflow:"hidden",aspectRatio:compact?"1":"4/3"}}><img src={imageUrl} alt={label} style={{width:"100%",height:"100%",objectFit:"cover"}}/><div className="ghov" style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",opacity:0,transition:"opacity 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={onClear} style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#333"/></button></div><div style={{position:"absolute",bottom:0,left:0,right:0,padding:"5px 8px",background:"linear-gradient(transparent,rgba(0,0,0,0.6))",fontSize:10,color:"#fff",fontWeight:600}}>{label}</div></div>);
  return(<div onClick={()=>ref.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files?.[0];if(f)onUpload(f);}} style={{aspectRatio:compact?"1":"4/3",borderRadius:12,border:`2px dashed ${drag?"var(--sa)":"rgba(255,255,255,0.10)"}`,background:drag?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.02)",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",transition:"all 0.2s"}}>{uploading?<Loader2 size={18} color="rgba(255,255,255,0.3)" className="animate-spin"/>:<><Upload size={16} color="rgba(255,255,255,0.25)"/><span style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:600}}>{label}</span></>}<input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)onUpload(f);e.target.value="";}} /></div>);
}
function Section({title,icon:Icon,defaultOpen=true,children}:{title:string;icon?:any;defaultOpen?:boolean;children:ReactNode}){
  const[open,setOpen]=useState(defaultOpen);
  return(<div style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}><button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"13px 20px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.85)",fontSize:12,fontWeight:700,fontFamily:"var(--sf)"}}>{Icon&&<Icon size={14} color="rgba(255,255,255,0.35)"/>}<span style={{flex:1,textAlign:"left"}}>{title}</span><ChevronDown size={13} color="rgba(255,255,255,0.25)" style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}/></button>{open&&<div style={{padding:"0 20px 16px"}}>{children}</div>}</div>);
}
function ColorPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
  return(<div style={{display:"flex",alignItems:"center",gap:10}}><input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{width:34,height:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:0,background:"none"}}/><input className="fi" value={value} onChange={e=>onChange(e.target.value)} style={{width:90,fontFamily:"monospace",fontSize:12}}/></div>);
}
function SwatchGrid({colors,current,onSelect,showLabels}:{colors:any[];current:string;onSelect:(h:string)=>void;showLabels?:boolean}){
  return(<div style={{display:"flex",flexWrap:"wrap" as const,gap:showLabels?4:6}}>{colors.map(c=>{const hex=typeof c==="string"?c:c.hex,label=typeof c==="string"?null:c.label;
    if(showLabels)return<button key={hex+(label||"")} onClick={()=>onSelect(hex)} title={label||hex} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:6,border:current===hex?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.08)",background:current===hex?"rgba(99,102,241,0.12)":"none",cursor:"pointer",transition:"all 0.15s",fontFamily:"var(--sf)"}}><span style={{width:14,height:14,borderRadius:3,flexShrink:0,border:"1px solid rgba(0,0,0,0.15)",backgroundColor:hex}}/><span style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.5)",whiteSpace:"nowrap"}}>{label}</span></button>;
    return<div key={hex} onClick={()=>onSelect(hex)} title={label||hex} style={{width:26,height:26,borderRadius:6,backgroundColor:hex,border:current===hex?"2px solid #fff":"1px solid rgba(255,255,255,0.08)",boxShadow:current===hex?"0 0 0 2px var(--sa)":"none",cursor:"pointer",transition:"all 0.15s"}}/>;
  })}</div>);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DesignStudioV2(){
  const[activeTab,setActiveTab]=useState("templates");
  const[leftPanel,setLeftPanel]=useState("templates");
  const[selectedTemplate,setSelectedTemplate]=useState("just-listed");
  const[selectedSize,setSelectedSize]=useState("square");
  const[zoom,setZoom]=useState(100);
  const[selectedPropertyId,setSelectedPropertyId]=useState<string|null>(null);
  const[userProperties,setUserProperties]=useState<any[]>([]);
  const[listingPhoto,setListingPhoto]=useState<string|null>(null);
  const[headshot,setHeadshot]=useState<string|null>(null);
  const[logo,setLogo]=useState<string|null>(null);
  const[address,setAddress]=useState("");const[addressLine2,setAddressLine2]=useState("");
  const[beds,setBeds]=useState("");const[baths,setBaths]=useState("");const[sqft,setSqft]=useState("");const[price,setPrice]=useState("");
  const[date,setDate]=useState("");const[time,setTime]=useState("");
  const[agentName,setAgentName]=useState("");const[phone,setPhone]=useState("");
  const[agentEmail,setAgentEmail]=useState("");const[brokerage,setBrokerage]=useState("");
  const[barColor,setBarColor]=useState("#111827");const[accentColor,setAccentColor]=useState("");const[fontId,setFontId]=useState("sans");const[brandShadow,setBrandShadow]=useState(true);
  const[savedCompanyColors,setSavedCompanyColors]=useState<string[]>([]);
  const[mediaMode,setMediaMode]=useState<"image"|"video">("image");
  const[selectedVideo,setSelectedVideo]=useState<any>(null);
  const[overlayMusic,setOverlayMusic]=useState("");const[musicExpanded,setMusicExpanded]=useState(false);
  const[musicTracks,setMusicTracks]=useState<any[]>([]);const[loadingMusic,setLoadingMusic]=useState(false);
  const[vibeFilter,setVibeFilter]=useState("");const[playingTrackId,setPlayingTrackId]=useState<string|null>(null);
  const[selectedMusicTrack,setSelectedMusicTrack]=useState<{id:string;url:string;name:string}|null>(null);
  const[musicVibeFilter,setMusicVibeFilter]=useState("");
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const[userVideos,setUserVideos]=useState<any[]>([]);const[loadingVideos,setLoadingVideos]=useState(false);
  const[yardDesign,setYardDesign]=useState("split-bar");const[yardSignSize,setYardSignSize]=useState("18x24");
  const[yardHeaderText,setYardHeaderText]=useState("FOR SALE");
  const[yardTopColor,setYardTopColor]=useState("#dc1c2e");const[yardBottomColor,setYardBottomColor]=useState("#003da5");
  const[yardSidebarColor,setYardSidebarColor]=useState("#1c1c1c");const[yardMainBgColor,setYardMainBgColor]=useState("#ffffff");
  const[yardWebsite,setYardWebsite]=useState("");const[yardOfficeName,setYardOfficeName]=useState("");const[yardOfficePhone,setYardOfficePhone]=useState("");
  const[yardBullet1,setYardBullet1]=useState("");const[yardBullet2,setYardBullet2]=useState("");const[yardBullet3,setYardBullet3]=useState("");
  const[pdfAddress,setPdfAddress]=useState("");const[pdfCityStateZip,setPdfCityStateZip]=useState("");
  const[pdfPrice,setPdfPrice]=useState("");const[pdfBeds,setPdfBeds]=useState("");const[pdfBaths,setPdfBaths]=useState("");const[pdfSqft,setPdfSqft]=useState("");
  const[pdfDescription,setPdfDescription]=useState("");const[pdfFeatures,setPdfFeatures]=useState("");
  const[pdfPhotos,setPdfPhotos]=useState<string[]>([]);const[pdfPreviewPage,setPdfPreviewPage]=useState(0);const[pdfAccentColor,setPdfAccentColor]=useState("#0e7490");
  const[brandHeadshot,setBrandHeadshot]=useState<string|null>(null);const[brandLogo,setBrandLogo]=useState<string|null>(null);
  const[brandBgPhoto,setBrandBgPhoto]=useState<string|null>(null);
  const[brandAgentName,setBrandAgentName]=useState("");const[brandPhone,setBrandPhone]=useState("");
  const[brandEmail,setBrandEmail]=useState("");const[brandBrokerage,setBrandBrokerage]=useState("");
  const[brandTagline,setBrandTagline]=useState("");const[brandWebsite,setBrandWebsite]=useState("");
  const[brandAddress,setBrandAddress]=useState("");const[brandCityState,setBrandCityState]=useState("");
  const[brandPrice,setBrandPrice]=useState("");const[brandFeatures,setBrandFeatures]=useState("");
  const[brandBgColor,setBrandBgColor]=useState("#14532d");const[brandAccentColor,setBrandAccentColor]=useState("");
  const[brandOrientation,setBrandOrientation]=useState("landscape");const[brandFont,setBrandFont]=useState("serif");
  const[flyerPhotos,setFlyerPhotos]=useState<string[]>([]);
  const[flyerAddress,setFlyerAddress]=useState("");const[flyerCityState,setFlyerCityState]=useState("");
  const[flyerPrice,setFlyerPrice]=useState("");const[flyerBeds,setFlyerBeds]=useState("");
  const[flyerBaths,setFlyerBaths]=useState("");const[flyerSqft,setFlyerSqft]=useState("");
  const[flyerDescription,setFlyerDescription]=useState("");
  const[flyerAmenities,setFlyerAmenities]=useState<string[]>([]);
  const[flyerListingUrl,setFlyerListingUrl]=useState("");
  const[flyerVideoUrl,setFlyerVideoUrl]=useState("");
  const[flyerStagingUrl,setFlyerStagingUrl]=useState("");
  const[flyerAccentColor,setFlyerAccentColor]=useState("#1e3a5f");
  const[flyerFont,setFlyerFont]=useState("sans");
  const[flyerUnbranded,setFlyerUnbranded]=useState(false);
  const[remixClips,setRemixClips]=useState<RemixClip[]>([]);
  const[remixSize,setRemixSize]=useState("landscape");
  const[remixBranding,setRemixBranding]=useState(true);
  const[expandedClipId,setExpandedClipId]=useState<string|null>(null);
  const[remixClipSources,setRemixClipSources]=useState<{orderId:string;address:string;date:string;clips:{url:string;thumbnail:string|null;label:string}[]}[]>([]);
  const[loadingRemixClips,setLoadingRemixClips]=useState(false);
  const[isLensSubscriber,setIsLensSubscriber]=useState(false);
  const[showGate,setShowGate]=useState(false);
  const[gateType,setGateType]=useState<"buy_video"|"subscribe"|"upgrade_pro">("buy_video");
  const[hasVideoOrders,setHasVideoOrders]=useState<boolean|null>(null);
  const[remixPlaying,setRemixPlaying]=useState(false);
  const[remixPlayingIdx,setRemixPlayingIdx]=useState(0);
  const[remixPlaybackTime,setRemixPlaybackTime]=useState(0);
  const remixVideosRef=useRef<Map<string,HTMLVideoElement>>(new Map());
  const remixTimerRef=useRef<number|null>(null);
  const remixTimeRef=useRef(0);
  const remixIdxRef=useRef(0);
  const remixDragging=useRef(false);
  const[exporting,setExporting]=useState(false);const[exportProgress,setExportProgress]=useState(0);const[exportStatus,setExportStatus]=useState("");const[showRight,setShowRight]=useState(true);const[notification,setNotification]=useState<string|null>(null);
  const[theme,setTheme]=useState<"dark"|"light">("dark");
  const[mobilePanel,setMobilePanel]=useState<string|null>(null);
  const[isMobile,setIsMobile]=useState(false);
  const router=useRouter();
  const searchParams=useSearchParams();
  useEffect(()=>{const check=()=>setIsMobile(window.innerWidth<850);check();window.addEventListener("resize",check);return()=>window.removeEventListener("resize",check);},[]);
  useEffect(()=>{if(mobilePanel){document.body.style.overflow="hidden";}else{document.body.style.overflow="";}return()=>{document.body.style.overflow="";};},[mobilePanel]);
  const previewRef=useRef<HTMLDivElement>(null);

  const currentSize=SIZES.find(s=>s.id===selectedSize)!;
  const currentYardSize=YARD_SIGN_SIZES.find(s=>s.id===yardSignSize)!;
  const currentBrandOr=BRAND_ORIENTATIONS.find(o=>o.id===brandOrientation)!;
  const currentRemixSize=REMIX_SIZES.find(s=>s.id===remixSize)!;
  const fontFamily=FONT_OPTIONS.find(f=>f.id===fontId)?.family||FONT_OPTIONS[1].family;
  const brandFontFamily=FONT_OPTIONS.find(f=>f.id===brandFont)?.family||FONT_OPTIONS[0].family;
  const flyerFontFamily=FONT_OPTIONS.find(f=>f.id===flyerFont)?.family||FONT_OPTIONS[1].family;
  const badge=getBadgeConfig(selectedTemplate);
  const currentPanels=LEFT_PANELS[activeTab]||LEFT_PANELS.templates;
  const isVideoMode=activeTab==="templates"&&mediaMode==="video"&&!!selectedVideo;
  const isRemixMode=activeTab==="video-remix";

  useEffect(()=>{setLeftPanel(currentPanels[0].id);},[activeTab]);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const params=new URLSearchParams(window.location.search);
    const tpl=params.get("template");const pid=params.get("propertyId");
    if(tpl==="listing_flyer")setActiveTab("listing-flyer");
    if(tpl==="social")setActiveTab("templates");
    if(pid)setSelectedPropertyId(pid);
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const supabase=(await import("@/lib/supabase/client")).createClient();
        const{data:{session}}=await supabase.auth.getSession();if(!session?.user)return;
        const user=session.user;
        const ADMIN_EMAILS=["realestatephoto2video@gmail.com"];
        if(user.email&&ADMIN_EMAILS.includes(user.email)){setIsLensSubscriber(true);}
        else{
          const[usageRes,orderRes]=await Promise.all([
            supabase.from("lens_usage").select("is_subscriber,subscription_tier,trial_expires_at").eq("user_id",user.id).single(),
            supabase.from("orders").select("*",{count:"exact",head:true}).eq("user_id",user.id).eq("payment_status","paid"),
          ]);
          const usage=usageRes.data;const hasPaid=(orderRes.count||0)>0;
          const isSub=usage?.is_subscriber;const hasActiveTrial=usage?.trial_expires_at&&new Date(usage.trial_expires_at)>new Date();
          if(isSub||hasActiveTrial){setIsLensSubscriber(true);}
          else{setGateType(hasPaid?"subscribe":"buy_video");}
        }
        const{data}=await supabase.from("lens_usage").select("saved_headshot_url,saved_logo_url,saved_agent_name,saved_phone,saved_email,saved_company,saved_website,saved_company_colors").eq("user_id",user.id).single();
        if(data){
          if(data.saved_headshot_url){setHeadshot(data.saved_headshot_url);setBrandHeadshot(data.saved_headshot_url);}
          if(data.saved_logo_url){setLogo(data.saved_logo_url);setBrandLogo(data.saved_logo_url);}
          if(data.saved_agent_name){setAgentName(data.saved_agent_name);setBrandAgentName(data.saved_agent_name);}
          if(data.saved_phone){setPhone(data.saved_phone);setBrandPhone(data.saved_phone);}
          if(data.saved_email){setAgentEmail(data.saved_email);setBrandEmail(data.saved_email);}
          if(data.saved_company){setBrokerage(data.saved_company);setBrandBrokerage(data.saved_company);}
          if(data.saved_website){setBrandWebsite(data.saved_website);}
          const cc=Array.isArray(data.saved_company_colors)?data.saved_company_colors:[];
          setSavedCompanyColors(cc);
          if(cc.length>=1){setBarColor(cc[0]);setFlyerAccentColor(cc[0]);setBrandBgColor(cc[0]);setYardTopColor(cc[0]);setYardSidebarColor(cc[0]);setPdfAccentColor(cc[0]);}
          if(cc.length>=2){setAccentColor(cc[1]);setBrandAccentColor(cc[1]);setYardBottomColor(cc[1]);}
        }
        const{data:props}=await supabase.from("agent_properties").select("id,address,address_normalized,city,state,bedrooms,bathrooms,sqft,price,special_features,amenities,website_slug,website_published,website_curated").eq("user_id",user.id).is("merged_into_id",null).order("updated_at",{ascending:false});
        if(props)setUserProperties(props);
      }catch(err){console.error("Profile load error:",err);}
    })();
  },[]);

  const notify=(msg:string)=>{setNotification(msg);setTimeout(()=>setNotification(null),3000);};

  // ─── Gate helper — blocks any value-creating action for non-subscribers ───
  const gatedAction=(fn:()=>void)=>{
    if(!isLensSubscriber){setShowGate(true);return;}
    fn();
  };

  // ─── Video & Music helpers ──────────────────────────────────────────────────
  const loadUserVideos=async()=>{
    if(userVideos.length>0)return;setLoadingVideos(true);
    try{
      const supabase=(await import("@/lib/supabase/client")).createClient();
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:orders}=await supabase.from("orders").select("order_id,delivery_url,unbranded_delivery_url,photos,created_at,property_address").eq("user_id",user.id).in("status",["complete","delivered","closed"]).order("created_at",{ascending:false});
      const vids=(orders||[]).filter((o:any)=>o.unbranded_delivery_url||o.delivery_url);
      setUserVideos(vids.map((o:any)=>({orderId:o.order_id,url:o.unbranded_delivery_url||o.delivery_url,thumbnail:o.photos?.[0]?.secure_url||null,address:o.property_address||"Property",date:new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})})));
    }catch(err){console.error("Video load error:",err);}
    setLoadingVideos(false);
  };

  const VIBES=[{key:"",label:"All"},{key:"upbeat_modern",label:"Upbeat"},{key:"chill_tropical",label:"Chill"},{key:"energetic_pop",label:"Energetic"},{key:"elegant_classical",label:"Elegant"},{key:"warm_acoustic",label:"Acoustic"},{key:"bold_cinematic",label:"Cinematic"},{key:"smooth_jazz",label:"Jazz"},{key:"ambient",label:"Ambient"}];
  const fetchMusicTracks=async(vibe:string="")=>{setLoadingMusic(true);try{const resp=await fetch(`/api/generate-music?library=true&vibe=${vibe}`);const data=await resp.json();setMusicTracks(data.tracks||[]);}catch(e){console.error(e);}setLoadingMusic(false);};
  const handlePlayTrack=(trackId:string,url:string)=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}if(playingTrackId===trackId){setPlayingTrackId(null);return;}const audio=new Audio(url);audio.play().catch(()=>{});audio.onended=()=>setPlayingTrackId(null);audioRef.current=audio;setPlayingTrackId(trackId);};
  useEffect(()=>{return()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}};},[]);
  const getMusicSource=():({type:"url";url:string}|null)=>{if(selectedMusicTrack)return{type:"url",url:selectedMusicTrack.url};return null;};

  const exportVideo=async()=>{
    if(!selectedVideo?.url||!previewRef.current){notify("Select a video first.");return;}
    setExporting(true);setExportProgress(0);setExportStatus("Loading encoder...");
    try{
      const{FFmpeg}=await import("@ffmpeg/ffmpeg");
      const{toBlobURL,fetchFile}=await import("@ffmpeg/util");
      const ffmpeg=new FFmpeg();
      ffmpeg.on("progress",({progress:p})=>setExportProgress(Math.min(Math.round(p*100),99)));
      setExportProgress(2);setExportStatus("Downloading FFmpeg...");
      const coreBase="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({coreURL:await toBlobURL(`${coreBase}/ffmpeg-core.js`,"text/javascript"),wasmURL:await toBlobURL(`${coreBase}/ffmpeg-core.wasm`,"application/wasm")});
      setExportProgress(5);setExportStatus("Loading video...");
      await ffmpeg.writeFile("input.mp4",await fetchFile(selectedVideo.url));
      const musicSource=getMusicSource();
      let hasMusic=false;
      if(musicSource){setExportProgress(8);setExportStatus("Loading music...");await ffmpeg.writeFile("music.mp3",await fetchFile(musicSource.url));hasMusic=true;}
      setExportProgress(10);setExportStatus("Capturing overlay...");
      const html2canvas=(await import("html2canvas-pro")).default;
      const el=previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if(!el)throw new Error("Export target not found");
      const videoEls=el.querySelectorAll("video");videoEls.forEach(v=>{(v as HTMLElement).style.opacity="0";});
      const placeholders=el.querySelectorAll("[data-video-area]");placeholders.forEach(p=>{(p as HTMLElement).style.opacity="0";});
      const{restore}=prepareForExport(el);
      const overlayCanvas=await html2canvas(el,{scale:1,useCORS:true,allowTaint:true,backgroundColor:null,width:rawW,height:rawH});
      restore();
      videoEls.forEach(v=>{(v as HTMLElement).style.opacity="1";});
      placeholders.forEach(p=>{(p as HTMLElement).style.opacity="1";});
      const overlayBlob=await new Promise<Blob>(r=>overlayCanvas.toBlob(b=>r(b!),"image/png"));
      await ffmpeg.writeFile("overlay.png",new Uint8Array(await overlayBlob.arrayBuffer()));
      setExportProgress(15);setExportStatus("Encoding video...");
      const outW=currentSize.width,outH=currentSize.height;
      const photoPercent=selectedTemplate==="open-house"?100:selectedSize==="postcard"?55:58;
      const photoH=Math.round(outH*photoPercent/100);
      if(hasMusic){
        await ffmpeg.exec(["-i","input.mp4","-i","overlay.png","-i","music.mp3","-t","119","-filter_complex",`[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0[vout];[0:a]volume=0.3[orig];[2:a]volume=0.85,atrim=0:119,apad[mus];[orig][mus]amix=inputs=2:duration=shortest[aout]`,"-map","[vout]","-map","[aout]","-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart","-y","output.mp4"]);
      }else{
        await ffmpeg.exec(["-i","input.mp4","-i","overlay.png","-t","119","-filter_complex",`[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0`,"-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart","-y","output.mp4"]);
      }
      setExportProgress(95);setExportStatus("Downloading...");
      const outputData=await ffmpeg.readFile("output.mp4");
      const outputBlob=new Blob([outputData],{type:"video/mp4"});
      const link=document.createElement("a");link.download=`listing-video-${Date.now()}.mp4`;link.href=URL.createObjectURL(outputBlob);link.click();
      URL.revokeObjectURL(link.href);
      setExportProgress(100);notify("Video exported!");
      setTimeout(()=>{setExportProgress(0);setExporting(false);setExportStatus("");},1500);return;
    }catch(err:any){console.error("Video export error:",err);notify("Export failed: "+(err.message||"Unknown error"));}
    setExportProgress(0);setExporting(false);setExportStatus("");
  };

  // ─── Export Helpers ──────────────────────────────────────────────────────────
  const getPreviewDims=useCallback(()=>{
    let w:number,h:number;
    if(activeTab==="video-remix"){w=currentRemixSize.width;h=currentRemixSize.height;}
    else if(activeTab==="yard-sign"){w=currentYardSize.width;h=currentYardSize.height;}
    else if(activeTab==="property-pdf"){w=2550;h=3300;}
    else if(activeTab==="branding-card"){w=currentBrandOr.width;h=currentBrandOr.height;}
    else if(activeTab==="listing-flyer"){w=2550;h=3300;}
    else{w=currentSize.width;h=currentSize.height;}
    const maxW=isMobile?Math.min(window.innerWidth-32,560):580,maxH=isMobile?400:560;const s=Math.min(maxW/w,maxH/h,1)*(zoom/100);
    return{scale:s,pW:w*s,pH:h*s,rawW:w,rawH:h};
  },[activeTab,currentSize,currentYardSize,currentBrandOr,currentRemixSize,zoom]);
  const{scale,pW,pH,rawW,rawH}=getPreviewDims();

  const prepareForExport=(el:HTMLElement):{restore:()=>void}=>{
    const parent=el.parentElement as HTMLElement;
    const st=el.style.transform,so=parent?.style.overflow,sw=parent?.style.width,sh=parent?.style.height;
    el.style.transform="none";
    if(parent){parent.style.overflow="visible";parent.style.width=`${rawW}px`;parent.style.height=`${rawH}px`;}
    return{restore:()=>{el.style.transform=st;if(parent){parent.style.overflow=so||"";parent.style.width=sw||"";parent.style.height=sh||"";}}};
  };

  const exportImage=async()=>{
    if(!previewRef.current)return;
    const html2canvas=(await import("html2canvas-pro")).default;
    const el=previewRef.current.querySelector("[data-export-target]") as HTMLElement;
    if(!el)return;
    const{restore}=prepareForExport(el);
    const canvas=await html2canvas(el,{scale:1,useCORS:true,allowTaint:true,backgroundColor:null,width:rawW,height:rawH});
    restore();
    const link=document.createElement("a");link.download=`listing-${selectedTemplate}-${Date.now()}.png`;link.href=canvas.toDataURL("image/png");link.click();
    notify("Image exported!");
  };

  const exportPdf=async()=>{
    if(!previewRef.current)return;
    const html2canvas=(await import("html2canvas-pro")).default;
    const{jsPDF}=await import("jspdf");
    const pdf=new jsPDF({orientation:"portrait",unit:"in",format:"letter"});
    const el=previewRef.current.querySelector("[data-export-target]") as HTMLElement;
    if(!el)return;
    const{restore}=prepareForExport(el);
    const canvas=await html2canvas(el,{scale:1,useCORS:true,allowTaint:true,backgroundColor:"#ffffff",width:rawW,height:rawH});
    restore();
    pdf.addImage(canvas.toDataURL("image/jpeg",0.95),"JPEG",0,0,8.5,11);
    pdf.save(`listing-flyer-${Date.now()}.pdf`);
    notify("PDF exported!");
  };

  const handleExport=async()=>{
    if(!isLensSubscriber){setShowGate(true);return;}
    if(isVideoMode&&/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){
      const ok=window.confirm("Video encoding works best on desktop. Mobile may run out of memory.\n\nProceed?");
      if(!ok)return;
    }
    setExporting(true);setExportStatus("");
    try{
      if(isVideoMode){await exportVideo();}
      else{await exportImage();}
    }catch(err:any){console.error("Export error:",err);notify(err?.message||"Export failed.");}
    setExporting(false);setExportProgress(0);setExportStatus("");
  };

  const handleExportPdf=async()=>{
    if(!isLensSubscriber){setShowGate(true);return;}
    setExporting(true);
    try{await exportPdf();}catch(err:any){console.error("PDF export error:",err);notify(err?.message||"PDF export failed.");}
    setExporting(false);
  };

  const handleSelectProperty=(id:string)=>{
    if(id==="__new__"){
      setSelectedPropertyId(null);setAddress("");setAddressLine2("");setBeds("");setBaths("");setSqft("");setPrice("");
      setPdfAddress("");setPdfCityStateZip("");setPdfBeds("");setPdfBaths("");setPdfSqft("");setPdfPrice("");setPdfFeatures("");
      setBrandAddress("");setBrandCityState("");setBrandPrice("");setBrandFeatures("");
      setFlyerAddress("");setFlyerCityState("");setFlyerBeds("");setFlyerBaths("");setFlyerSqft("");setFlyerPrice("");setFlyerDescription("");setFlyerAmenities([]);setFlyerPhotos([]);setFlyerListingUrl("");
      return;
    }
    const prop=userProperties.find((p:any)=>p.id===id);if(!prop)return;
    setSelectedPropertyId(prop.id);
    const addr=prop.address||"";
    const cs=[prop.city,prop.state].filter(Boolean).join(", ");
    // Listing Graphics
    setAddress(addr);setAddressLine2(cs);
    if(prop.bedrooms){const b=prop.bedrooms.toString();setBeds(b);setFlyerBeds(b);setPdfBeds(b);}
    if(prop.bathrooms){const b=prop.bathrooms.toString();setBaths(b);setFlyerBaths(b);setPdfBaths(b);}
    if(prop.sqft){const s=prop.sqft.toString();setSqft(s);setFlyerSqft(s);setPdfSqft(s);}
    if(prop.price){const p=prop.price.toString();setPrice(p);setFlyerPrice(p);setPdfPrice(p);setBrandPrice(p);}
    // Listing Flyer
    setFlyerAddress(addr);setFlyerCityState(cs);
    if(prop.amenities?.length)setFlyerAmenities(prop.amenities);
    if(prop.website_published&&prop.website_slug)setFlyerListingUrl(`https://${prop.website_slug}.p2v.homes`);
    // Property PDF
    setPdfAddress(addr);setPdfCityStateZip(cs);
    if(prop.special_features?.length>0){const features=prop.special_features.join("\n");setPdfFeatures(features);setBrandFeatures(features);}
    // Branding
    setBrandAddress(addr);setBrandCityState(cs);
    // Load photos & description from orders
    (async()=>{
      try{
        const supabase=(await import("@/lib/supabase/client")).createClient();
        const{data:{user:u}}=await supabase.auth.getUser();if(!u)return;
        // Photos from orders
        let photos:string[]=[];
        const curated=prop.website_curated?.photos||[];
        if(curated.length)photos=curated.slice(0,7);
        if(photos.length<5){
          const{data:orders}=await supabase.from("orders").select("photos").eq("user_id",u.id).ilike("property_address",`%${(addr).substring(0,15)}%`);
          for(const o of(orders||[])){const urls=(o.photos||[]).map((p:any)=>p.secure_url||p.url).filter(Boolean);photos=[...photos,...urls];if(photos.length>=7)break;}
          photos=[...new Set(photos)].slice(0,7);
        }
        if(photos.length){setFlyerPhotos(photos);if(photos.length<=25)setPdfPhotos(photos);}
        // Description from lens_descriptions
        const propAddr=addr.toLowerCase().replace(/[^a-z0-9]/g,"");
        const{data:descs}=await supabase.from("lens_descriptions").select("description,property_data").eq("user_id",u.id).order("created_at",{ascending:false}).limit(10);
        const match=(descs||[]).find((d:any)=>{const pd=d.property_data;if(!pd)return false;const dAddr=(pd.address||pd.property_address||"").toLowerCase().replace(/[^a-z0-9]/g,"");return dAddr&&(dAddr.includes(propAddr)||propAddr.includes(dAddr));});
        if(match?.description){setFlyerDescription(match.description);setPdfDescription(match.description);}
      }catch(err){console.error("Property fill error:",err);}
    })();
  };

  const pdfFLines=pdfFeatures?pdfFeatures.split("\n").filter(Boolean).length:0;
  const pdfEstFH=pdfFLines*80+(pdfFLines>0?90:0);
  const pdfMaxDL=Math.floor((1400-pdfEstFH)/60);
  const pdfDLines=pdfDescription?pdfDescription.split("\n").filter(Boolean).length:0;
  const pdfHasOverflow=pdfDLines>pdfMaxDL&&pdfMaxDL>0;
  const pdfPage2Slots=pdfHasOverflow?4:6;
  const pdfPhotosAfterP1=Math.max(0,pdfPhotos.length-3);
  const pdfTotalPages=pdfHasOverflow?2+Math.ceil(Math.max(0,pdfPhotosAfterP1-pdfPage2Slots)/6):1+Math.ceil(pdfPhotosAfterP1/6);

  const renderPreview=()=>{
    if(activeTab==="listing-flyer")return<ListingFlyerTemplate photos={flyerPhotos} headshot={headshot} logo={logo} address={flyerAddress} cityState={flyerCityState} price={flyerPrice} beds={flyerBeds} baths={flyerBaths} sqft={flyerSqft} description={flyerDescription} amenities={flyerAmenities} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} listingUrl={flyerListingUrl} videoUrl={flyerVideoUrl} stagingUrl={flyerStagingUrl} accentColor={flyerAccentColor} fontFamily={flyerFontFamily} unbranded={flyerUnbranded}/>;
    if(activeTab==="templates"){const photo=mediaMode==="video"?(selectedVideo?.thumbnail||null):listingPhoto;const vidEl=mediaMode==="video"&&selectedVideo?.url?(<div style={{width:"100%",height:"100%",position:"relative"}} data-video-area><video src={selectedVideo.url} autoPlay loop muted playsInline crossOrigin="anonymous" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>):undefined;if(selectedTemplate==="magazine-cover"||selectedTemplate==="magazine-rent")return<MagazineCoverTemplate size={currentSize} brandShadow={brandShadow} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} logo={logo} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor} badgeText={getBadgeConfig(selectedTemplate).text}/>;if(selectedTemplate==="stamp-listed"||selectedTemplate==="stamp-reduced"||selectedTemplate==="stamp-rent"){const sBadge=getBadgeConfig(selectedTemplate);return<StampTemplate size={currentSize} brandShadow={brandShadow} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} badgeText={sBadge.text} badgeColor={sBadge.color} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} logo={logo} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;}if(selectedTemplate==="cinematic-listed"||selectedTemplate==="cinematic-reduced"||selectedTemplate==="cinematic-rent"){const cBadge=getBadgeConfig(selectedTemplate);return<CinematicTemplate size={currentSize} brandShadow={brandShadow} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} badgeText={cBadge.text} badgeColor={cBadge.color} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} logo={logo} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;}if(selectedTemplate==="bold-frame"||selectedTemplate==="frame-rent")return<BoldFrameTemplate size={currentSize} brandShadow={brandShadow} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} logo={logo} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor} badgeText={getBadgeConfig(selectedTemplate).text}/>;if(selectedTemplate==="open-house")return<OpenHouseTemplate size={currentSize} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} logo={logo} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} date={date} time={time} agentName={agentName} phone={phone} brokerage={brokerage} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;return<InfoBarTemplate size={currentSize} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} logo={logo} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} badgeText={badge.text} badgeColor={badge.color} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;}
    if(activeTab==="yard-sign"){const ys={width:currentYardSize.width,height:currentYardSize.height,headshot,logo,agentName,phone,email:agentEmail,brokerage,headerText:yardHeaderText,fontFamily,qrDataUrl:null,bulletPoints:[yardBullet1,yardBullet2,yardBullet3]};if(yardDesign==="sidebar")return<YardSignSidebar{...ys}website={yardWebsite}sidebarColor={yardSidebarColor}mainBgColor={yardMainBgColor}/>;if(yardDesign==="top-heavy")return<YardSignTopHeavy{...ys}topColor={yardTopColor}bottomColor={yardBottomColor}/>;return<YardSignSplitBar{...ys}officeName={yardOfficeName}officePhone={yardOfficePhone}topColor={yardTopColor}bottomColor={yardBottomColor}/>;}
    if(activeTab==="property-pdf")return<PropertyPdfPage pageNumber={pdfPreviewPage} address={pdfAddress} cityStateZip={pdfCityStateZip} price={pdfPrice} beds={pdfBeds} baths={pdfBaths} sqft={pdfSqft} description={pdfDescription} features={pdfFeatures} photos={pdfPhotos} accentColor={pdfAccentColor} fontFamily={fontFamily}/>;
    if(activeTab==="branding-card")return<BrandingCardTemplate orientation={currentBrandOr} logo={brandLogo} headshot={brandHeadshot} agentName={brandAgentName} phone={brandPhone} email={brandEmail} brokerage={brandBrokerage} tagline={brandTagline} website={brandWebsite} address={brandAddress} cityState={brandCityState} price={brandPrice} features={brandFeatures} bgColor={brandBgColor} accentColor={brandAccentColor} bgPhoto={brandBgPhoto} fontFamily={brandFontFamily}/>;
    return null;
  };

  const MobileSheet=({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode})=>{
    if(!open)return null;
    return(<>
      <div onClick={onClose} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",zIndex:90}}/>
      <div style={{position:"fixed",bottom:56,left:0,right:0,maxHeight:"60vh",backgroundColor:"#111116",borderTop:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px 16px 0 0",zIndex:95,overflowY:"auto",transform:open?"translateY(0)":"translateY(100%)",transition:"transform 0.3s ease"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#111116",zIndex:2}}>
          <span style={{fontSize:13,fontWeight:700,color:"#e4e4ea"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",padding:4,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:"0 0 16px"}}>{children}</div>
      </div>
    </>);
  };

  const MobileToolNav=()=>(
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:56,backgroundColor:"#111116",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {currentPanels.map(p=>(
        <button key={p.id} onClick={()=>{setLeftPanel(p.id);setMobilePanel(mobilePanel===p.id?null:p.id);}} style={{display:"flex",flexDirection:"column" as const,alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 12px",color:mobilePanel===p.id?"#06b6d4":"rgba(255,255,255,0.35)",fontSize:9,fontWeight:600,fontFamily:"inherit"}}>
          <p.icon style={{width:20,height:20}}/>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
    :root{--sb:#0c0c10;--ss:#151519;--ss2:#1c1c22;--sbr:rgba(255,255,255,0.06);--sa:#6366f1;--sag:rgba(99,102,241,0.15);--st:#e4e4ea;--std:rgba(255,255,255,0.4);--stm:rgba(255,255,255,0.2);--suc:#10b981;--sc:#09090d;--sf:'DM Sans',-apple-system,sans-serif;--si:rgba(255,255,255,0.03);--sih:rgba(255,255,255,0.05);--sdash:rgba(255,255,255,0.10);--schk:#fff;}
    *{margin:0;padding:0;box-sizing:border-box;}.sr{font-family:var(--sf);background:var(--sb);color:var(--st);height:100vh;display:flex;flex-direction:column;overflow:hidden;-webkit-font-smoothing:antialiased;}
    .st{height:54px;background:var(--ss);border-bottom:1px solid var(--sbr);display:flex;align-items:center;padding:0 14px;gap:6px;flex-shrink:0;z-index:20;}
    .slg{display:flex;align-items:center;gap:9px;padding-right:18px;border-right:1px solid var(--sbr);margin-right:6px;}
    .slm{width:30px;height:30px;background:linear-gradient(135deg,var(--sa),#a855f7);border-radius:8px;display:flex;align-items:center;justify-content:center;}
    .stb{display:flex;gap:1px;background:var(--si);border-radius:9px;padding:3px;}
    .stbi{padding:6px 14px;border-radius:7px;border:none;background:none;color:var(--std);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:var(--sf);}
    .stbi:hover{color:var(--st);background:var(--sih);}.stbi.ac{color:#fff;background:var(--sa);box-shadow:0 2px 8px rgba(99,102,241,0.3);}
    .ssp{flex:1;}.sac{display:flex;align-items:center;gap:6px;}
    .bi{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:var(--sf);}.bi:hover{background:var(--sih);color:var(--st);}
    .bx{padding:7px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,var(--sa),#7c3aed);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;box-shadow:0 2px 12px rgba(99,102,241,0.3);font-family:var(--sf);}.bx:hover{transform:translateY(-1px);}.bx:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
    .sb{flex:1;display:flex;overflow:hidden;}.slr{width:68px;background:var(--ss);border-right:1px solid var(--sbr);display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:2px;flex-shrink:0;}
    .rb{width:54px;padding:9px 0;border-radius:9px;border:none;background:none;color:var(--std);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;font-family:var(--sf);}.rb span{font-size:9px;font-weight:600;}.rb:hover{background:var(--sih);color:var(--st);}.rb.ac{background:var(--sag);color:var(--sa);}
    .slp{width:310px;background:var(--ss);border-right:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;}.slp::-webkit-scrollbar{width:4px;}.slp::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.3);border-radius:4px;}
    .ph{padding:16px 20px 12px;font-size:14px;font-weight:800;letter-spacing:-0.02em;border-bottom:1px solid var(--sbr);display:flex;align-items:center;gap:7px;position:sticky;top:0;background:var(--ss);z-index:5;}
    .sc{flex:1;background:var(--sc);display:flex;flex-direction:column;position:relative;overflow:hidden;}
    .scb{position:absolute;inset:0;opacity:0.025;background-image:linear-gradient(45deg,var(--schk) 25%,transparent 25%),linear-gradient(-45deg,var(--schk) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--schk) 75%),linear-gradient(-45deg,transparent 75%,var(--schk) 75%);background-size:28px 28px;background-position:0 0,0 14px,14px -14px,-14px 0px;}
    .scc{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
    .spf{border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 20px 60px rgba(0,0,0,0.5);}
    .sct{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--ss);border-radius:10px;border:1px solid var(--sbr);box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:10;}
    .zd{font-size:11px;font-weight:700;color:var(--std);min-width:40px;text-align:center;}.td{width:1px;height:18px;background:var(--sbr);margin:0 3px;}
    .sp{padding:4px 10px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:var(--sf);}.sp:hover{background:var(--sih);color:var(--st);}.sp.ac{background:var(--sa);color:#fff;border-color:var(--sa);}
    .fl{font-size:10px;font-weight:700;color:var(--std);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;display:block;}
    .fi{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;transition:all 0.15s;}.fi:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}.fi::placeholder{color:var(--stm);}
    .fg{margin-bottom:12px;}.fr{display:flex;gap:7px;}
    .fo{padding:9px 12px;border-radius:9px;border:1px solid var(--sbr);background:none;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;margin-bottom:5px;font-family:var(--sf);}.fo:hover{background:var(--sih);}.fo.ac{border-color:var(--sa);background:var(--sag);}
    .tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:7px;}
    .tc{border-radius:10px;border:2px solid var(--sbr);background:var(--si);cursor:pointer;transition:all 0.2s;overflow:hidden;padding:12px;text-align:center;font-family:var(--sf);}.tc:hover{border-color:rgba(128,128,128,0.2);}.tc.ac{border-color:var(--sa);background:var(--sag);}
    .tiw{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:10px 22px;background:var(--suc);color:#fff;font-size:12px;font-weight:700;border-radius:10px;box-shadow:0 8px 32px rgba(16,185,129,0.3);z-index:100;animation:ti 0.3s ease;font-family:var(--sf);}
    @keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(16px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    .animate-spin{animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}
    .group:hover .ghov{opacity:1!important;}
    .ta{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;resize:none;}.ta:focus{border-color:var(--sa);}
    .ps{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;appearance:none;cursor:pointer;}.ps:focus{border-color:var(--sa);}
    .am-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;border:1px solid var(--sbr);background:var(--si);cursor:pointer;font-size:11px;font-weight:600;color:var(--std);transition:all 0.15s;font-family:var(--sf);}.am-chip:hover{background:var(--sih);color:var(--st);}.am-chip.ac{border-color:var(--sa);background:var(--sag);color:var(--sa);}
    .back-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;margin-right:4px;}.back-btn:hover{background:var(--sih);color:var(--st);}
    .tool-header-row{padding:12px 18px;background:var(--ss);border-bottom:1px solid var(--sbr);flex-shrink:0;}
    #lensy-chat-widget,#lensy-chat-bubble,.lensy-widget,.lensy-bubble,[data-lensy],[id*='lensy'],iframe[src*='lensy']{display:none!important;visibility:hidden!important;}
    @media(max-width:849px){
      .st{height:auto;min-height:48px;flex-wrap:wrap;padding:8px 10px;gap:6px;}
      .stb{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:1;min-width:0;}.stb::-webkit-scrollbar{display:none;}
      .stbi{padding:5px 10px;font-size:11px;white-space:nowrap;}
      .ssp{display:none;}
      .sac .bi[title="Undo"],.sac .bi[title="Redo"],.sac .td{display:none;}
      .sb .slr{display:none;}
      .sb .slp{display:none;}
      .sb .slp.mob-open{display:block;position:fixed;bottom:56px;left:0;right:0;width:100%;max-height:60vh;border-right:none;border-top:1px solid rgba(255,255,255,0.08);border-radius:16px 16px 0 0;z-index:95;box-shadow:0 -8px 32px rgba(0,0,0,0.4);}
      .sb{flex-direction:column;}
      .sc{padding-bottom:56px;}
      .sct{bottom:72px;max-width:calc(100vw - 24px);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}.sct::-webkit-scrollbar{display:none;}
      .fi,.ta,.ps{min-height:44px;font-size:14px;}
      .mob-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:90;}
      .mob-export-fab{position:fixed;bottom:72px;right:16px;z-index:88;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--sa),#7c3aed);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,0.4);}
      .mob-export-fab:active{transform:scale(0.95);}
      .mob-prop-sel{width:100%!important;margin-left:0!important;}
      .tool-header-row{padding:10px 12px;}
    }
  `;


  return(
    <><style>{css}</style>
    <div className="sr">
      <div className="st">
        <div style={{display:"flex",alignItems:"center",gap:9,paddingRight:18,borderRight:"1px solid var(--sbr)",marginRight:6}}><div style={{width:30,height:30,background:"linear-gradient(135deg,var(--sa),#a855f7)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><PenTool size={14} color="#fff"/></div><span style={{fontSize:14,fontWeight:800,letterSpacing:"-0.03em"}}>Design Studio</span></div>
        <div className="stb">{TABS.map(t=><button key={t.id} className={`stbi ${activeTab===t.id?"ac":""}`} onClick={()=>setActiveTab(t.id)}><t.icon size={13}/>{t.label}</button>)}</div>
        <div className="ssp"/>
        <div className="sac" style={isMobile?{display:"none"}:undefined}>
          <button className="bi" title="Undo"><Undo2 size={15}/></button>
          <button className="bi" title="Redo"><Redo2 size={15}/></button>
          <div className="td"/>
          <button className="bx" onClick={handleExport} disabled={exporting} style={activeTab==="listing-flyer"?{background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}:isVideoMode?{background:"linear-gradient(135deg,#7c3aed,#6366f1)"}:undefined}>
            {exporting?<><Loader2 size={14} className="animate-spin"/>{exportProgress>0?`${exportProgress}%`:"Exporting..."}</>:activeTab==="listing-flyer"?<><Printer size={14}/>Export Flyer</>:isVideoMode?<><Film size={14}/>Export MP4</>:<><Download size={14}/>Export</>}
          </button>
        </div>
      </div>

      {/* Unified tool header — Back + Property selector */}
      <div className="tool-header-row">
        <ToolHeader
          selectedPropertyId={selectedPropertyId}
          onSelectProperty={(id)=>{
            const params=new URLSearchParams(searchParams.toString());
            if(id===null){handleSelectProperty("");params.delete("propertyId");}
            else if(id==="__new__"){handleSelectProperty("__new__");params.delete("propertyId");}
            else{handleSelectProperty(id);params.set("propertyId",id);}
            const qs=params.toString();
            router.replace(qs?`?${qs}`:window.location.pathname);
          }}
          properties={userProperties}
          allowManualEntry
        />
      </div>

      <div className="sb">
        <div className="slr">{currentPanels.map(p=><button key={p.id} className={`rb ${leftPanel===p.id?"ac":""}`} onClick={()=>setLeftPanel(p.id)}><p.icon size={18}/><span>{p.label}</span></button>)}</div>

        <div className={`slp${isMobile&&mobilePanel?" mob-open":""}`}>

          {/* ── PANELS ── */}


          {activeTab==="listing-flyer"&&leftPanel==="uploads"&&<><div className="ph"><ImageIcon size={15} color="var(--sa)"/>Photos ({flyerPhotos.length}/7)</div><div style={{padding:14}}><p style={{fontSize:11,color:"var(--std)",marginBottom:10,lineHeight:1.5}}>First photo = hero. Photos 2-3 stack right. Photos 4-7 fill bottom row.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{flyerPhotos.map((url:string,i:number)=>(<div key={i} className="group" style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",top:2,left:2,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>{i===0?"Hero":i<3?`R${i}`:`B${i-2}`}</div><button className="ghov" onClick={()=>setFlyerPhotos((p:string[])=>p.filter((_:string,idx:number)=>idx!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}><X size={10}/></button></div>))}{flyerPhotos.length<7&&<label style={{aspectRatio:"1",borderRadius:8,border:"2px dashed var(--sbr)",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"var(--std)"}}><Upload size={16}/><span style={{fontSize:9,fontWeight:600}}>Add</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{if(!isLensSubscriber){setShowGate(true);e.target.value="";return;}Array.from(e.target.files||[]).slice(0,7-flyerPhotos.length).forEach(f=>setFlyerPhotos((p:string[])=>[...p,URL.createObjectURL(f)]));e.target.value="";}}/></label>}</div><div style={{marginTop:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>gatedAction(()=>setHeadshot(URL.createObjectURL(f)))} onClear={()=>setHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>gatedAction(()=>setLogo(URL.createObjectURL(f)))} onClear={()=>setLogo(null)} uploading={false} compact/></div></div></div></>}
            {activeTab==="listing-flyer"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Property Details</div><Section title="Address & Price" icon={Home}><div className="fg"><label className="fl">Street Address</label><input className="fi" value={flyerAddress} onChange={e=>setFlyerAddress(e.target.value)} placeholder="123 Main Street"/></div><div className="fg"><label className="fl">City, State</label><input className="fi" value={flyerCityState} onChange={e=>setFlyerCityState(e.target.value)} placeholder="Austin, TX"/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={flyerPrice} onChange={e=>setFlyerPrice(e.target.value)} placeholder="425,000"/></div><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={flyerBeds} onChange={e=>setFlyerBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={flyerBaths} onChange={e=>setFlyerBaths(e.target.value)}/></div></div><div className="fg"><label className="fl">Sq Ft</label><input className="fi" value={flyerSqft} onChange={e=>setFlyerSqft(e.target.value)}/></div></Section><Section title="Description" icon={FileText} defaultOpen={false}><textarea className="ta" rows={5} value={flyerDescription} onChange={e=>setFlyerDescription(e.target.value)} placeholder="Property description..."/></Section><Section title="Agent Info" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e=>setAgentEmail(e.target.value)}/></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div></Section></>}
            {activeTab==="listing-flyer"&&leftPanel==="urls"&&<><div className="ph"><Globe size={15} color="var(--sa)"/>URLs & Links</div><div style={{padding:14}}><Section title="Listing URL" icon={Globe}><input className="fi" value={flyerListingUrl} onChange={e=>setFlyerListingUrl(e.target.value)} placeholder="https://yourslug.p2v.homes"/></Section><Section title="Video Tour URL" icon={Video} defaultOpen={false}><input className="fi" value={flyerVideoUrl} onChange={e=>setFlyerVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."/></Section><Section title="Virtual Staging URL" icon={ImageIcon} defaultOpen={false}><input className="fi" value={flyerStagingUrl} onChange={e=>setFlyerStagingUrl(e.target.value)} placeholder="https://yourslug.p2v.homes#staging"/></Section></div></>}
            {activeTab==="listing-flyer"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Flyer Styles</div><Section title="Branding" icon={Eye}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}><div><p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>Unbranded Mode</p></div><button onClick={()=>setFlyerUnbranded(!flyerUnbranded)} style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:flyerUnbranded?"var(--sa)":"rgba(255,255,255,0.12)",position:"relative"}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:flyerUnbranded?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/></button></div></Section><Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${flyerFont===f.id?"ac":""}`} onClick={()=>setFlyerFont(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section><Section title="Accent Color" icon={Paintbrush}><ColorPicker value={flyerAccentColor} onChange={setFlyerAccentColor}/><div style={{marginTop:10}}><SwatchGrid colors={BROKERAGE_COLORS} current={flyerAccentColor} onSelect={setFlyerAccentColor} showLabels/></div></Section></>}
            {activeTab==="templates"&&leftPanel==="templates"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)"/>Templates</div><div style={{padding:14}}><div className="tg">{TEMPLATES.map(t=><button key={t.id} className={`tc ${selectedTemplate===t.id?"ac":""}`} onClick={()=>setSelectedTemplate(t.id)}><div className="tiw" style={{background:`${t.color}20`}}><t.icon size={18} color={t.color}/></div><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{t.label}</div></button>)}</div></div></>}
            {activeTab==="templates"&&leftPanel==="uploads"&&<><div className="ph"><Upload size={15} color="var(--sa)"/>Media</div><div style={{padding:14}}>
              {/* Image / Video toggle */}
              <div style={{display:"flex",gap:3,marginBottom:14}}><button className={`sp ${mediaMode==="image"?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>{setMediaMode("image");setSelectedVideo(null);}}><ImageIcon size={12} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>Photo</button><button className={`sp ${mediaMode==="video"?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>{setMediaMode("video");loadUserVideos();}}><Film size={12} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>Video</button></div>
              {mediaMode==="image"?<>
                <UploadZone label="Listing Photo" imageUrl={listingPhoto} onUpload={f=>gatedAction(()=>setListingPhoto(URL.createObjectURL(f)))} onClear={()=>setListingPhoto(null)} uploading={false}/>
                <div style={{marginTop:12}}><span className="fl">Stock Photos</span><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:6}}>{DEMO_PHOTOS.map((url:string,i:number)=><div key={i} onClick={()=>gatedAction(()=>setListingPhoto(url))} style={{aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"pointer",border:listingPhoto===url?"2px solid var(--sa)":"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div></div>
              </>:<>
                {/* Video library */}
                {selectedVideo&&<div style={{marginBottom:12,borderRadius:10,overflow:"hidden",border:"2px solid var(--sa)",position:"relative"}}><video src={selectedVideo.url} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover"}} muted playsInline/><div style={{position:"absolute",bottom:0,left:0,right:0,padding:"6px 10px",background:"linear-gradient(transparent,rgba(0,0,0,0.7))"}}><p style={{fontSize:10,color:"#fff",fontWeight:600,margin:0}}>{selectedVideo.address}</p></div><button onClick={()=>setSelectedVideo(null)} style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={10} color="#fff"/></button></div>}
                {loadingVideos?<div style={{display:"flex",justifyContent:"center",padding:"20px 0"}}><Loader2 size={18} color="var(--std)" className="animate-spin"/></div>
                :userVideos.length===0?<div style={{padding:"20px 0",textAlign:"center" as const}}><Film size={28} color="var(--std)"/><p style={{fontSize:11,color:"var(--std)",margin:0,marginTop:8,lineHeight:1.6}}>No listing videos found. Order one from the dashboard to use video backgrounds.</p></div>
                :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{userVideos.map((v:any,i:number)=><button key={i} onClick={()=>setSelectedVideo(v)} style={{position:"relative",borderRadius:8,overflow:"hidden",border:selectedVideo?.orderId===v.orderId?"2px solid var(--sa)":"1px solid var(--sbr)",background:"none",cursor:"pointer",padding:0,fontFamily:"var(--sf)"}}><div style={{aspectRatio:"16/9",backgroundColor:"rgba(255,255,255,0.04)",overflow:"hidden"}}>{v.thumbnail?<img src={v.thumbnail} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={20} color="rgba(255,255,255,0.15)"/></div>}</div><div style={{padding:"4px 6px"}}><p style={{fontSize:9,fontWeight:600,color:"var(--st)",margin:0,textAlign:"left"}}>{v.address?.slice(0,25)}</p><p style={{fontSize:8,color:"var(--std)",margin:0,textAlign:"left"}}>{v.date}</p></div>{selectedVideo?.orderId===v.orderId&&<div style={{position:"absolute",top:4,right:4,width:16,height:16,borderRadius:"50%",backgroundColor:"var(--sa)",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={8} color="#fff"/></div>}</button>)}</div>}
              </>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>setHeadshot(URL.createObjectURL(f))} onClear={()=>setHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>setLogo(URL.createObjectURL(f))} onClear={()=>setLogo(null)} uploading={false} compact/></div>
            </div></>}
            {activeTab==="templates"&&leftPanel==="music"&&<><div className="ph"><Music size={15} color="var(--sa)"/>Music</div><div style={{padding:14}}>
              {!isVideoMode&&<div style={{padding:"8px 10px",borderRadius:8,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.15)",marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Film size={12} color="#f59e0b"/><span style={{fontSize:10,color:"#f59e0b",fontWeight:600}}>Select a video in Media tab first to add music</span></div>}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span className="fl" style={{margin:0}}>🎵 Background Music</span>{selectedMusicTrack&&<button onClick={()=>setSelectedMusicTrack(null)} style={{fontSize:9,color:"var(--std)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--sf)",textDecoration:"underline"}}>Clear</button>}</div>
              {selectedMusicTrack&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"rgba(99,102,241,0.1)",border:"1px solid var(--sa)",marginBottom:10}}><Music size={12} color="var(--sa)"/><span style={{fontSize:11,fontWeight:600,color:"var(--sa)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedMusicTrack.name}</span><button onClick={e=>{e.stopPropagation();handlePlayTrack(selectedMusicTrack.id,selectedMusicTrack.url);}} style={{width:20,height:20,borderRadius:"50%",background:"var(--sa)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:"#fff",fontWeight:700}}>{playingTrackId===selectedMusicTrack.id?"\u25a0":"\u25b6"}</span></button></div>}
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginBottom:8}}>{VIBES.map(v=><button key={v.key} onClick={()=>{setMusicVibeFilter(v.key);fetchMusicTracks(v.key);}} style={{padding:"3px 8px",borderRadius:6,border:musicVibeFilter===v.key?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.1)",background:musicVibeFilter===v.key?"var(--sag)":"none",color:musicVibeFilter===v.key?"var(--sa)":"var(--std)",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--sf)"}}>{v.label}</button>)}</div>
              {loadingMusic?<div style={{display:"flex",justifyContent:"center",padding:"12px 0"}}><Loader2 size={16} color="var(--std)" className="animate-spin"/></div>:<div style={{maxHeight:400,overflowY:"auto" as const,display:"flex",flexDirection:"column" as const,gap:4}}>{musicTracks.length===0&&<p style={{fontSize:10,color:"var(--std)",textAlign:"center" as const,padding:"10px 0",margin:0}}><button onClick={()=>fetchMusicTracks("")} style={{color:"var(--sa)",background:"none",border:"none",cursor:"pointer",fontSize:10,fontFamily:"var(--sf)"}}>Load tracks</button></p>}{musicTracks.map((t:any)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:8,border:selectedMusicTrack?.id===t.id?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.06)",background:selectedMusicTrack?.id===t.id?"var(--sag)":"rgba(255,255,255,0.02)",cursor:"pointer"}} onClick={()=>setSelectedMusicTrack({id:t.id,url:t.file_url,name:t.display_name})}><button onClick={e=>{e.stopPropagation();handlePlayTrack(t.id,t.file_url);}} style={{width:22,height:22,borderRadius:"50%",background:playingTrackId===t.id?"var(--sa)":"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:playingTrackId===t.id?"#fff":"var(--std)",fontWeight:700}}>{playingTrackId===t.id?"\u25a0":"\u25b6"}</span></button><span style={{fontSize:10,fontWeight:600,color:"var(--st)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.display_name}</span><span style={{fontSize:9,color:"var(--std)",flexShrink:0}}>{t.duration_seconds}s</span>{selectedMusicTrack?.id===t.id&&<Check size={11} color="var(--sa)"/>}</div>)}</div>}
            </div></>}
            {activeTab==="templates"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Details</div><Section title="Property" icon={Home}><div className="fg"><label className="fl">Street Address</label><input className="fi" value={address} onChange={e=>setAddress(e.target.value)} placeholder="8043 Villas la Colina"/></div><div className="fg"><label className="fl">City, State</label><input className="fi" value={addressLine2} onChange={e=>setAddressLine2(e.target.value)} placeholder="Ocotal, Guanacaste"/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e=>setBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e=>setBaths(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e=>setSqft(e.target.value)}/></div></div><div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e=>setPrice(e.target.value)}/></div>{selectedTemplate==="open-house"&&<div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Date</label><input className="fi" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Time</label><input className="fi" value={time} onChange={e=>setTime(e.target.value)}/></div></div>}</Section><Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div></div></Section></>}
            {activeTab==="templates"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Styles</div><Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${fontId===f.id?"ac":""}`} onClick={()=>setFontId(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section><Section title="Info Bar Color" icon={Paintbrush}><ColorPicker value={barColor} onChange={setBarColor}/><div style={{marginTop:10}}><SwatchGrid colors={BROKERAGE_COLORS} current={barColor} onSelect={setBarColor} showLabels/></div></Section><Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={accentColor||"#ffffff"} onChange={setAccentColor}/>{accentColor&&<button onClick={()=>setAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={accentColor} onSelect={setAccentColor}/></div></Section><Section title="Drop Shadow" icon={Eye} defaultOpen={false}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}><div><p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>Brand Shadow</p><p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:2}}>Adds shadow behind branding text</p></div><button onClick={()=>setBrandShadow(!brandShadow)} style={{width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",background:brandShadow?"var(--sa)":"rgba(255,255,255,0.12)",position:"relative"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:brandShadow?21:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/></button></div></Section></>}
            {activeTab==="yard-sign"&&leftPanel==="design"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)"/>Yard Sign Design</div><div style={{padding:14}}><div className="tg" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>{YARD_DESIGNS.map(d=><button key={d.id} className={`tc ${yardDesign===d.id?"ac":""}`} onClick={()=>setYardDesign(d.id)}><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{d.label}</div><div style={{fontSize:9,color:"var(--std)",marginTop:2}}>{d.desc}</div></button>)}</div><div style={{marginTop:14}}><span className="fl">Sign Size</span><div className="fr" style={{marginTop:4}}>{YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}</div></div></div></>}
            {activeTab==="yard-sign"&&leftPanel==="uploads"&&<><div className="ph"><Upload size={15} color="var(--sa)"/>Uploads</div><div style={{padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>setHeadshot(URL.createObjectURL(f))} onClear={()=>setHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>setLogo(URL.createObjectURL(f))} onClear={()=>setLogo(null)} uploading={false} compact/></div></div></>}
            {activeTab==="yard-sign"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Sign Details</div><Section title="Header & Agent" icon={User}><div className="fg"><label className="fl">Header Text</label><input className="fi" value={yardHeaderText} onChange={e=>setYardHeaderText(e.target.value)}/></div><div className="fg"><label className="fl">Agent Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e=>setAgentEmail(e.target.value)}/></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div></Section></>}
            {activeTab==="yard-sign"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Colors</div>{yardDesign==="split-bar"&&<><Section title="Top Bar" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels/></div></Section><Section title="Bottom Bar" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels/></div></Section></>}{yardDesign==="sidebar"&&<><Section title="Sidebar" icon={Paintbrush}><ColorPicker value={yardSidebarColor} onChange={setYardSidebarColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardSidebarColor} onSelect={setYardSidebarColor} showLabels/></div></Section><Section title="Main Bg" icon={Paintbrush}><ColorPicker value={yardMainBgColor} onChange={setYardMainBgColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardMainBgColor} onSelect={setYardMainBgColor} showLabels/></div></Section></>}{yardDesign==="top-heavy"&&<><Section title="Top" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels/></div></Section><Section title="Bottom" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels/></div></Section></>}</>}
            {activeTab==="property-pdf"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Property Details</div><Section title="Address & Price" icon={MapPin}><div className="fg"><label className="fl">Address</label><input className="fi" value={pdfAddress} onChange={e=>setPdfAddress(e.target.value)}/></div><div className="fg"><label className="fl">City, State, Zip</label><input className="fi" value={pdfCityStateZip} onChange={e=>setPdfCityStateZip(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={pdfPrice} onChange={e=>setPdfPrice(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={pdfBeds} onChange={e=>setPdfBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={pdfBaths} onChange={e=>setPdfBaths(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">SqFt</label><input className="fi" value={pdfSqft} onChange={e=>setPdfSqft(e.target.value)}/></div></div></Section><Section title="Description" icon={FileText} defaultOpen={false}><textarea className="ta" rows={6} value={pdfDescription} onChange={e=>setPdfDescription(e.target.value)}/></Section><Section title="Features" icon={Sparkles}><textarea className="ta" rows={6} value={pdfFeatures} onChange={e=>setPdfFeatures(e.target.value)} placeholder="One per line..."/></Section></>}
            {activeTab==="property-pdf"&&leftPanel==="photos"&&<><div className="ph"><ImageIcon size={15} color="var(--sa)"/>Photos ({pdfPhotos.length}/25)</div><div style={{padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{pdfPhotos.map((url:string,i:number)=>(<div key={i} className="group" style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><button className="ghov" onClick={()=>setPdfPhotos((p:string[])=>p.filter((_:string,idx:number)=>idx!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0}}><X size={10}/></button></div>))}{pdfPhotos.length<25&&<label style={{aspectRatio:"1",borderRadius:8,border:"2px dashed var(--sbr)",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"var(--std)"}}><Upload size={16}/><span style={{fontSize:9,fontWeight:600}}>Add</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{if(!isLensSubscriber){setShowGate(true);e.target.value="";return;}Array.from(e.target.files||[]).forEach(f=>setPdfPhotos((p:string[])=>[...p,URL.createObjectURL(f)]));e.target.value="";}}/></label>}</div></div></>}
            {activeTab==="property-pdf"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Accent</div><Section title="Color" icon={Paintbrush}><ColorPicker value={pdfAccentColor} onChange={setPdfAccentColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} showLabels/></div></Section></>}
            {activeTab==="branding-card"&&leftPanel==="uploads"&&<><div className="ph"><Upload size={15} color="var(--sa)"/>Uploads</div><div style={{padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={brandHeadshot} onUpload={f=>setBrandHeadshot(URL.createObjectURL(f))} onClear={()=>setBrandHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={brandLogo} onUpload={f=>setBrandLogo(URL.createObjectURL(f))} onClear={()=>setBrandLogo(null)} uploading={false} compact/></div><div style={{marginTop:10}}><UploadZone label="Background Photo" imageUrl={brandBgPhoto} onUpload={f=>setBrandBgPhoto(URL.createObjectURL(f))} onClear={()=>setBrandBgPhoto(null)} uploading={false}/></div></div></>}
            {activeTab==="branding-card"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Card Details</div><Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={brandAgentName} onChange={e=>setBrandAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={brandPhone} onChange={e=>setBrandPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={brandEmail} onChange={e=>setBrandEmail(e.target.value)}/></div></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brandBrokerage} onChange={e=>setBrandBrokerage(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Tagline</label><input className="fi" value={brandTagline} onChange={e=>setBrandTagline(e.target.value)}/></div></div><div className="fg"><label className="fl">Website</label><input className="fi" value={brandWebsite} onChange={e=>setBrandWebsite(e.target.value)}/></div></Section></>}
            {activeTab==="branding-card"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Styles</div><Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${brandFont===f.id?"ac":""}`} onClick={()=>setBrandFont(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section><Section title="Bg Color" icon={Paintbrush}><ColorPicker value={brandBgColor} onChange={setBrandBgColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={brandBgColor} onSelect={setBrandBgColor} showLabels/></div></Section><Section title="Accent" icon={Sparkles} defaultOpen={false}><ColorPicker value={brandAccentColor||"#ffffff"} onChange={setBrandAccentColor}/>{brandAccentColor&&<button onClick={()=>setBrandAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={brandAccentColor} onSelect={setBrandAccentColor}/></div></Section><Section title="Orientation" icon={Layers}><div className="fr">{BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}</div></Section></>}

        </div>

        <div className="sc">
          <div className="scb"/>
          <div className="scc">
            <div className="spf" ref={previewRef} style={{width:pW,height:pH}}>
              <div data-export-target="true" style={{width:rawW,height:rawH,transform:`scale(${scale})`,transformOrigin:"top left"}}>{renderPreview()}</div>
            </div>
          </div>
          <div className="sct">
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.max(50,zoom-10))}><ZoomOut size={13}/></button>
            <div className="zd">{zoom}%</div>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.min(200,zoom+10))}><ZoomIn size={13}/></button>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(100)}><RotateCcw size={13}/></button>
            <div className="td"/>
            {activeTab==="templates"&&SIZES.map(s=><button key={s.id} className={`sp ${selectedSize===s.id?"ac":""}`} onClick={()=>setSelectedSize(s.id)}>{s.label}</button>)}
            {activeTab==="listing-flyer"&&<span style={{fontSize:11,fontWeight:600,color:"var(--std)",padding:"0 4px"}}>US Letter 8.5\u00d711\"</span>}
            {activeTab==="yard-sign"&&YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}
            {activeTab==="property-pdf"&&pdfTotalPages>1&&<><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.max(0,pdfPreviewPage-1))}><ChevronLeft size={13}/></button><span className="zd">Pg {pdfPreviewPage+1}/{pdfTotalPages}</span><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.min(pdfTotalPages-1,pdfPreviewPage+1))}><ChevronRight size={13}/></button></>}
            {activeTab==="branding-card"&&BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}
          </div>
        </div>
      </div>

      {isMobile&&mobilePanel&&<div className="mob-overlay" onClick={()=>setMobilePanel(null)}/>}
      {isMobile&&<MobileToolNav/>}
      {isMobile&&!exporting&&<button className="mob-export-fab" onClick={handleExport} disabled={exporting}><Download size={20}/></button>}

      {notification&&<div className="toast"><CheckCircle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:7}}/>{notification}</div>}
      {exporting&&exportStatus&&<div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",padding:"12px 20px",borderRadius:12,background:"var(--ss)",border:"1px solid var(--sbr)",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:10,fontFamily:"var(--sf)",zIndex:101}}><Loader2 size={14} color="var(--sa)" className="animate-spin"/><div><p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>{exportProgress>0?`Exporting ${exportProgress}%`:"Preparing..."}</p><p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:2}}>{exportStatus}</p></div>{exportProgress>0&&<div style={{width:36,height:36,borderRadius:"50%",background:`conic-gradient(var(--sa) ${exportProgress*3.6}deg, var(--sbr) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:28,height:28,borderRadius:"50%",background:"var(--ss)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"var(--st)"}}>{exportProgress}%</div></div>}</div>}
      {showGate&&<GateOverlay gateType={gateType} toolName="Design Studio" onClose={()=>setShowGate(false)}/>}
    </div></>
  );
}
