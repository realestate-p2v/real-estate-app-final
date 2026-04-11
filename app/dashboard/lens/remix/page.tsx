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

function isLightColor(hex:string):boolean{const c=hex.replace("#","");if(c.length<6)return true;const r=parseInt(c.substring(0,2),16),g=parseInt(c.substring(2,4),16),b=parseInt(c.substring(4,6),16);return(r*299+g*587+b*114)/1000>160;}
function hexToRgba(hex:string,alpha:number):string{const c=hex.replace("#","");if(c.length<6)return `rgba(0,0,0,${alpha})`;return `rgba(${parseInt(c.substring(0,2),16)},${parseInt(c.substring(2,4),16)},${parseInt(c.substring(4,6),16)},${alpha})`;}
function responsiveSize(base:number,text:string,maxChars:number):number{if(!text||text.length<=maxChars)return base;return Math.max(base*0.5,Math.round(base*Math.max(maxChars/text.length,0.55)));}
function darken(hex:string,pct:number):string{const n=parseInt(hex.replace("#",""),16);return `rgb(${Math.max(0,(n>>16)-Math.round(2.55*pct))},${Math.max(0,((n>>8)&0xff)-Math.round(2.55*pct))},${Math.max(0,(n&0xff)-Math.round(2.55*pct))})`;}
function getBadgeConfig(id:string){const m:Record<string,{text:string;color:string}>={"just-listed":{text:"JUST LISTED",color:"#2563eb"},"open-house":{text:"OPEN HOUSE",color:"#059669"},"price-reduced":{text:"PRICE REDUCED",color:"#dc2626"},"just-sold":{text:"JUST SOLD",color:"#d97706"}};return m[id]||m["just-listed"];}
function truncateText(text:string,max:number):string{if(!text)return text;const clean=text.replace(/\*{1,2}([^*]+)\*{1,2}/g,"$1");if(clean.length<=max)return clean;return clean.substring(0,max).trimEnd()+"\u2026";}

function extractPublicId(cloudinaryUrl: string): string | null {
  if (!cloudinaryUrl) return null;
  try {
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function deleteFromCloudinary(url: string, resourceType: string = "image"): Promise<boolean> {
  const publicId = extractPublicId(url);
  if (!publicId) return false;
  try {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
    });
    const data = await res.json();
    return data.success;
  } catch { return false; }
}

function extractAllUrls(obj: any): string[] {
  if (!obj) return [];
  if (typeof obj === "string") return obj.startsWith("http") ? [obj] : [];
  if (Array.isArray(obj)) return obj.flatMap(extractAllUrls);
  if (typeof obj === "object") return Object.values(obj).flatMap(extractAllUrls);
  return [];
}

async function saveExportWithOverwrite(
  supabase: any,
  userId: string,
  propertyId: string | null,
  templateType: string,
  newUrl: string,
  extraData?: Record<string, any>
) {
  let query = supabase
    .from("design_exports")
    .select("id, export_url")
    .eq("user_id", userId)
    .eq("template_type", templateType);
  if (propertyId) { query = query.eq("property_id", propertyId); }
  else { query = query.is("property_id", null); }
  const { data: existing } = await query;
  for (const old of (existing || [])) {
    if (old.export_url && old.export_url.includes("cloudinary")) {
      const rt = templateType.startsWith("video_remix") ? "video" : "image";
      await deleteFromCloudinary(old.export_url, rt);
    }
    await supabase.from("design_exports").delete().eq("id", old.id);
  }
  const { data, error } = await supabase
    .from("design_exports")
    .insert({ user_id: userId, property_id: propertyId, template_type: templateType, export_url: newUrl, ...(extraData || {}) })
    .select()
    .single();
  return { data, error };
}

// ─── InfoBarTemplate ───────────────────────────────────────────────────────────
function InfoBarTemplate({size,listingPhoto,videoElement,headshot,logo,address,addressLine2,beds,baths,sqft,price,agentName,phone,brokerage,badgeText,badgeColor,fontFamily,barColor,accentColor}:any){
  const w=size.width,h=size.height,isStory=size.id==="story",isPostcard=size.id==="postcard",unit=w/1080;
  const accent=accentColor||"#ffffff",usedBadge=accentColor||badgeColor,barLight=isLightColor(barColor);
  const tp=barLight?"#111827":"#ffffff",ts=barLight?"rgba(17,24,39,0.55)":"rgba(255,255,255,0.55)";
  const tm=barLight?"rgba(17,24,39,0.40)":"rgba(255,255,255,0.35)",dc=barLight?"rgba(0,0,0,0.10)":"rgba(255,255,255,0.12)";
  const an=agentName||"Agent Name",br=brokerage||"Brokerage",ph=phone||"(555) 000-0000";
  const ad=address||"123 Main Street",ad2=addressLine2||"";
  const det=[beds&&`${beds} BD`,baths&&`${baths} BA`,sqft&&`${sqft} SF`].filter(Boolean).join("  \u00b7  ")||"3 BD  \u00b7  2 BA  \u00b7  1,800 SF";
  const pr=price?`$${price}`:"$000,000";
  const pp=isPostcard?55:58,barH=h*(1-pp/100);
  const px=Math.round((isPostcard?44:isStory?56:36)*unit),py=Math.round((isStory?28:20)*unit);
  const hs=Math.round(barH*(isStory?0.36:isPostcard?0.78:0.52)),hb=Math.round((isStory?4:isPostcard?4:3)*unit);
  const bH=Math.round(barH*(isStory?0.072:isPostcard?0.16:0.14)),bF=Math.round(barH*(isStory?0.036:isPostcard?0.065:0.052));
  const anF=responsiveSize(Math.round(barH*(isStory?0.080:isPostcard?0.125:0.082)),an,18);
  const brF=responsiveSize(Math.round(barH*(isStory?0.056:isPostcard?0.080:0.055)),br,24);
  const phF=Math.round(barH*(isStory?0.054:isPostcard?0.074:0.052));
  const adF=responsiveSize(Math.round(barH*(isStory?0.072:isPostcard?0.110:0.094)),ad,16);
  const dtF=Math.round(barH*(isStory?0.048:isPostcard?0.074:0.055));
  const prF=Math.round(barH*(isStory?0.105:isPostcard?0.185:0.15));
  const Headshot=()=>headshot?(<div style={{width:hs,height:hs,borderRadius:"50%",padding:hb,background:accentColor?`linear-gradient(135deg,${accentColor},${hexToRgba(accentColor,0.4)})`:barLight?"linear-gradient(135deg,rgba(0,0,0,0.15),rgba(0,0,0,0.05))":"linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))",flexShrink:0}}><img src={headshot} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block"}}/></div>):<div style={{width:hs,height:hs,borderRadius:"50%",backgroundColor:barLight?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.06)",border:`${hb}px solid ${dc}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><User style={{width:hs*0.38,height:hs*0.38,color:tm}}/></div>;
  const Photo=()=>(<div style={{position:"absolute",top:0,left:0,right:0,height:`${pp}%`}}>{videoElement?<div data-video-area style={{width:"100%",height:"100%",position:"relative",overflow:"hidden"}}>{videoElement}</div>:listingPhoto?<img src={listingPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",backgroundColor:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageIcon style={{width:64*unit,height:64*unit,color:"rgba(255,255,255,0.12)"}}/></div>}<div style={{position:"absolute",bottom:0,left:0,right:0,height:Math.round(140*unit),backgroundImage:`linear-gradient(to top,${barColor} 0%,${hexToRgba(barColor,0.85)} 30%,${hexToRgba(barColor,0.4)} 65%,transparent 100%)`}}/></div>);
  const Badge=()=>(<div style={{position:"absolute",top:`calc(${pp}% - ${Math.round(bH*0.5)}px)`,right:px,zIndex:10}}><div style={{display:"inline-flex",alignItems:"center",height:bH,padding:`0 ${Math.round(22*unit)}px`,backgroundColor:usedBadge,borderRadius:Math.round(4*unit),boxShadow:`0 ${Math.round(4*unit)}px ${Math.round(20*unit)}px ${hexToRgba(usedBadge,0.45)}`}}><span style={{fontSize:bF,fontWeight:800,color:isLightColor(usedBadge)?"#111":"#fff",letterSpacing:"0.14em",textTransform:"uppercase" as const,lineHeight:1}}>{badgeText}</span></div></div>);
  const ad2F=Math.round(adF*0.75);
  const RightCol=()=>(<div style={{flex:1,textAlign:"right" as const,minWidth:0,display:"flex",flexDirection:"column" as const,justifyContent:"center"}}><p style={{fontSize:adF,fontWeight:700,color:tp,lineHeight:1.15,margin:0}}>{ad}</p>{ad2&&<p style={{fontSize:ad2F,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(2*unit)}}>{ad2}</p>}<p style={{fontSize:dtF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(6*unit),letterSpacing:"0.04em"}}>{det}</p><div style={{width:Math.round(60*unit),height:Math.round(2*unit),backgroundColor:accentColor||dc,marginLeft:"auto",marginTop:Math.round(10*unit),marginBottom:Math.round(8*unit),borderRadius:1,opacity:accentColor?0.7:1}}/><p style={{fontSize:prF,fontWeight:800,color:accent,lineHeight:1.0,margin:0,letterSpacing:"-0.01em",textShadow:accentColor&&!barLight?`0 ${Math.round(2*unit)}px ${Math.round(12*unit)}px ${hexToRgba(accentColor,0.3)}`:"none"}}>{pr}</p></div>);
  if(isStory){return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}><Photo/><Badge/><div style={{position:"absolute",bottom:0,left:0,right:0,height:`${100-pp}%`,backgroundColor:barColor}}><div style={{position:"absolute",top:0,left:0,right:0,height:Math.round(3*unit),backgroundColor:accent,opacity:accentColor?0.8:0.15}}/><div style={{position:"absolute",inset:0,backgroundImage:barLight?"linear-gradient(to bottom,rgba(0,0,0,0.03) 0%,transparent 40%)":"linear-gradient(to bottom,rgba(255,255,255,0.04) 0%,transparent 40%)"}}/><div style={{position:"absolute",inset:0,display:"flex",padding:`${py}px ${Math.round(44*unit)}px ${py}px ${px}px`,gap:Math.round(20*unit)}}><div style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",minWidth:0,gap:Math.round(12*unit)}}><Headshot/><div style={{textAlign:"center" as const,minWidth:0,width:"100%"}}><p style={{fontSize:anF,fontWeight:700,color:tp,lineHeight:1.15,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{an}</p><p style={{fontSize:brF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(5*unit),wordBreak:"break-word" as const}}>{br}</p><p style={{fontSize:phF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(3*unit)}}>{ph}</p></div>{logo&&<img src={logo} alt="" style={{maxWidth:Math.round(hs*1.3),maxHeight:Math.round(barH*0.14),objectFit:"contain" as const,marginTop:Math.round(6*unit)}}/>}</div><div style={{width:Math.round(1.5*unit),alignSelf:"stretch",margin:`${Math.round(barH*0.08)}px 0`,backgroundColor:dc,flexShrink:0}}/><RightCol/></div></div></div>);}
  return(<div style={{position:"relative",overflow:"hidden",width:w,height:h,fontFamily}}><Photo/><Badge/><div style={{position:"absolute",bottom:0,left:0,right:0,height:`${100-pp}%`,backgroundColor:barColor}}><div style={{position:"absolute",top:0,left:0,right:0,height:Math.round(3*unit),backgroundColor:accent,opacity:accentColor?0.8:0.15}}/><div style={{position:"absolute",inset:0,backgroundImage:barLight?"linear-gradient(to bottom,rgba(0,0,0,0.03) 0%,transparent 40%)":"linear-gradient(to bottom,rgba(255,255,255,0.04) 0%,transparent 40%)"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:`${py}px ${px}px`,gap:Math.round(16*unit)}}><div style={{display:"flex",alignItems:"center",gap:Math.round(18*unit),flex:1,minWidth:0}}><Headshot/><div style={{minWidth:0,flex:1}}><p style={{fontSize:anF,fontWeight:700,color:tp,lineHeight:1.15,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{an}</p><p style={{fontSize:brF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(4*unit),wordBreak:"break-word" as const}}>{br}</p><p style={{fontSize:phF,fontWeight:500,color:ts,lineHeight:1.3,margin:0,marginTop:Math.round(2*unit)}}>{ph}</p></div></div><div style={{width:Math.round(1.5*unit),alignSelf:"stretch",margin:`${Math.round(barH*0.12)}px 0`,backgroundColor:dc,flexShrink:0}}/><RightCol/></div>{logo&&<img src={logo} alt="" style={{position:"absolute",bottom:Math.round(20*unit),right:px,maxWidth:Math.round(barH*0.30),maxHeight:Math.round(barH*0.16),objectFit:"contain" as const}}/>}</div></div>);
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

// ─── YardSign components (compact) ────────────────────────────────────────────
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

// ─── ListingFlyerTemplate (Task A — 2550×3300 US Letter @ 300dpi) ─────────────
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
  const heroW=Math.round(W*0.58);
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
const REMIX_SIZES=[
  {id:"landscape",label:"Landscape",sublabel:"1920\u00d71080",width:1920,height:1080},
  {id:"story",label:"Story/Reel",sublabel:"1080\u00d71920",width:1080,height:1920},
  {id:"square",label:"Square",sublabel:"1080\u00d71080",width:1080,height:1080},
];
interface RemixClip {
  id: string; sourceUrl: string; thumbnail: string | null; label: string;
  duration: number; trimStart: number; trimEnd: number; speed: number; order: number;
}
const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function LensGate({children,locked,label}:{children:ReactNode;locked:boolean;label?:string}){
  if(!locked)return<>{children}</>;
  return<div style={{position:"relative",opacity:0.45,pointerEvents:"none",userSelect:"none"}}>{children}<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}><div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:"linear-gradient(135deg,rgba(99,102,241,0.9),rgba(168,85,247,0.9))",boxShadow:"0 4px 16px rgba(99,102,241,0.35)"}}><Lock size={11} color="#fff"/><span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>{label||"Subscribe to Lens"}</span></div></div></div>;
}

const TEMPLATES=[
  {id:"just-listed",label:"Just Listed",icon:Home,color:"#10b981"},
  {id:"open-house",label:"Open House",icon:Calendar,color:"#6366f1"},
  {id:"price-reduced",label:"Price Reduced",icon:DollarSign,color:"#f59e0b"},
  {id:"just-sold",label:"Just Sold",icon:CheckCircle,color:"#ef4444"},
];
const SIZES=[
  {id:"square",label:"Square",sublabel:"1080\u00d71080",width:1080,height:1080},
  {id:"story",label:"Story",sublabel:"1080\u00d71920",width:1080,height:1920},
  {id:"postcard",label:"Postcard",sublabel:"1800\u00d71200",width:1800,height:1200},
];
const YARD_SIGN_SIZES=[
  {id:"18x24",label:"18\u00d724\"",sublabel:"Standard",width:5400,height:7200},
  {id:"24x36",label:"24\u00d736\"",sublabel:"Large",width:7200,height:10800},
];
const BRAND_ORIENTATIONS=[
  {id:"landscape",label:"Landscape",sublabel:"1920\u00d71080",width:1920,height:1080},
  {id:"vertical",label:"Vertical",sublabel:"1080\u00d71920",width:1080,height:1920},
];
const TABS=[
  {id:"video-remix",label:"Video Remix",icon:Film},
];
const LEFT_PANELS:Record<string,{id:string;label:string;icon:any}[]>={
  "video-remix":[{id:"clips",label:"Clips",icon:Film},{id:"timeline",label:"Timeline",icon:LayoutTemplate},{id:"music",label:"Music",icon:Music},{id:"styles",label:"Styles",icon:Palette}],
  templates:[{id:"templates",label:"Templates",icon:LayoutTemplate},{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],
  "listing-flyer":[{id:"uploads",label:"Photos",icon:ImageIcon},{id:"text",label:"Details",icon:Type},{id:"urls",label:"URLs",icon:Globe},{id:"styles",label:"Styles",icon:Palette}],
  "yard-sign":[{id:"design",label:"Design",icon:LayoutTemplate},{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Colors",icon:Palette}],
  "branding-card":[{id:"uploads",label:"Uploads",icon:Upload},{id:"text",label:"Details",icon:Type},{id:"styles",label:"Styles",icon:Palette}],
  "property-pdf":[{id:"text",label:"Details",icon:Type},{id:"photos",label:"Photos",icon:ImageIcon},{id:"styles",label:"Styles",icon:Palette}],
};
const BROKERAGE_COLORS=[{hex:"#b40101",label:"KW Red"},{hex:"#666666",label:"KW Gray"},{hex:"#003399",label:"CB Blue"},{hex:"#012169",label:"CB Navy"},{hex:"#003da5",label:"RM Blue"},{hex:"#dc1c2e",label:"RM Red"},{hex:"#b5985a",label:"C21 Gold"},{hex:"#1c1c1c",label:"C21 Black"},{hex:"#000000",label:"CMP Black"},{hex:"#333333",label:"CMP Dark"},{hex:"#002349",label:"SIR Blue"},{hex:"#1a1a1a",label:"SIR Black"},{hex:"#552448",label:"BH Purple"},{hex:"#2d1a33",label:"BH Dark"},{hex:"#1c3f6e",label:"EXP Blue"},{hex:"#006341",label:"HH Green"},{hex:"#003d28",label:"HH Dk Green"},{hex:"#4c8c2b",label:"BHG Green"},{hex:"#d4272e",label:"EXT Red"},{hex:"#e31937",label:"ERA Red"},{hex:"#273691",label:"ERA Blue"},{hex:"#a02021",label:"RF Red"},{hex:"#ffffff",label:"White"}];
const ACCENT_COLORS=["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#71717a","#ffffff","#000000"];
const FONT_OPTIONS=[
  {id:"serif",label:"Classic Serif",family:"Georgia, 'Times New Roman', serif",sample:"Elegant Home"},
  {id:"sans",label:"Clean Sans",family:"'Helvetica Neue', Arial, sans-serif",sample:"Modern Living"},
  {id:"modern",label:"Modern",family:"'Trebuchet MS', 'Gill Sans', sans-serif",sample:"Fresh Start"},
  {id:"elegant",label:"Elegant",family:"'Palatino Linotype', 'Book Antiqua', Palatino, serif",sample:"Luxury Estate"},
];
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

function RemixLibraryGrid(){
  const[remixes,setRemixes]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[viewModal,setViewModal]=useState<any>(null);
  const[deleteConfirm,setDeleteConfirm]=useState<string|null>(null);
  const[deleting,setDeleting]=useState(false);
  useEffect(()=>{
    (async()=>{
      const supabase=(await import("@/lib/supabase/client")).createClient();
      const{data:{user}}=await supabase.auth.getUser();
      if(!user){setLoading(false);return;}
      const{data}=await supabase.from("design_exports").select("*").eq("user_id",user.id).like("template_type","video_remix%").order("created_at",{ascending:false});
      setRemixes(data||[]);
      setLoading(false);
    })();
  },[]);
  const handleDelete=async(id:string)=>{
    setDeleting(true);
    try{
      const supabase=(await import("@/lib/supabase/client")).createClient();
      const item=remixes.find(r=>r.id===id);
      if(item?.export_url&&item.export_url.includes("cloudinary")){
        await deleteFromCloudinary(item.export_url,"video");
      }
      await supabase.from("design_exports").delete().eq("id",id);
      setRemixes(prev=>prev.filter(r=>r.id!==id));
      if(viewModal?.id===id)setViewModal(null);
    }catch(e){console.error("Delete failed:",e);}
    setDeleting(false);setDeleteConfirm(null);
  };
  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0"}}><Loader2 size={24} className="animate-spin" color="var(--std)"/></div>;
  if(remixes.length===0)return<div style={{textAlign:"center",padding:"48px 0",borderRadius:16,border:"2px dashed var(--sbr)",background:"rgba(255,255,255,0.01)"}}><Film size={40} color="rgba(255,255,255,0.1)" style={{margin:"0 auto 12px"}}/><p style={{fontSize:14,color:"var(--std)",margin:0}}>No remixes exported yet</p><p style={{fontSize:12,color:"var(--std)",margin:"4px 0 0",opacity:0.6}}>Use the editor above to create your first remix</p></div>;
  return<>
    {/* Delete confirmation modal */}
    {deleteConfirm&&<div onClick={()=>setDeleteConfirm(null)} style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}}><div onClick={e=>e.stopPropagation()} style={{background:"var(--ss)",borderRadius:16,border:"1px solid var(--sbr)",padding:24,maxWidth:380,width:"90%",textAlign:"center"}}><div style={{width:48,height:48,borderRadius:"50%",background:"rgba(239,68,68,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Trash2 size={22} color="#ef4444"/></div><h3 style={{fontSize:16,fontWeight:700,color:"var(--st)",margin:"0 0 8px"}}>Delete this remix?</h3><p style={{fontSize:13,color:"var(--std)",margin:"0 0 20px"}}>This will permanently delete the remix and its cloud storage file. This cannot be undone.</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={()=>setDeleteConfirm(null)} style={{padding:"8px 20px",borderRadius:99,border:"1px solid var(--sbr)",background:"none",color:"var(--st)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>handleDelete(deleteConfirm)} disabled={deleting} style={{padding:"8px 20px",borderRadius:99,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:deleting?0.6:1}}>{deleting?"Deleting...":"Delete"}</button></div></div></div>}
    {/* View modal */}
    {viewModal&&<div onClick={()=>setViewModal(null)} style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",padding:16}}><div onClick={e=>e.stopPropagation()} style={{background:"var(--ss)",borderRadius:16,border:"1px solid var(--sbr)",width:"100%",maxWidth:800,maxHeight:"90vh",overflow:"hidden",boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid var(--sbr)"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:700,color:"#7c3aed",background:"rgba(124,58,237,0.15)",padding:"2px 8px",borderRadius:99}}>Video Remix</span><span style={{fontSize:11,color:"var(--std)"}}>{new Date(viewModal.created_at).toLocaleDateString()}</span></div><button onClick={()=>setViewModal(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><X size={18} color="var(--std)"/></button></div><div style={{background:"#000"}}><video src={viewModal.export_url||viewModal.overlay_video_url} controls autoPlay playsInline style={{width:"100%",maxHeight:"60vh",objectFit:"contain"}}/></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid var(--sbr)"}}><div style={{display:"flex",alignItems:"center",gap:12}}><a href={((viewModal.export_url||viewModal.overlay_video_url)||"").replace("/upload/","/upload/fl_attachment/")} download style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--sa)",color:"#fff",fontWeight:700,fontSize:13,padding:"8px 16px",borderRadius:99,textDecoration:"none"}}><Download size={14}/>Download</a></div><button onClick={()=>{setViewModal(null);setDeleteConfirm(viewModal.id);}} style={{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"1px solid rgba(239,68,68,0.3)",color:"#ef4444",fontWeight:600,fontSize:12,padding:"6px 14px",borderRadius:99,cursor:"pointer"}}><Trash2 size={13}/>Delete</button></div></div></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
      {remixes.map(r=>{
        const dl=r.export_url||r.overlay_video_url;
        let thumb:string|null=null;
        if(dl?.includes("cloudinary.com")&&dl.includes("/video/upload/"))thumb=dl.replace("/video/upload/","/video/upload/so_1,w_500,h_280,c_fill,f_jpg/").replace(/\.(mp4|mov|webm)$/i,".jpg");
        return<div key={r.id} style={{borderRadius:12,border:"1px solid var(--sbr)",overflow:"hidden",background:"rgba(255,255,255,0.02)",cursor:"pointer",transition:"all 0.2s",position:"relative"}} onClick={()=>setViewModal(r)}><div style={{aspectRatio:"16/9",position:"relative",background:"#000"}}>{thumb?<img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={32} color="rgba(255,255,255,0.1)"/></div>}<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}} className="group-hover-show"><div style={{width:48,height:48,borderRadius:"50%",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}}><Play size={20} color="#fff" style={{marginLeft:2}}/></div></div></div><div style={{padding:12}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:700,color:"#7c3aed",background:"rgba(124,58,237,0.15)",padding:"2px 8px",borderRadius:99}}>Video Remix</span><span style={{fontSize:10,fontWeight:700,color:"#0891b2",background:"rgba(8,145,178,0.15)",padding:"2px 8px",borderRadius:99}}>MP4</span></div><button onClick={e=>{e.stopPropagation();setDeleteConfirm(r.id);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,opacity:0.4,transition:"opacity 0.2s"}} onMouseEnter={e=>(e.currentTarget.style.opacity="1")} onMouseLeave={e=>(e.currentTarget.style.opacity="0.4")}><Trash2 size={14} color="#ef4444"/></button></div><p style={{fontSize:11,color:"var(--std)",margin:"8px 0 0"}}>{new Date(r.created_at).toLocaleDateString()}</p><div style={{display:"flex",alignItems:"center",gap:12,marginTop:8,paddingTop:8,borderTop:"1px solid var(--sbr)"}}><span style={{fontSize:11,fontWeight:600,color:"var(--sa)"}}>Watch</span><a href={dl?.includes("/upload/")?dl.replace("/upload/","/upload/fl_attachment/"):dl} download onClick={e=>e.stopPropagation()} style={{fontSize:11,fontWeight:600,color:"var(--std)",textDecoration:"none"}}>Download</a></div></div></div>;
      })}
    </div>
  </>;
}

export default function DesignStudioV2(){
  const[activeTab,setActiveTab]=useState("video-remix");
  const[leftPanel,setLeftPanel]=useState("templates");
  const[selectedTemplate,setSelectedTemplate]=useState("just-listed");
  const[selectedSize,setSelectedSize]=useState("square");
  const[zoom,setZoom]=useState(100);
  const[selectedPropertyId,setSelectedPropertyId]=useState<string|null>(null);
  const[userProperties,setUserProperties]=useState<any[]>([]);
  // Shared
  const[listingPhoto,setListingPhoto]=useState<string|null>(null);
  const[headshot,setHeadshot]=useState<string|null>(null);
  const[logo,setLogo]=useState<string|null>(null);
  const[address,setAddress]=useState("");const[addressLine2,setAddressLine2]=useState("");
  const[beds,setBeds]=useState("");const[baths,setBaths]=useState("");const[sqft,setSqft]=useState("");const[price,setPrice]=useState("");
  const[date,setDate]=useState("");const[time,setTime]=useState("");
  const[agentName,setAgentName]=useState("");const[phone,setPhone]=useState("");
  const[agentEmail,setAgentEmail]=useState("");const[brokerage,setBrokerage]=useState("");
  const[barColor,setBarColor]=useState("#111827");const[accentColor,setAccentColor]=useState("");const[fontId,setFontId]=useState("sans");
  const[savedCompanyColors,setSavedCompanyColors]=useState<string[]>([]);
  // Media
  const[mediaMode,setMediaMode]=useState<"image"|"video">("image");
  const[selectedVideo,setSelectedVideo]=useState<any>(null);
  const[overlayMusic,setOverlayMusic]=useState("");const[musicExpanded,setMusicExpanded]=useState(false);
  const[musicTracks,setMusicTracks]=useState<any[]>([]);const[loadingMusic,setLoadingMusic]=useState(false);
  const[vibeFilter,setVibeFilter]=useState("");const[playingTrackId,setPlayingTrackId]=useState<string|null>(null);
  const[selectedMusicTrack,setSelectedMusicTrack]=useState<{id:string;url:string;name:string}|null>(null);
  const[musicVibeFilter,setMusicVibeFilter]=useState("");
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const[userVideos,setUserVideos]=useState<any[]>([]);const[loadingVideos,setLoadingVideos]=useState(false);
  // Yard sign
  const[yardDesign,setYardDesign]=useState("split-bar");const[yardSignSize,setYardSignSize]=useState("18x24");
  const[yardHeaderText,setYardHeaderText]=useState("FOR SALE");
  const[yardTopColor,setYardTopColor]=useState("#dc1c2e");const[yardBottomColor,setYardBottomColor]=useState("#003da5");
  const[yardSidebarColor,setYardSidebarColor]=useState("#1c1c1c");const[yardMainBgColor,setYardMainBgColor]=useState("#ffffff");
  const[yardWebsite,setYardWebsite]=useState("");const[yardOfficeName,setYardOfficeName]=useState("");const[yardOfficePhone,setYardOfficePhone]=useState("");
  const[yardBullet1,setYardBullet1]=useState("");const[yardBullet2,setYardBullet2]=useState("");const[yardBullet3,setYardBullet3]=useState("");
  // PDF
  const[pdfAddress,setPdfAddress]=useState("");const[pdfCityStateZip,setPdfCityStateZip]=useState("");
  const[pdfPrice,setPdfPrice]=useState("");const[pdfBeds,setPdfBeds]=useState("");const[pdfBaths,setPdfBaths]=useState("");const[pdfSqft,setPdfSqft]=useState("");
  const[pdfDescription,setPdfDescription]=useState("");const[pdfFeatures,setPdfFeatures]=useState("");
  const[pdfPhotos,setPdfPhotos]=useState<string[]>([]);const[pdfPreviewPage,setPdfPreviewPage]=useState(0);const[pdfAccentColor,setPdfAccentColor]=useState("#0e7490");
  // Branding
  const[brandHeadshot,setBrandHeadshot]=useState<string|null>(null);const[brandLogo,setBrandLogo]=useState<string|null>(null);
  const[brandBgPhoto,setBrandBgPhoto]=useState<string|null>(null);
  const[brandAgentName,setBrandAgentName]=useState("");const[brandPhone,setBrandPhone]=useState("");
  const[brandEmail,setBrandEmail]=useState("");const[brandBrokerage,setBrandBrokerage]=useState("");
  const[brandTagline,setBrandTagline]=useState("");const[brandWebsite,setBrandWebsite]=useState("");
  const[brandAddress,setBrandAddress]=useState("");const[brandCityState,setBrandCityState]=useState("");
  const[brandPrice,setBrandPrice]=useState("");const[brandFeatures,setBrandFeatures]=useState("");
  const[brandBgColor,setBrandBgColor]=useState("#14532d");const[brandAccentColor,setBrandAccentColor]=useState("");
  const[brandOrientation,setBrandOrientation]=useState("landscape");const[brandFont,setBrandFont]=useState("serif");
  // ── Listing Flyer ──
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
  // Video Remix
  const[remixClips,setRemixClips]=useState<RemixClip[]>([]);
  const[remixSize,setRemixSize]=useState("landscape");
  const[remixBranding,setRemixBranding]=useState(true);
  const[expandedClipId,setExpandedClipId]=useState<string|null>(null);
  const[remixClipSources,setRemixClipSources]=useState<{orderId:string;address:string;date:string;clips:{url:string;thumbnail:string|null;label:string}[]}[]>([]);
  const[loadingRemixClips,setLoadingRemixClips]=useState(false);
  const[isLensSubscriber,setIsLensSubscriber]=useState(false);
  const[savedBrandingCardUrl,setSavedBrandingCardUrl]=useState<string|null>(null);
  const[hasVideoOrders,setHasVideoOrders]=useState<boolean|null>(null);
  const[remixPlaying,setRemixPlaying]=useState(false);
  const[remixPlayingIdx,setRemixPlayingIdx]=useState(0);
  const[remixPlaybackTime,setRemixPlaybackTime]=useState(0);
  const remixVideosRef=useRef<Map<string,HTMLVideoElement>>(new Map());
  const remixTimerRef=useRef<number|null>(null);
  const remixTimeRef=useRef(0);
  const remixIdxRef=useRef(0);
  const remixDragging=useRef(false);
  // UI
  const[exporting,setExporting]=useState(false);const[exportProgress,setExportProgress]=useState(0);const[exportStatus,setExportStatus]=useState("");const[showRight,setShowRight]=useState(true);const[notification,setNotification]=useState<string|null>(null);
  const[theme,setTheme]=useState<"dark"|"light">("dark");
  const[mobilePanel,setMobilePanel]=useState<string|null>(null);
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

  useEffect(()=>{setLeftPanel(currentPanels[0].id);if(activeTab==="video-remix")loadUserVideos();},[activeTab]);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const params=new URLSearchParams(window.location.search);
    const tpl=params.get("template");const pid=params.get("propertyId");
    if(tpl==="listing_flyer")setActiveTab("listing-flyer");
    if(pid)setSelectedPropertyId(pid);
  },[]);

  // Load profile + properties + subscription status
  useEffect(()=>{
    (async()=>{
      try{
        const supabase=(await import("@/lib/supabase/client")).createClient();
        const{data:{user}}=await supabase.auth.getUser();if(!user)return;
        // Subscription check — same as hero: admin emails + lens_usage.is_subscriber
        const ADMIN_EMAILS=["realestatephoto2video@gmail.com"];
        if(user.email&&ADMIN_EMAILS.includes(user.email)){setIsLensSubscriber(true);}
        else{const{data:usageCheck}=await supabase.from("lens_usage").select("is_subscriber").eq("user_id",user.id).single();if(usageCheck?.is_subscriber)setIsLensSubscriber(true);}
        const{data}=await supabase.from("lens_usage").select("saved_headshot_url,saved_logo_url,saved_agent_name,saved_phone,saved_email,saved_company,saved_website,saved_company_colors,saved_branding_cards").eq("user_id",user.id).single();
        if(data){
          if(data.saved_headshot_url){setHeadshot(data.saved_headshot_url);setBrandHeadshot(data.saved_headshot_url);}
          if(data.saved_logo_url){setLogo(data.saved_logo_url);setBrandLogo(data.saved_logo_url);}
          if(data.saved_agent_name){setAgentName(data.saved_agent_name);setBrandAgentName(data.saved_agent_name);}
          if(data.saved_phone){setPhone(data.saved_phone);setBrandPhone(data.saved_phone);}
          if(data.saved_email){setAgentEmail(data.saved_email);setBrandEmail(data.saved_email);}
          if(data.saved_company){setBrokerage(data.saved_company);setBrandBrokerage(data.saved_company);}
          if(data.saved_website){setBrandWebsite(data.saved_website);}
          // Load first saved branding card
          const bc=Array.isArray(data.saved_branding_cards)&&data.saved_branding_cards.length>0?data.saved_branding_cards[0]:null;
          if(bc)setSavedBrandingCardUrl(bc);
          const cc = Array.isArray(data.saved_company_colors) ? data.saved_company_colors : [];
          setSavedCompanyColors(cc);
          if(cc.length >= 1){setBarColor(cc[0]);setFlyerAccentColor(cc[0]);setBrandBgColor(cc[0]);setYardTopColor(cc[0]);setYardSidebarColor(cc[0]);setPdfAccentColor(cc[0]);}
          if(cc.length >= 2){setAccentColor(cc[1]);setBrandAccentColor(cc[1]);setYardBottomColor(cc[1]);}
          // Also check design_exports for branding cards if none saved in profile
          if(!bc){
            const{data:bcExports}=await supabase.from("design_exports").select("export_url").eq("user_id",user.id).in("template_type",["branding_card","branding-card"]).order("created_at",{ascending:false}).limit(1);
            if(bcExports&&bcExports.length>0&&bcExports[0].export_url)setSavedBrandingCardUrl(bcExports[0].export_url);
          }
        }
        const{data:props}=await supabase.from("agent_properties").select("id,address,address_normalized,city,state,bedrooms,bathrooms,sqft,price,special_features,amenities,website_slug,website_published,website_curated").eq("user_id",user.id).is("merged_into_id",null).order("updated_at",{ascending:false});
        if(props)setUserProperties(props);
        if(selectedPropertyId){const prop=(props||[]).find((p:any)=>p.id===selectedPropertyId);if(prop)_fillFlyerFromProperty(prop,user.id,supabase);}
      }catch(err){console.error("Profile load error:",err);}
    })();
  },[]);

  const _fillFlyerFromProperty=async(prop:any,userId:string,supabase:any)=>{
    setFlyerAddress(prop.address||"");
    const cs=[prop.city,prop.state].filter(Boolean).join(", ");
    setFlyerCityState(cs);
    if(prop.bedrooms)setFlyerBeds(String(prop.bedrooms));
    if(prop.bathrooms)setFlyerBaths(String(prop.bathrooms));
    if(prop.sqft)setFlyerSqft(String(prop.sqft));
    if(prop.price)setFlyerPrice(String(prop.price));
    if(prop.amenities?.length)setFlyerAmenities(prop.amenities);
    let photos:string[]=[];
    const curated=prop.website_curated?.photos||[];
    if(curated.length)photos=curated.slice(0,7);
    if(photos.length<5){
      try{
        const{data:orders}=await supabase.from("orders").select("photos").eq("user_id",userId).ilike("property_address",`%${(prop.address||"").substring(0,15)}%`);
        for(const o of(orders||[])){const urls=(o.photos||[]).map((p:any)=>p.secure_url||p.url).filter(Boolean);photos=[...photos,...urls];if(photos.length>=7)break;}
        photos=[...new Set(photos)].slice(0,7);
      }catch{}
    }
    if(photos.length)setFlyerPhotos(photos);
    if(prop.website_published&&prop.website_slug)setFlyerListingUrl(`https://${prop.website_slug}.p2v.homes`);
    try{
      const propAddr=(prop.address||"").toLowerCase().replace(/[^a-z0-9]/g,"");
      const{data:descs}=await supabase.from("lens_descriptions").select("description,property_data").eq("user_id",userId).order("created_at",{ascending:false}).limit(10);
      const match=(descs||[]).find((d:any)=>{const pd=d.property_data;if(!pd)return false;const dAddr=(pd.address||pd.property_address||"").toLowerCase().replace(/[^a-z0-9]/g,"");return dAddr&&(dAddr.includes(propAddr)||propAddr.includes(dAddr));});
      if(match?.description)setFlyerDescription(match.description);
    }catch{}
  };

  const handleSelectProperty=(id:string)=>{
    if(id==="__new__"){
      setSelectedPropertyId(null);
      setAddress("");setAddressLine2("");setBeds("");setBaths("");setSqft("");setPrice("");
      setPdfAddress("");setPdfCityStateZip("");setPdfBeds("");setPdfBaths("");setPdfSqft("");setPdfPrice("");setPdfFeatures("");
      setBrandAddress("");setBrandCityState("");setBrandPrice("");setBrandFeatures("");
      setFlyerAddress("");setFlyerCityState("");setFlyerBeds("");setFlyerBaths("");setFlyerSqft("");setFlyerPrice("");setFlyerDescription("");setFlyerAmenities([]);setFlyerPhotos([]);setFlyerListingUrl("");setFlyerVideoUrl("");setFlyerStagingUrl("");
      return;
    }
    const prop=userProperties.find((p:any)=>p.id===id);if(!prop)return;
    setSelectedPropertyId(prop.id);setAddress(prop.address||"");
    const cs=[prop.city,prop.state].filter(Boolean).join(", ");
    setAddressLine2(cs);setPdfAddress(prop.address||"");setBrandAddress(prop.address||"");setPdfCityStateZip(cs);setBrandCityState(cs);
    if(prop.bedrooms){const b=prop.bedrooms.toString();setBeds(b);setPdfBeds(b);}
    if(prop.bathrooms){const b=prop.bathrooms.toString();setBaths(b);setPdfBaths(b);}
    if(prop.sqft){const s=prop.sqft.toString();setSqft(s);setPdfSqft(s);}
    if(prop.price){const p=prop.price.toString();setPrice(p);setPdfPrice(p);setBrandPrice(p);}
    if(prop.special_features?.length>0){const features=prop.special_features.join("\n");setPdfFeatures(features);setBrandFeatures(features);}
    (async()=>{
      try{
        const supabase=(await import("@/lib/supabase/client")).createClient();
        const{data:{user:u}}=await supabase.auth.getUser();if(!u)return;
        await _fillFlyerFromProperty(prop,u.id,supabase);
        const{data:descs}=await supabase.from("lens_descriptions").select("description,property_data").eq("user_id",u.id).order("created_at",{ascending:false}).limit(10);
        const propAddr=(prop.address||"").toLowerCase().replace(/[^a-z0-9]/g,"");
        if(!propAddr||!descs||descs.length===0)return;
        const match=descs.find((d:any)=>{const pd=d.property_data;if(!pd)return false;const dAddr=(pd.address||pd.property_address||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(!dAddr)return false;return dAddr.includes(propAddr)||propAddr.includes(dAddr);});
        if(match?.description)setPdfDescription(match.description);
      }catch{}
    })();
  };

  const loadUserVideos=async()=>{
    if(userVideos.length>0)return;setLoadingVideos(true);
    try{
      const supabase=(await import("@/lib/supabase/client")).createClient();
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:orders}=await supabase.from("orders").select("order_id,delivery_url,unbranded_delivery_url,clip_urls,photos,created_at,property_address").eq("user_id",user.id).in("status",["complete","delivered","closed"]).order("created_at",{ascending:false});
      const vids=(orders||[]).filter((o:any)=>o.unbranded_delivery_url||o.delivery_url);
      setHasVideoOrders(vids.length>0);
      setUserVideos(vids.map((o:any)=>({orderId:o.order_id,url:o.unbranded_delivery_url||o.delivery_url,thumbnail:o.photos?.[0]?.secure_url||null,hasUnbranded:!!o.unbranded_delivery_url,date:new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})})));
      const sources=vids.map((o:any)=>{
        const clipData:any[]=Array.isArray(o.clip_urls)?o.clip_urls:[];
        const addr=o.property_address||"Unknown Property";
        const dt=new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"});
        const orderThumb=o.photos?.[0]?.secure_url||null;
        if(clipData.length>0){return{orderId:o.order_id,address:addr,date:dt,clips:clipData.sort((a:any,b:any)=>(a.position||0)-(b.position||0)).map((c:any)=>({url:c.url,thumbnail:c.photo_url||null,label:c.description||`Clip ${c.position||"?"}`}))};}
        return{orderId:o.order_id,address:addr,date:dt,clips:[{url:o.unbranded_delivery_url||o.delivery_url,thumbnail:orderThumb,label:"Full Video"}]};
      });
      setRemixClipSources(sources);
    }catch(err){console.error("Video load error:",err);}
    setLoadingVideos(false);
  };

  const VIBES=[{key:"",label:"All"},{key:"upbeat_modern",label:"Upbeat"},{key:"chill_tropical",label:"Chill"},{key:"energetic_pop",label:"Energetic"},{key:"elegant_classical",label:"Elegant"},{key:"warm_acoustic",label:"Acoustic"},{key:"bold_cinematic",label:"Cinematic"},{key:"smooth_jazz",label:"Jazz"},{key:"ambient",label:"Ambient"}];
  const fetchMusicTracks=async(vibe:string="")=>{setLoadingMusic(true);try{const resp=await fetch(`/api/generate-music?library=true&vibe=${vibe}`);const data=await resp.json();setMusicTracks(data.tracks||[]);}catch(e){console.error(e);}setLoadingMusic(false);};
  const handlePlayTrack=(trackId:string,url:string)=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}if(playingTrackId===trackId){setPlayingTrackId(null);return;}const audio=new Audio(url);audio.play().catch(()=>{});audio.onended=()=>setPlayingTrackId(null);audioRef.current=audio;setPlayingTrackId(trackId);};
  useEffect(()=>{return()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}};},[]);

  const notify=(msg:string)=>{setNotification(msg);setTimeout(()=>setNotification(null),3000);};

  // ─── Remix helpers ───────────────────────────────────────────────────────
  const addClipToRemix=(sourceUrl:string,thumbnail:string|null,label:string)=>{
    const clipId=String(Date.now())+Math.random().toString(36).slice(2,6);
    // Probe actual duration
    const probe=document.createElement("video");
    probe.preload="metadata";probe.muted=true;probe.src=sourceUrl;
    probe.onloadedmetadata=()=>{
      const dur=probe.duration&&isFinite(probe.duration)?probe.duration:6;
      setRemixClips(prev=>{
        const existing=prev.find(c=>c.id===clipId);
        if(existing)return prev.map(c=>c.id===clipId?{...c,duration:dur,trimEnd:dur}:c);
        return[...prev,{id:clipId,sourceUrl,thumbnail,label,duration:dur,trimStart:0,trimEnd:dur,speed:1,order:prev.length}];
      });
      probe.remove();
    };
    probe.onerror=()=>{
      setRemixClips(prev=>{
        if(prev.find(c=>c.id===clipId))return prev;
        return[...prev,{id:clipId,sourceUrl,thumbnail,label,duration:6,trimStart:0,trimEnd:6,speed:1,order:prev.length}];
      });
      probe.remove();
    };
    // Add immediately with placeholder duration, update when metadata loads
    setRemixClips(prev=>[...prev,{id:clipId,sourceUrl,thumbnail,label,duration:6,trimStart:0,trimEnd:6,speed:1,order:prev.length}]);
  };
  const removeClipFromRemix=(id:string)=>setRemixClips(prev=>prev.filter(c=>c.id!==id).map((c,i)=>({...c,order:i})));
  const moveClipInRemix=(id:string,dir:-1|1)=>{
    setRemixClips(prev=>{
      const idx=prev.findIndex(c=>c.id===id);if(idx<0)return prev;
      const ni=idx+dir;if(ni<0||ni>=prev.length)return prev;
      const a=[...prev];[a[idx],a[ni]]=[a[ni],a[idx]];
      return a.map((c,i)=>({...c,order:i}));
    });
  };
  const updateRemixClip=(id:string,updates:Partial<RemixClip>)=>setRemixClips(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));
  const remixTotalDuration=remixClips.reduce((sum,c)=>sum+(c.trimEnd-c.trimStart)/c.speed,0);
  const isClipOnTimeline=(url:string)=>remixClips.some(c=>c.sourceUrl===url);

  const remixClipDurations=remixClips.map(c=>(c.trimEnd-c.trimStart)/c.speed);
  const remixClipStarts=remixClipDurations.reduce<number[]>((acc,d,i)=>{acc.push(i===0?0:acc[i-1]+remixClipDurations[i-1]);return acc;},[]);

  const idxForTime=(t:number)=>{let idx=0;for(let i=0;i<remixClips.length;i++){if(t>=remixClipStarts[i])idx=i;}return idx;};

  const syncVideoToTime=(t:number,shouldPlay:boolean)=>{
    const idx=idxForTime(t);
    const clip=remixClips[idx];if(!clip)return;
    const localT=(t-remixClipStarts[idx])*clip.speed+clip.trimStart;
    remixVideosRef.current.forEach((v,id)=>{
      if(id===clip.id){
        v.style.opacity="1";v.style.zIndex="2";
        v.playbackRate=clip.speed;
        if(v.readyState>=2){v.currentTime=localT;if(shouldPlay&&v.paused)v.play().catch(()=>{});}
        else{const h=()=>{v.currentTime=localT;if(shouldPlay)v.play().catch(()=>{});v.removeEventListener("canplay",h);};v.addEventListener("canplay",h);}
      }else{v.style.opacity="0";v.style.zIndex="1";if(!v.paused)v.pause();}
    });
    if(idx!==remixIdxRef.current){remixIdxRef.current=idx;setRemixPlayingIdx(idx);}
  };

  const startRemixPlayback=()=>{
    if(remixClips.length===0)return;
    const t=remixTimeRef.current;
    if(t>=remixTotalDuration){remixTimeRef.current=0;setRemixPlaybackTime(0);}
    setRemixPlaying(true);
    syncVideoToTime(remixTimeRef.current,true);
    if(remixTimerRef.current)cancelAnimationFrame(remixTimerRef.current);
    let lastT=performance.now();const total=remixTotalDuration;
    const tick=()=>{
      const now=performance.now();const dt=(now-lastT)/1000;lastT=now;
      if(remixDragging.current){remixTimerRef.current=requestAnimationFrame(tick);return;}
      remixTimeRef.current+=dt;
      const t=remixTimeRef.current;
      if(t>=total){remixTimeRef.current=total;setRemixPlaybackTime(total);stopRemixPlayback();return;}
      const newIdx=idxForTime(t);
      if(newIdx!==remixIdxRef.current)syncVideoToTime(t,true);
      setRemixPlaybackTime(t);
      remixTimerRef.current=requestAnimationFrame(tick);
    };
    remixTimerRef.current=requestAnimationFrame(tick);
  };

  const stopRemixPlayback=()=>{
    setRemixPlaying(false);
    if(remixTimerRef.current){cancelAnimationFrame(remixTimerRef.current);remixTimerRef.current=null;}
    remixVideosRef.current.forEach(v=>{if(!v.paused)v.pause();});
  };

  const seekRemixTo=(t:number)=>{
    const clamped=Math.max(0,Math.min(t,remixTotalDuration));
    remixTimeRef.current=clamped;setRemixPlaybackTime(clamped);
    syncVideoToTime(clamped,remixPlaying);
  };

  const toggleRemixPlayback=()=>{if(remixPlaying)stopRemixPlayback();else startRemixPlayback();};

  useEffect(()=>{return()=>{if(remixTimerRef.current)cancelAnimationFrame(remixTimerRef.current);};},[]);
  // When clips change, reset playback
  useEffect(()=>{remixTimeRef.current=0;setRemixPlaybackTime(0);remixIdxRef.current=0;setRemixPlayingIdx(0);if(remixPlaying)stopRemixPlayback();},[remixClips.length]);

  // ─── Export helpers ───────────────────────────────────────────────────────
  const prepareForExport = (el: HTMLElement): { restore: () => void } => {
    const parent = el.parentElement as HTMLElement;
    const st = el.style.transform, so = parent?.style.overflow, sw = parent?.style.width, sh = parent?.style.height;
    el.style.transform = "none";
    if (parent) { parent.style.overflow = "visible"; parent.style.width = `${rawW}px`; parent.style.height = `${rawH}px`; }
    return { restore: () => { el.style.transform = st; if (parent) { parent.style.overflow = so || ""; parent.style.width = sw || ""; parent.style.height = sh || ""; } } };
  };

  const exportImage = async () => {
    if (!previewRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
    if (!el) return;
    const { restore } = prepareForExport(el);
    const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: rawW, height: rawH });
    restore();
    const link = document.createElement("a");
    link.download = `listing-${selectedTemplate}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    notify("Image exported!");
  };

  const exportPdf = async () => {
    if (!previewRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
    const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
    if (!el) return;
    const { restore } = prepareForExport(el);
    const canvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: rawW, height: rawH });
    restore();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 8.5, 11);
    pdf.save(`listing-flyer-${Date.now()}.pdf`);
    notify("PDF exported!");
  };

  const getMusicSource = (): { type: "url"; url: string } | { type: "file"; file: File } | null => {
    if (selectedMusicTrack) return { type: "url", url: selectedMusicTrack.url };
    return null;
  };

  const exportVideo = async () => {
    if (!selectedVideo?.url || !previewRef.current) { notify("Please select a video first."); return; }
    setExporting(true); setExportProgress(0);
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL, fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => setExportProgress(Math.min(Math.round(p * 100), 99)));
      setExportProgress(2);
      const coreBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({ coreURL: await toBlobURL(`${coreBase}/ffmpeg-core.js`, "text/javascript"), wasmURL: await toBlobURL(`${coreBase}/ffmpeg-core.wasm`, "application/wasm") });
      setExportProgress(5);
      const vr=await fetch(selectedVideo.url);const videoData = new Uint8Array(await vr.arrayBuffer());
      await ffmpeg.writeFile("input.mp4", videoData);
      const musicSource = getMusicSource();
      let hasMusic = false;
      if (musicSource) {
        setExportProgress(8);
        if (musicSource.type === "url") { const mr2=await fetch(musicSource.url);await ffmpeg.writeFile("music.mp3", new Uint8Array(await mr2.arrayBuffer())); hasMusic = true; }
        else { await ffmpeg.writeFile("music.mp3", new Uint8Array(await musicSource.file.arrayBuffer())); hasMusic = true; }
      }
      setExportProgress(10);
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = previewRef.current.querySelector("[data-export-target]") as HTMLElement;
      if (!el) throw new Error("Export target not found");
      const videoEls = el.querySelectorAll("video");
      videoEls.forEach(v => { (v as HTMLElement).style.opacity = "0"; });
      const placeholders = el.querySelectorAll("[data-video-area]");
      placeholders.forEach(p => { (p as HTMLElement).style.opacity = "0"; });
      const { restore } = prepareForExport(el);
      const overlayCanvas = await html2canvas(el, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, width: rawW, height: rawH });
      restore();
      videoEls.forEach(v => { (v as HTMLElement).style.opacity = "1"; });
      placeholders.forEach(p => { (p as HTMLElement).style.opacity = "1"; });
      const overlayBlob = await new Promise<Blob>(resolve => overlayCanvas.toBlob(b => resolve(b!), "image/png"));
      await ffmpeg.writeFile("overlay.png", new Uint8Array(await overlayBlob.arrayBuffer()));
      setExportProgress(15);
      const outW = currentSize.width, outH = currentSize.height;
      const photoPercent = selectedTemplate === "open-house" ? 100 : selectedSize === "postcard" ? 55 : 58;
      const photoH = Math.round(outH * photoPercent / 100);
      if (hasMusic) {
        await ffmpeg.exec(["-i","input.mp4","-i","overlay.png","-i","music.mp3","-t","119","-filter_complex",`[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0[vout];[0:a]volume=0.3[orig];[2:a]volume=0.85,atrim=0:119,apad[mus];[orig][mus]amix=inputs=2:duration=shortest[aout]`,"-map","[vout]","-map","[aout]","-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart","-y","output.mp4"]);
      } else {
        await ffmpeg.exec(["-i","input.mp4","-i","overlay.png","-t","119","-filter_complex",`[0:v]scale=${outW}:${photoH}:force_original_aspect_ratio=increase,crop=${outW}:${photoH},pad=${outW}:${outH}:0:0:black[bg];[bg][1:v]overlay=0:0`,"-c:v","libx264","-preset","fast","-crf","23","-c:a","aac","-b:a","128k","-movflags","+faststart","-y","output.mp4"]);
      }
      setExportProgress(95);
      const outputData = await ffmpeg.readFile("output.mp4");
      const outputBlob = new Blob([outputData], { type: "video/mp4" });
      const downloadUrl = URL.createObjectURL(outputBlob);
      const link = document.createElement("a"); link.download = `listing-video-${Date.now()}.mp4`; link.href = downloadUrl; link.click();
      URL.revokeObjectURL(downloadUrl);
      setExportProgress(100); notify("Video exported!");
      setTimeout(() => { setExportProgress(0); setExporting(false); }, 1500); return;
    } catch (err: any) { console.error("Video export error:", err); notify("Video export failed: " + (err.message || "Unknown error")); }
    setExportProgress(0); setExporting(false);
  };

  const exportRemix = async () => {
    if(remixClips.length===0){notify("Add clips to the timeline first.");return;}
    setExporting(true);setExportProgress(0);setExportStatus("Loading video encoder...");
    try{
      console.log("[remix] Starting export...");
      const{FFmpeg}=await import("@ffmpeg/ffmpeg");
      const{toBlobURL}=await import("@ffmpeg/util");
      const ffmpeg=new FFmpeg();
      ffmpeg.on("log",({message})=>{console.log("[ffmpeg]",message);});
      ffmpeg.on("progress",({progress:p})=>{if(p>0)setExportProgress(Math.min(40+Math.round(p*50),95));});
      setExportProgress(2);setExportStatus("Downloading FFmpeg engine...");
      const coreBase="https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      const coreJS=await toBlobURL(`${coreBase}/ffmpeg-core.js`,"text/javascript");
      setExportProgress(3);
      const coreWASM=await toBlobURL(`${coreBase}/ffmpeg-core.wasm`,"application/wasm");
      setExportProgress(5);setExportStatus("Initializing FFmpeg...");
      await ffmpeg.load({coreURL:coreJS,wasmURL:coreWASM});
      console.log("[remix] FFmpeg loaded");
      setExportProgress(8);
      const outW=currentRemixSize.width,outH=currentRemixSize.height;

      // Download clips via proxy to bypass CORS
      for(let i=0;i<remixClips.length;i++){
        setExportStatus(`Downloading clip ${i+1} of ${remixClips.length}...`);
        setExportProgress(8+Math.round((i/remixClips.length)*20));
        const clipUrl=remixClips[i].sourceUrl;
        console.log(`[remix] Downloading clip ${i+1}: ${clipUrl.slice(0,80)}...`);
        const proxyUrl=`/api/proxy-media?url=${encodeURIComponent(clipUrl)}`;
        const resp=await fetch(proxyUrl);
        if(!resp.ok)throw new Error(`Failed to download clip ${i+1}: HTTP ${resp.status}`);
        const ab=await resp.arrayBuffer();
        console.log(`[remix] Clip ${i+1}: ${ab.byteLength} bytes`);
        if(ab.byteLength<1000)throw new Error(`Clip ${i+1} is only ${ab.byteLength} bytes`);
        await ffmpeg.writeFile(`clip_${i}.mp4`,new Uint8Array(ab));
      }

      // Download music via proxy
      setExportProgress(28);
      const musicSource=getMusicSource();
      let hasMusic=false;
      if(musicSource){
        setExportStatus("Loading music...");
        console.log("[remix] Downloading music...");
        if(musicSource.type==="url"){
          const mResp=await fetch(`/api/proxy-media?url=${encodeURIComponent(musicSource.url)}`);
          if(mResp.ok){const mab=await mResp.arrayBuffer();await ffmpeg.writeFile("music.mp3",new Uint8Array(mab));hasMusic=true;console.log(`[remix] Music: ${mab.byteLength} bytes`);}
        }else{await ffmpeg.writeFile("music.mp3",new Uint8Array(await musicSource.file.arrayBuffer()));hasMusic=true;}
      }

      // Use saved branding card from profile/exports — skip html2canvas entirely
      let hasBranding=false;
      let brandPngReady=false;
      if(remixBranding&&isLensSubscriber&&savedBrandingCardUrl){
        setExportStatus("Loading branding card...");
        console.log("[remix] Loading saved branding card:",savedBrandingCardUrl.slice(0,80));
        try{
          const brandResp=await fetch(`/api/proxy-media?url=${encodeURIComponent(savedBrandingCardUrl)}`);
          if(brandResp.ok){
            const brandAb=await brandResp.arrayBuffer();
            if(brandAb.byteLength>1000){
              await ffmpeg.writeFile("brand.png",new Uint8Array(brandAb));
              hasBranding=true;brandPngReady=true;
              console.log(`[remix] Branding card loaded: ${brandAb.byteLength} bytes`);
            }else{console.error("[remix] Branding card too small:",brandAb.byteLength);}
          }
        }catch(e){console.error("[remix] Branding card download error:",e);}
      }else if(remixBranding&&isLensSubscriber){
        console.log("[remix] No saved branding card URL found — skipping branding");
      }

      // Build FFmpeg command
      setExportProgress(32);setExportStatus("Building video...");
      console.log("[remix] Building filter_complex...");
      const filterParts:string[]=[];
      const concatInputs:string[]=[];
      let inputIdx=0;
      const inputArgs:string[]=[];

      // Branding intro: card with drop shadow on 20% opacity first frame, cross dissolve into clip 1
      if(hasBranding){
        inputArgs.push("-loop","1","-t","6","-framerate","24","-i","brand.png");
        inputArgs.push("-i","clip_0.mp4");
        const introCardW=Math.round(outW*0.7);const introCardH=Math.round(outH*0.7);
        const introX=Math.round((outW-introCardW)/2);
        const introY=Math.round((outH-introCardH)/2+outH*0.04);
        const shX=introX+6;const shY=introY+8;
        filterParts.push(
          `[${inputIdx+1}:v]trim=start=0:end=0.042,setpts=PTS-STARTPTS,scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},loop=144:1:0,setpts=PTS-STARTPTS,lutyuv=y=val*0.2:u=128:v=128,format=yuv420p[bg_intro]`,
          `[${inputIdx}:v]scale=${introCardW}:${introCardH},eq=brightness=-1:contrast=0,gblur=sigma=12,format=yuv420p[shadow_intro]`,
          `[bg_intro][shadow_intro]overlay=${shX}:${shY},format=yuv420p[bg_sh_intro]`,
          `[${inputIdx}:v]scale=${introCardW}:${introCardH},format=yuv420p[card_intro]`,
          `[bg_sh_intro][card_intro]overlay=${introX}:${introY},format=yuv420p[vintro_raw]`
        );
        inputIdx+=2;
      }

      // All clips — trim + scale + crop
      for(let i=0;i<remixClips.length;i++){
        inputArgs.push("-i",`clip_${i}.mp4`);
        const c=remixClips[i];
        const speed=c.speed!==1?`,setpts=${(1/c.speed).toFixed(4)}*PTS`:"";
        filterParts.push(`[${inputIdx}:v]trim=start=${c.trimStart}:end=${c.trimEnd},setpts=PTS-STARTPTS,scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},format=yuv420p${speed}[v${i}]`);
        inputIdx++;
      }

      // Cross dissolve from intro into first clip (1s transition)
      if(hasBranding){
        filterParts.push(`[vintro_raw][v0]xfade=transition=fade:duration=1:offset=5[v0x]`);
        concatInputs.push("[v0x]");
        for(let i=1;i<remixClips.length;i++)concatInputs.push(`[v${i}]`);
      }else{
        for(let i=0;i<remixClips.length;i++)concatInputs.push(`[v${i}]`);
      }

      // Branding outro: card with drop shadow on 20% opacity last frame
      if(hasBranding){
        const lastClipIdx=remixClips.length-1;
        inputArgs.push("-loop","1","-t","5","-framerate","24","-i","brand.png");
        inputArgs.push("-i",`clip_${lastClipIdx}.mp4`);
        const lastClip=remixClips[lastClipIdx];
        const outroTrimStart=Math.max(0,lastClip.trimEnd-0.042);
        const outroCardW=Math.round(outW*0.85);const outroCardH=Math.round(outH*0.85);
        const outroX=Math.round((outW-outroCardW)/2);
        const outroY=Math.round((outH-outroCardH)/2+outH*0.03);
        const oshX=outroX+6;const oshY=outroY+8;
        filterParts.push(
          `[${inputIdx+1}:v]trim=start=${outroTrimStart}:end=${lastClip.trimEnd},setpts=PTS-STARTPTS,scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},loop=120:1:0,setpts=PTS-STARTPTS,lutyuv=y=val*0.2:u=128:v=128,format=yuv420p[bg_outro]`,
          `[${inputIdx}:v]scale=${outroCardW}:${outroCardH},eq=brightness=-1:contrast=0,gblur=sigma=12,format=yuv420p[shadow_outro]`,
          `[bg_outro][shadow_outro]overlay=${oshX}:${oshY},format=yuv420p[bg_sh_outro]`,
          `[${inputIdx}:v]scale=${outroCardW}:${outroCardH},format=yuv420p[card_outro]`,
          `[bg_sh_outro][card_outro]overlay=${outroX}:${outroY},format=yuv420p[voutro]`
        );
        concatInputs.push("[voutro]");inputIdx+=2;
      }

      // Concat
      const nSegments=concatInputs.length;
      filterParts.push(`${concatInputs.join("")}concat=n=${nSegments}:v=1:a=0[vout]`);
      const totalDur=remixTotalDuration+(hasBranding?10:0);
      let filterStr=filterParts.join(";");

      const cmdArgs=[...inputArgs];
      if(hasMusic){
        cmdArgs.push("-i","music.mp3");
        filterStr+=`;[${inputIdx}:a]volume=0.85,atrim=0:${Math.ceil(totalDur)},apad,afade=t=out:st=${Math.max(0,totalDur-3)}:d=3[aout]`;
        cmdArgs.push("-filter_complex",filterStr,"-map","[vout]","-map","[aout]");
      }else{
        cmdArgs.push("-filter_complex",filterStr,"-map","[vout]");
      }
      cmdArgs.push("-c:v","libx264","-preset","ultrafast","-crf","28","-pix_fmt","yuv420p","-r","24","-vsync","cfr","-c:a","aac","-b:a","128k","-movflags","+faststart","-t",String(Math.ceil(totalDur)),"-y","output.mp4");

      console.log("[remix] Executing FFmpeg...");
      console.log("[remix] filter:",filterStr);
      setExportProgress(35);setExportStatus("Encoding video... this may take a minute");
      await ffmpeg.exec(cmdArgs);
      console.log("[remix] FFmpeg done");

      setExportProgress(90);setExportStatus("Reading output...");
      const outputData=await ffmpeg.readFile("output.mp4");
      const outputBlob=new Blob([outputData],{type:"video/mp4"});
      console.log(`[remix] Output: ${outputBlob.size} bytes`);

      // Upload to Cloudinary
      setExportProgress(92);setExportStatus("Uploading to cloud...");
      let cloudinaryUrl:string|null=null;
      try{
        const sigResp=await fetch("/api/cloudinary-signature",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({folder:"photo2video/remix-exports"})});
        const sigData=await sigResp.json();
        if(sigData.success){
          const{signature,timestamp,cloudName,apiKey,folder:folderPath}=sigData.data;
          const fd=new FormData();fd.append("file",outputBlob,`remix-${Date.now()}.mp4`);fd.append("api_key",apiKey);fd.append("timestamp",timestamp.toString());fd.append("signature",signature);fd.append("folder",folderPath);fd.append("resource_type","video");
          const upResp=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,{method:"POST",body:fd});
          const upResult=await upResp.json();
          cloudinaryUrl=upResult.secure_url||null;
          console.log("[remix] Uploaded:",cloudinaryUrl);
        }
      }catch(e){console.error("[remix] Upload error:",e);}

      // Save to DB
      if(cloudinaryUrl){
        setExportStatus("Saving...");
        try{
          const supabase=(await import("@/lib/supabase/client")).createClient();
          const{data:{user}}=await supabase.auth.getUser();
          if(user)await saveExportWithOverwrite(supabase,user.id,selectedPropertyId||null,`video_remix_${remixSize}`,cloudinaryUrl,{export_format:"mp4",overlay_video_url:cloudinaryUrl});
          console.log("[remix] Saved to DB");
        }catch(e){console.error("[remix] DB error:",e);}
      }

      // Download locally
      setExportStatus("Downloading...");
      const downloadUrl=URL.createObjectURL(outputBlob);
      const link=document.createElement("a");link.download=`remix-${remixSize}-${Date.now()}.mp4`;link.href=downloadUrl;link.click();
      URL.revokeObjectURL(downloadUrl);
      setExportProgress(100);setExportStatus("Done!");
      notify(cloudinaryUrl?"Remix exported & saved!":"Remix exported!");
      setTimeout(()=>{setExportProgress(0);setExporting(false);setExportStatus("");},2000);return;
    }catch(err:any){
      console.error("[remix] Export error:",err);
      notify("Export failed: "+(err.message||"Unknown error"));
      setExportStatus("Failed: "+(err.message||"Unknown error"));
      setTimeout(()=>{setExportStatus("");},5000);
    }
    setExportProgress(0);setExporting(false);
  };

  const handleExport = async () => {
    // Warn mobile users about video export limitations
    if((isRemixMode||isVideoMode)&&/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){
      const proceed=window.confirm("Video encoding works best on desktop browsers. Mobile devices may run out of memory on longer videos.\n\nProceed anyway?");
      if(!proceed)return;
    }
    setExporting(true);setExportStatus("");
    try {
      if (isRemixMode) { await exportRemix(); return; }
      else if (isVideoMode) { await exportVideo(); return; }
      else { await exportImage(); }
    } catch (err: any) { console.error("Export error:", err); notify(err?.message || "Export failed. Try again."); }
    setExporting(false); setExportProgress(0); setExportStatus("");
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try { await exportPdf(); } catch (err: any) { console.error("PDF export error:", err); notify(err?.message || "PDF export failed. Try again."); }
    setExporting(false);
  };

  const pdfFLines=pdfFeatures?pdfFeatures.split("\n").filter(Boolean).length:0;
  const pdfEstFH=pdfFLines*80+(pdfFLines>0?90:0);
  const pdfMaxDL=Math.floor((1400-pdfEstFH)/60);
  const pdfDLines=pdfDescription?pdfDescription.split("\n").filter(Boolean).length:0;
  const pdfHasOverflow=pdfDLines>pdfMaxDL&&pdfMaxDL>0;
  const pdfPage2Slots=pdfHasOverflow?4:6;
  const pdfPhotosAfterP1=Math.max(0,pdfPhotos.length-3);
  const pdfTotalPages=pdfHasOverflow?2+Math.ceil(Math.max(0,pdfPhotosAfterP1-pdfPage2Slots)/6):1+Math.ceil(pdfPhotosAfterP1/6);

  const getPreviewDims=useCallback(()=>{
    let w:number,h:number;
    if(activeTab==="video-remix"){w=currentRemixSize.width;h=currentRemixSize.height;}
    else if(activeTab==="yard-sign"){w=currentYardSize.width;h=currentYardSize.height;}
    else if(activeTab==="property-pdf"){w=2550;h=3300;}
    else if(activeTab==="branding-card"){w=currentBrandOr.width;h=currentBrandOr.height;}
    else if(activeTab==="listing-flyer"){w=2550;h=3300;}
    else{w=currentSize.width;h=currentSize.height;}
    const maxW=580,maxH=560;const s=Math.min(maxW/w,maxH/h,1)*(zoom/100);
    return{scale:s,pW:w*s,pH:h*s,rawW:w,rawH:h};
  },[activeTab,currentSize,currentYardSize,currentBrandOr,currentRemixSize,zoom]);
  const{scale,pW,pH,rawW,rawH}=getPreviewDims();

  const videoPreviewEl=(mediaMode==="video"&&selectedVideo?.url)?(<div style={{width:"100%",height:"100%",position:"relative"}} data-video-area><video src={selectedVideo.url} autoPlay loop muted playsInline crossOrigin="anonymous" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>):undefined;

  const renderPreview=()=>{
    if(activeTab==="video-remix"){
      if(hasVideoOrders===false)return<div style={{width:currentRemixSize.width,height:currentRemixSize.height,backgroundColor:"#0c0c10",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:20,fontFamily:"var(--sf)",padding:40,textAlign:"center" as const}}><div style={{width:100,height:100,borderRadius:24,background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={40} color="rgba(99,102,241,0.5)"/></div><p style={{fontSize:22,color:"rgba(255,255,255,0.7)",fontWeight:700,margin:0}}>No Videos Yet</p><p style={{fontSize:14,color:"rgba(255,255,255,0.35)",margin:0,maxWidth:400,lineHeight:1.6}}>Order a listing video to unlock Video Remix. Buy the clips once, remix them forever.</p><a href="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,var(--sa),#a855f7)",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>Order a Video</a></div>;
      if(remixClips.length===0)return<div style={{width:currentRemixSize.width,height:currentRemixSize.height,backgroundColor:"#0c0c10",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:16,fontFamily:"var(--sf)"}}><div style={{width:120,height:120,borderRadius:24,border:"2px dashed rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={48} color="rgba(255,255,255,0.12)"/></div><p style={{fontSize:18,color:"rgba(255,255,255,0.3)",fontWeight:600,margin:0}}>Add clips from the left panel to start remixing</p></div>;
      const currentClip=remixClips[remixPlayingIdx]||remixClips[0];
      return<div style={{width:currentRemixSize.width,height:currentRemixSize.height,backgroundColor:"#0c0c10",position:"relative",overflow:"hidden"}}>
        {remixClips.map((clip,i)=><video key={clip.id} ref={el=>{if(el){remixVideosRef.current.set(clip.id,el);}else remixVideosRef.current.delete(clip.id);}} src={clip.sourceUrl} muted playsInline preload="auto" onLoadedData={e=>{const v=e.target as HTMLVideoElement;if(v.currentTime<0.01)v.currentTime=clip.trimStart;}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:i===remixPlayingIdx?1:0,zIndex:i===remixPlayingIdx?2:1,transition:"opacity 0.12s ease"}}/>)}
        {!remixPlaying&&<button onClick={toggleRemixPlayback} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:96,height:96,borderRadius:"50%",background:"rgba(0,0,0,0.55)",border:"3px solid rgba(255,255,255,0.25)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",zIndex:5}}><Play size={42} color="#fff" style={{marginLeft:5}}/></button>}
        {remixPlaying&&<button onClick={toggleRemixPlayback} style={{position:"absolute",inset:0,background:"transparent",border:"none",cursor:"pointer",zIndex:5}}/>}
        <div style={{position:"absolute",top:16,right:16,padding:"6px 14px",borderRadius:8,backgroundColor:"rgba(0,0,0,0.7)",fontSize:14,color:"#fff",fontWeight:700,fontFamily:"var(--sf)",zIndex:4}}>{Math.round(remixPlaybackTime)}s / {Math.round(remixTotalDuration)}s</div>
        <div style={{position:"absolute",top:16,left:16,padding:"5px 12px",borderRadius:8,backgroundColor:"rgba(0,0,0,0.7)",fontSize:12,color:"#fff",fontWeight:600,fontFamily:"var(--sf)",maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",zIndex:4}}>{currentClip.label}</div>
        {remixBranding&&isLensSubscriber&&<div data-branding-card style={{display:"none",position:"absolute",top:0,left:0}}><BrandingCardTemplate orientation={BRAND_ORIENTATIONS[0]} logo={logo} headshot={headshot} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} tagline="" website="" bgColor={barColor} accentColor={accentColor} fontFamily={fontFamily}/></div>}
      </div>;
    }
    if(activeTab==="listing-flyer")return<ListingFlyerTemplate photos={flyerPhotos} headshot={headshot} logo={logo} address={flyerAddress} cityState={flyerCityState} price={flyerPrice} beds={flyerBeds} baths={flyerBaths} sqft={flyerSqft} description={flyerDescription} amenities={flyerAmenities} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} listingUrl={flyerListingUrl} videoUrl={flyerVideoUrl} stagingUrl={flyerStagingUrl} accentColor={flyerAccentColor} fontFamily={flyerFontFamily} unbranded={flyerUnbranded}/>;
    if(activeTab==="templates"){const photo=mediaMode==="video"?(selectedVideo?.thumbnail||null):listingPhoto;const vidEl=mediaMode==="video"?videoPreviewEl:undefined;if(selectedTemplate==="open-house")return<OpenHouseTemplate size={currentSize} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} logo={logo} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} date={date} time={time} agentName={agentName} phone={phone} brokerage={brokerage} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;return<InfoBarTemplate size={currentSize} listingPhoto={vidEl?null:photo} videoElement={vidEl} headshot={headshot} logo={logo} address={address} addressLine2={addressLine2} beds={beds} baths={baths} sqft={sqft} price={price} agentName={agentName} phone={phone} brokerage={brokerage} badgeText={badge.text} badgeColor={badge.color} fontFamily={fontFamily} barColor={barColor} accentColor={accentColor}/>;}
    if(activeTab==="yard-sign"){const ys={width:currentYardSize.width,height:currentYardSize.height,headshot,logo,agentName,phone,email:agentEmail,brokerage,headerText:yardHeaderText,fontFamily,qrDataUrl:null,bulletPoints:[yardBullet1,yardBullet2,yardBullet3]};if(yardDesign==="sidebar")return<YardSignSidebar{...ys}website={yardWebsite}sidebarColor={yardSidebarColor}mainBgColor={yardMainBgColor}/>;if(yardDesign==="top-heavy")return<YardSignTopHeavy{...ys}topColor={yardTopColor}bottomColor={yardBottomColor}/>;return<YardSignSplitBar{...ys}officeName={yardOfficeName}officePhone={yardOfficePhone}topColor={yardTopColor}bottomColor={yardBottomColor}/>;}
    if(activeTab==="property-pdf")return<PropertyPdfPage pageNumber={pdfPreviewPage} address={pdfAddress} cityStateZip={pdfCityStateZip} price={pdfPrice} beds={pdfBeds} baths={pdfBaths} sqft={pdfSqft} description={pdfDescription} features={pdfFeatures} photos={pdfPhotos} accentColor={pdfAccentColor} fontFamily={fontFamily}/>;
    if(activeTab==="branding-card")return<BrandingCardTemplate orientation={currentBrandOr} logo={brandLogo} headshot={brandHeadshot} agentName={brandAgentName} phone={brandPhone} email={brandEmail} brokerage={brandBrokerage} tagline={brandTagline} website={brandWebsite} address={brandAddress} cityState={brandCityState} price={brandPrice} features={brandFeatures} bgColor={brandBgColor} accentColor={brandAccentColor} bgPhoto={brandBgPhoto} fontFamily={brandFontFamily}/>;
    return null;
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
    :root{--sb:#0c0c10;--ss:#151519;--ss2:#1c1c22;--sbr:rgba(255,255,255,0.06);--sa:#a855f7;--sag:rgba(168,85,247,0.15);--st:#e4e4ea;--std:rgba(255,255,255,0.4);--stm:rgba(255,255,255,0.2);--suc:#10b981;--sc:#09090d;--sf:'DM Sans',-apple-system,sans-serif;--si:rgba(255,255,255,0.03);--sih:rgba(255,255,255,0.05);--sdash:rgba(255,255,255,0.10);--schk:#fff;}
    .sr.light{--sb:#f0f1f5;--ss:#ffffff;--ss2:#f7f7f9;--sbr:rgba(0,0,0,0.08);--sa:#a855f7;--sag:rgba(168,85,247,0.10);--st:#1a1a2e;--std:rgba(0,0,0,0.45);--stm:rgba(0,0,0,0.25);--suc:#10b981;--sc:#e8e9ee;--si:rgba(0,0,0,0.03);--sih:rgba(0,0,0,0.05);--sdash:rgba(0,0,0,0.15);--schk:#ccc;}
    *{margin:0;padding:0;box-sizing:border-box;}.sr{font-family:var(--sf);background:var(--sb);color:var(--st);min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;transition:background 0.3s,color 0.3s;}
    .back-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;text-decoration:none;flex-shrink:0;margin-right:4px;}.back-btn:hover{background:var(--sih);color:var(--st);}
    .st{height:54px;background:var(--ss);border-bottom:1px solid var(--sbr);display:flex;align-items:center;padding:0 14px;gap:6px;flex-shrink:0;z-index:20;transition:background 0.3s;}
    .slg{display:flex;align-items:center;gap:9px;padding-right:18px;border-right:1px solid var(--sbr);margin-right:6px;}
    .slm{width:30px;height:30px;background:linear-gradient(135deg,var(--sa),#a855f7);border-radius:8px;display:flex;align-items:center;justify-content:center;}
    .stb{display:flex;gap:1px;background:var(--si);border-radius:9px;padding:3px;}
    .stbi{padding:6px 14px;border-radius:7px;border:none;background:none;color:var(--std);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:var(--sf);}
    .stbi:hover{color:var(--st);background:var(--sih);}.stbi.ac{color:#fff;background:var(--sa);box-shadow:0 2px 8px rgba(99,102,241,0.3);}
    .ssp{flex:1;}.sac{display:flex;align-items:center;gap:6px;}
    .bi{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;font-family:var(--sf);}.bi:hover{background:var(--sih);color:var(--st);}
    .bx{padding:7px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,var(--sa),#7c3aed);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all 0.2s;box-shadow:0 2px 12px rgba(99,102,241,0.3);font-family:var(--sf);}.bx:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(99,102,241,0.4);}.bx:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
    .sb{height:85vh;display:flex;overflow:hidden;}.slr{width:68px;background:var(--ss);border-right:1px solid var(--sbr);display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:2px;flex-shrink:0;transition:background 0.3s;}
    .rb{width:54px;padding:9px 0;border-radius:9px;border:none;background:none;color:var(--std);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.15s;font-family:var(--sf);}.rb span{font-size:9px;font-weight:600;}.rb:hover{background:var(--sih);color:var(--st);}.rb.ac{background:var(--sag);color:var(--sa);}
    .slp{width:310px;background:var(--ss);border-right:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;transition:background 0.3s;}.slp::-webkit-scrollbar{width:4px;}.slp::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.3);border-radius:4px;}
    .ph{padding:16px 20px 12px;font-size:14px;font-weight:800;letter-spacing:-0.02em;border-bottom:1px solid var(--sbr);display:flex;align-items:center;gap:7px;position:sticky;top:0;background:var(--ss);z-index:5;transition:background 0.3s;}
    .sc{flex:1;background:var(--sc);display:flex;flex-direction:column;position:relative;overflow:hidden;transition:background 0.3s;}
    .scb{position:absolute;inset:0;opacity:0.025;background-image:linear-gradient(45deg,var(--schk) 25%,transparent 25%),linear-gradient(-45deg,var(--schk) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--schk) 75%),linear-gradient(-45deg,transparent 75%,var(--schk) 75%);background-size:28px 28px;background-position:0 0,0 14px,14px -14px,-14px 0px;}
    .sr.light .scb{opacity:0.4;}
    .scc{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
    .spf{border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px rgba(128,128,128,0.1),0 20px 60px rgba(0,0,0,0.15);transition:all 0.3s;}
    .sr:not(.light) .spf{box-shadow:0 0 0 1px rgba(255,255,255,0.05),0 20px 60px rgba(0,0,0,0.5);}
    .sct{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--ss);border-radius:10px;border:1px solid var(--sbr);box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:10;transition:background 0.3s;}
    .sr:not(.light) .sct{box-shadow:0 8px 32px rgba(0,0,0,0.4);}
    .zd{font-size:11px;font-weight:700;color:var(--std);min-width:40px;text-align:center;user-select:none;}.td{width:1px;height:18px;background:var(--sbr);margin:0 3px;}
    .sp{padding:4px 10px;border-radius:7px;border:1px solid var(--sbr);background:none;color:var(--std);font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:var(--sf);}.sp:hover{background:var(--sih);color:var(--st);}.sp.ac{background:var(--sa);color:#fff;border-color:var(--sa);}
    .srp{width:280px;background:var(--ss);border-left:1px solid var(--sbr);overflow-y:auto;flex-shrink:0;transition:background 0.3s;}.srp::-webkit-scrollbar{width:4px;}.srp::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.3);border-radius:4px;}
    .fl{font-size:10px;font-weight:700;color:var(--std);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;display:block;}
    .fi{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;transition:all 0.15s;}.fi:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}.fi::placeholder{color:var(--stm);}
    .fg{margin-bottom:12px;}.fr{display:flex;gap:7px;}
    .fo{padding:9px 12px;border-radius:9px;border:1px solid var(--sbr);background:none;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;margin-bottom:5px;font-family:var(--sf);}.fo:hover{background:var(--sih);}.fo.ac{border-color:var(--sa);background:var(--sag);}
    .tg{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
    .tc{border-radius:10px;border:2px solid var(--sbr);background:var(--si);cursor:pointer;transition:all 0.2s;overflow:hidden;padding:12px;text-align:center;font-family:var(--sf);}.tc:hover{border-color:rgba(128,128,128,0.2);background:var(--sih);}.tc.ac{border-color:var(--sa);background:var(--sag);}
    .tiw{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:10px 22px;background:var(--suc);color:#fff;font-size:12px;font-weight:700;border-radius:10px;box-shadow:0 8px 32px rgba(16,185,129,0.3);z-index:100;animation:ti 0.3s ease;font-family:var(--sf);}
    @keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(16px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
    .animate-spin{animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}
    .rb:not(.ac){animation:sidebarNudge 7s ease-in-out infinite;}.rb:nth-child(2):not(.ac){animation-delay:1s;}.rb:nth-child(3):not(.ac){animation-delay:2s;}.rb:nth-child(4):not(.ac){animation-delay:3s;}
    @keyframes sidebarNudge{0%,90%,100%{transform:scale(1);opacity:1;}93%{transform:scale(1.08);opacity:1;}96%{transform:scale(0.97);opacity:0.8;}}
    .group:hover .ghov{opacity:1!important;}
    .ta{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;resize:none;transition:all 0.15s;}.ta:focus{border-color:var(--sa);box-shadow:0 0 0 3px var(--sag);}
    .ps{width:100%;padding:8px 11px;border-radius:7px;border:1px solid var(--sbr);background:var(--si);color:var(--st);font-size:12px;font-family:var(--sf);outline:none;appearance:none;cursor:pointer;}.ps:focus{border-color:var(--sa);}
    .thm-toggle{width:34px;height:34px;border-radius:7px;border:1px solid var(--sbr);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;color:var(--std);}.thm-toggle:hover{background:var(--sih);color:var(--st);}
    .am-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;border:1px solid var(--sbr);background:var(--si);cursor:pointer;font-size:11px;font-weight:600;color:var(--std);transition:all 0.15s;font-family:var(--sf);}.am-chip:hover{background:var(--sih);color:var(--st);}.am-chip.ac{border-color:var(--sa);background:var(--sag);color:var(--sa);}
    @media(max-width:1100px){.slp{width:260px;}.srp{width:240px;}}
    .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:56px;background:var(--ss);border-top:1px solid var(--sbr);z-index:25;padding:0 8px;align-items:center;justify-content:space-around;gap:2px;}
    .mob-nav button{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:none;color:var(--std);cursor:pointer;padding:6px 0;border-radius:8px;font-family:var(--sf);transition:all 0.15s;}
    .mob-nav button span{font-size:9px;font-weight:600;}.mob-nav button.ac{color:var(--sa);background:var(--sag);}
    @media(max-width:850px){
      .slr{display:none;}.srp{display:none;}
      .slp{position:fixed;left:0;right:0;bottom:56px;width:100%;max-height:60vh;z-index:30;border-right:none;border-top:1px solid var(--sbr);border-radius:16px 16px 0 0;overflow-y:auto;background:var(--ss);box-shadow:0 -8px 32px rgba(0,0,0,0.3);visibility:hidden;opacity:0;transform:translateY(20px);transition:all 0.25s ease;pointer-events:none;}
      .slp.mob-open{visibility:visible;opacity:1;transform:translateY(0);pointer-events:auto;}
      .st{padding:0 8px;gap:4px;height:48px;overflow-x:auto;overflow-y:hidden;}
      .stbi{padding:5px 10px;font-size:11px;}.slg{display:none;}
      .sac .bi{width:30px;height:30px;}.bx{padding:6px 14px;font-size:11px;}
      .mob-nav{display:flex;}.sct{bottom:64px;}.sc{padding-bottom:56px;}
      .toast{bottom:72px;}
      .st{display:none!important;}
    }
    /* Hide Lensy chat widget on Video Remix */
    #lensy-chat-widget,#lensy-chat-bubble,.lensy-widget,.lensy-bubble,[data-lensy],[id*="lensy"],iframe[src*="lensy"]{display:none!important;visibility:hidden!important;pointer-events:none!important;}
  `;

  return(
    <><style>{css}</style>
    <div className={`sr ${theme==="light"?"light":""}`}>
      {/* TOP BAR */}
      <div className="st">
        <a href="/dashboard" className="back-btn" title="Back to Dashboard"><ChevronLeft size={14}/></a>
        <div className="slg"><div className="slm" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}><Film size={14} color="#fff"/></div><span style={{fontSize:14,fontWeight:800,letterSpacing:"-0.03em"}}>Video Remix</span></div>
        <div className="stb">{TABS.map(t=><button key={t.id} className={`stbi ${activeTab===t.id?"ac":""}`} onClick={()=>setActiveTab(t.id)}><t.icon size={13}/>{t.label}</button>)}</div>
        <div style={{marginLeft:12,display:"flex",alignItems:"center",gap:8}}>
          <Home size={14} color="var(--sa)"/>
          <select className="ps" value={selectedPropertyId||""} onChange={e=>handleSelectProperty(e.target.value)} style={{width:220}}>
            <option value="">Select property...</option>
            {userProperties.map((p:any)=><option key={p.id} value={p.id}>{p.address}{p.city?`, ${p.city}`:""}</option>)}
            <option value="__new__">{"\uff0b"} Enter manually</option>
          </select>
        </div>
        <div className="ssp"/>
        <div className="sac">
          <button className="bi" title="Undo"><Undo2 size={15}/></button>
          <button className="bi" title="Redo"><Redo2 size={15}/></button>
          <div className="td"/>
          <button className="thm-toggle" title="Toggle theme" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={15}/>:<Moon size={15}/>}</button>
          <button className="bx" onClick={handleExport} disabled={exporting} style={activeTab==="listing-flyer"?{background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}:isRemixMode?{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}:isVideoMode?{background:"linear-gradient(135deg,#7c3aed,#6366f1)"}:undefined}>
            {exporting?<><Loader2 size={14} className="animate-spin"/>{exportProgress>0?`${exportProgress}%`:"Exporting..."}</>:activeTab==="listing-flyer"?<><Printer size={14}/>Export Flyer</>:isRemixMode?<><Film size={14}/>Export Remix</>:isVideoMode?<><Film size={14}/>Export MP4</>:<><Download size={14}/>Export</>}
          </button>
        </div>
      </div>

      <div className="sb">
        <div className="slr">{currentPanels.map(p=><button key={p.id} className={`rb ${leftPanel===p.id?"ac":""}`} onClick={()=>setLeftPanel(p.id)}><p.icon size={18}/><span>{p.label}</span></button>)}</div>

        <div className={`slp ${mobilePanel?"mob-open":""}`}>

          {/* ── LISTING FLYER PANELS ── */}
          {activeTab==="listing-flyer"&&leftPanel==="uploads"&&<>
            <div className="ph"><ImageIcon size={15} color="var(--sa)"/>Photos ({flyerPhotos.length}/7)</div>
            <div style={{padding:14}}>
              <p style={{fontSize:11,color:"var(--std)",marginBottom:10,lineHeight:1.5}}>First photo = hero. Photos 2-3 stack right. Photos 4-7 fill bottom row.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {flyerPhotos.map((url,i)=>(<div key={i} className="group" style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",top:2,left:2,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>{i===0?"Hero":i<3?`R${i}`:`B${i-2}`}</div><button className="ghov" onClick={()=>setFlyerPhotos(p=>p.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}><X size={10}/></button></div>))}
                {flyerPhotos.length<7&&<label style={{aspectRatio:"1",borderRadius:8,border:"2px dashed var(--sbr)",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"var(--std)"}}><Upload size={16}/><span style={{fontSize:9,fontWeight:600}}>Add</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{Array.from(e.target.files||[]).slice(0,7-flyerPhotos.length).forEach(f=>setFlyerPhotos(p=>[...p,URL.createObjectURL(f)]));e.target.value="";}}/></label>}
              </div>
              <div style={{marginTop:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>setHeadshot(URL.createObjectURL(f))} onClear={()=>setHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>setLogo(URL.createObjectURL(f))} onClear={()=>setLogo(null)} uploading={false} compact/></div></div>
            </div>
          </>}

          {activeTab==="listing-flyer"&&leftPanel==="text"&&<>
            <div className="ph"><Type size={15} color="var(--sa)"/>Property Details</div>
            <Section title="Address & Price" icon={Home}>
              <div className="fg"><label className="fl">Street Address</label><input className="fi" value={flyerAddress} onChange={e=>setFlyerAddress(e.target.value)} placeholder="123 Main Street"/></div>
              <div className="fg"><label className="fl">City, State</label><input className="fi" value={flyerCityState} onChange={e=>setFlyerCityState(e.target.value)} placeholder="Austin, TX"/></div>
              <div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={flyerPrice} onChange={e=>setFlyerPrice(e.target.value)} placeholder="425,000"/></div><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={flyerBeds} onChange={e=>setFlyerBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={flyerBaths} onChange={e=>setFlyerBaths(e.target.value)}/></div></div>
              <div className="fg"><label className="fl">Sq Ft</label><input className="fi" value={flyerSqft} onChange={e=>setFlyerSqft(e.target.value)}/></div>
            </Section>
            <Section title="Description" icon={FileText} defaultOpen={false}><p style={{fontSize:10,color:"var(--std)",marginBottom:8,lineHeight:1.5}}>Shown on flyer (truncated to ~320 chars)</p><textarea className="ta" rows={5} value={flyerDescription} onChange={e=>setFlyerDescription(e.target.value)} placeholder="Stunning 3-bed home with modern finishes..."/></Section>
            <Section title="Amenities" icon={Sparkles}><p style={{fontSize:10,color:"var(--std)",marginBottom:8,lineHeight:1.5}}>Select or add custom amenity pills</p><div style={{display:"flex",flexWrap:"wrap" as const,gap:6,marginBottom:10}}>{AMENITY_SUGGESTIONS.map(a=><button key={a} className={`am-chip ${flyerAmenities.includes(a)?"ac":""}`} onClick={()=>setFlyerAmenities(prev=>prev.includes(a)?prev.filter(x=>x!==a):[...prev,a])}>{flyerAmenities.includes(a)&&<Check size={10}/>}{a}</button>)}</div><input className="fi" placeholder="Add custom + Enter" onKeyDown={e=>{if(e.key==="Enter"){const v=(e.target as HTMLInputElement).value.trim();if(v&&!flyerAmenities.includes(v))setFlyerAmenities(p=>[...p,v]);(e.target as HTMLInputElement).value="";}}}/></Section>
            <Section title="Agent Info" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e=>setAgentEmail(e.target.value)}/></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div></Section>
          </>}

          {activeTab==="listing-flyer"&&leftPanel==="urls"&&<>
            <div className="ph"><Globe size={15} color="var(--sa)"/>URLs & Links</div>
            <div style={{padding:14}}>
              <p style={{fontSize:11,color:"var(--std)",marginBottom:14,lineHeight:1.6}}>Each URL you fill in appears at the bottom of the flyer. Leave blank to hide.</p>
              <Section title="Listing URL" icon={Globe}><div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:8}}><span style={{fontSize:14}}>{"\ud83d\udd17"}</span><span style={{fontSize:10,color:"var(--std)",fontWeight:600,flex:1}}>View full listing</span></div><input className="fi" value={flyerListingUrl} onChange={e=>setFlyerListingUrl(e.target.value)} placeholder="https://yourslug.p2v.homes"/></Section>
              <Section title="Video Tour URL" icon={Video} defaultOpen={false}><div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:8}}><span style={{fontSize:14}}>{"\ud83c\udfac"}</span><span style={{fontSize:10,color:"var(--std)",fontWeight:600,flex:1}}>Watch the video tour</span></div><input className="fi" value={flyerVideoUrl} onChange={e=>setFlyerVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."/></Section>
              <Section title="Virtual Staging URL" icon={ImageIcon} defaultOpen={false}><div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:8}}><span style={{fontSize:14}}>{"\ud83d\udecb\ufe0f"}</span><span style={{fontSize:10,color:"var(--std)",fontWeight:600,flex:1}}>See the staged rooms</span></div><input className="fi" value={flyerStagingUrl} onChange={e=>setFlyerStagingUrl(e.target.value)} placeholder="https://yourslug.p2v.homes#staging"/></Section>
            </div>
          </>}

          {activeTab==="listing-flyer"&&leftPanel==="styles"&&<>
            <div className="ph"><Palette size={15} color="var(--sa)"/>Flyer Styles</div>
            <Section title="Branding" icon={Eye}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}><div><p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>Unbranded Mode</p><p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:2}}>Hide agent bar &amp; branding</p></div><button onClick={()=>setFlyerUnbranded(!flyerUnbranded)} style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:flyerUnbranded?"var(--sa)":"rgba(255,255,255,0.12)",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:flyerUnbranded?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/></button></div></Section>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${flyerFont===f.id?"ac":""}`} onClick={()=>setFlyerFont(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section>
            <Section title="Accent Color" icon={Paintbrush}><ColorPicker value={flyerAccentColor} onChange={setFlyerAccentColor}/><div style={{marginTop:10}}><span className="fl">Brokerage Presets</span><SwatchGrid colors={BROKERAGE_COLORS} current={flyerAccentColor} onSelect={setFlyerAccentColor} showLabels/></div><div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={flyerAccentColor} onSelect={setFlyerAccentColor}/></div></Section>
          </>}

          {/* ── TEMPLATES PANELS ── */}
          {activeTab==="templates"&&leftPanel==="templates"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)"/>Templates</div><div style={{padding:14}}><div className="tg">{TEMPLATES.map(t=><button key={t.id} className={`tc ${selectedTemplate===t.id?"ac":""}`} onClick={()=>setSelectedTemplate(t.id)}><div className="tiw" style={{background:`${t.color}20`}}><t.icon size={18} color={t.color}/></div><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{t.label}</div></button>)}</div></div></>}

          {activeTab==="templates"&&leftPanel==="uploads"&&<>
            <div className="ph"><Upload size={15} color="var(--sa)"/>Media</div>
            <div style={{padding:14}}>
              <div style={{display:"flex",gap:3,padding:3,background:"rgba(255,255,255,0.04)",borderRadius:10,marginBottom:14}}>
                <button onClick={()=>{setMediaMode("image");setSelectedVideo(null);}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 0",borderRadius:8,border:"none",background:mediaMode==="image"?"var(--sa)":"none",color:mediaMode==="image"?"#fff":"var(--std)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--sf)",boxShadow:mediaMode==="image"?"0 2px 8px rgba(99,102,241,0.3)":"none"}}><ImageIcon size={14}/>Image</button>
                <button onClick={()=>{setMediaMode("video");setListingPhoto(null);loadUserVideos();}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"8px 0",borderRadius:8,border:"none",background:mediaMode==="video"?"var(--sa)":"none",color:mediaMode==="video"?"#fff":"var(--std)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--sf)",boxShadow:mediaMode==="video"?"0 2px 8px rgba(99,102,241,0.3)":"none"}}><Play size={14}/>Video</button>
              </div>
              {mediaMode==="image"&&<><UploadZone label="Listing Photo" imageUrl={listingPhoto} onUpload={f=>setListingPhoto(URL.createObjectURL(f))} onClear={()=>setListingPhoto(null)} uploading={false}/><div style={{marginTop:12}}><span className="fl">Stock Photos</span><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:6}}>{DEMO_PHOTOS.map((url,i)=><div key={i} onClick={()=>setListingPhoto(url)} style={{aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"pointer",border:listingPhoto===url?"2px solid var(--sa)":"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>)}</div></div></>}
              {mediaMode==="video"&&<>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:12}}><Film size={13} color="#f59e0b"/><span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>Video exports limited to 119s</span></div>
                <span className="fl">Your Videos</span>
                {loadingVideos?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 0"}}><Loader2 size={20} color="var(--std)" className="animate-spin"/></div>:userVideos.length===0?<div style={{padding:"20px 0",textAlign:"center" as const,borderRadius:10,border:"1px dashed var(--sbr)"}}><p style={{fontSize:11,color:"var(--std)",margin:0}}>No completed videos found.</p></div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6,maxHeight:220,overflowY:"auto" as const}}>{userVideos.map((v:any)=>(<button key={v.orderId} onClick={()=>{setSelectedVideo(v);if(v.thumbnail)setListingPhoto(v.thumbnail);}} style={{position:"relative",borderRadius:10,overflow:"hidden",border:selectedVideo?.orderId===v.orderId?"2px solid var(--sa)":"1px solid var(--sbr)",background:"none",cursor:"pointer",textAlign:"left" as const,transition:"all 0.2s",padding:0,boxShadow:selectedVideo?.orderId===v.orderId?"0 0 0 2px var(--sag)":"none",fontFamily:"var(--sf)"}}>{v.thumbnail?<img src={v.thumbnail} alt="" style={{width:"100%",aspectRatio:"16/9",objectFit:"cover" as const,display:"block"}}/>:<div style={{width:"100%",aspectRatio:"16/9",background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center"}}><Play size={20} color="rgba(255,255,255,0.2)"/></div>}<div style={{padding:"6px 8px"}}><p style={{fontSize:10,fontWeight:700,color:"var(--st)",margin:0}}>Order {v.orderId?.slice(0,8)}</p><p style={{fontSize:9,color:"var(--std)",margin:0}}>{v.date}{v.hasUnbranded?" \u00b7 Unbranded":""}</p></div>{selectedVideo?.orderId===v.orderId&&<div style={{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:"50%",background:"var(--sa)",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={12} color="#fff"/></div>}</button>))}</div>}
                <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span className="fl" style={{margin:0}}>{"\ud83c\udfb5"} Music for Export</span>{selectedMusicTrack&&<button onClick={()=>setSelectedMusicTrack(null)} style={{fontSize:9,color:"var(--std)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--sf)",textDecoration:"underline"}}>Clear</button>}</div>
                  {selectedMusicTrack&&(<div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"rgba(99,102,241,0.1)",border:"1px solid var(--sa)",marginBottom:10}}><Music size={12} color="var(--sa)"/><span style={{fontSize:11,fontWeight:600,color:"var(--sa)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedMusicTrack.name}</span><button onClick={e=>{e.stopPropagation();handlePlayTrack(selectedMusicTrack.id,selectedMusicTrack.url);}} style={{width:20,height:20,borderRadius:"50%",background:"var(--sa)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:"#fff",fontWeight:700}}>{playingTrackId===selectedMusicTrack.id?"\u25a0":"\u25b6"}</span></button></div>)}
                  <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginBottom:8}}>{[{key:"",label:"All"},{key:"upbeat_modern",label:"Upbeat"},{key:"chill_tropical",label:"Chill"},{key:"energetic_pop",label:"Energy"},{key:"elegant_classical",label:"Elegant"},{key:"warm_acoustic",label:"Acoustic"},{key:"bold_cinematic",label:"Cinematic"},{key:"smooth_jazz",label:"Jazz"},{key:"ambient",label:"Ambient"}].map(v=>(<button key={v.key} onClick={()=>{setMusicVibeFilter(v.key);fetchMusicTracks(v.key);}} style={{padding:"3px 8px",borderRadius:6,border:musicVibeFilter===v.key?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.1)",background:musicVibeFilter===v.key?"var(--sag)":"none",color:musicVibeFilter===v.key?"var(--sa)":"var(--std)",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--sf)",transition:"all 0.15s"}}>{v.label}</button>))}</div>
                  {loadingMusic?(<div style={{display:"flex",justifyContent:"center",padding:"12px 0"}}><Loader2 size={16} color="var(--std)" className="animate-spin"/></div>):(<div style={{maxHeight:180,overflowY:"auto" as const,display:"flex",flexDirection:"column" as const,gap:4}}>{musicTracks.length===0&&<p style={{fontSize:10,color:"var(--std)",textAlign:"center" as const,padding:"10px 0",margin:0}}><button onClick={()=>fetchMusicTracks("")} style={{color:"var(--sa)",background:"none",border:"none",cursor:"pointer",fontSize:10,fontFamily:"var(--sf)"}}>Load tracks</button></p>}{musicTracks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:8,border:selectedMusicTrack?.id===t.id?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.06)",background:selectedMusicTrack?.id===t.id?"var(--sag)":"rgba(255,255,255,0.02)",cursor:"pointer",transition:"all 0.15s"}} onClick={()=>setSelectedMusicTrack({id:t.id,url:t.file_url,name:t.display_name})}><button onClick={e=>{e.stopPropagation();handlePlayTrack(t.id,t.file_url);}} style={{width:22,height:22,borderRadius:"50%",background:playingTrackId===t.id?"var(--sa)":"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:playingTrackId===t.id?"#fff":"var(--std)",fontWeight:700,marginLeft:playingTrackId===t.id?0:"1px"}}>{playingTrackId===t.id?"\u25a0":"\u25b6"}</span></button><span style={{fontSize:10,fontWeight:600,color:"var(--st)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.display_name}</span><span style={{fontSize:9,color:"var(--std)",flexShrink:0}}>{t.duration_seconds}s</span>{selectedMusicTrack?.id===t.id&&<Check size={11} color="var(--sa)"/>}</div>))}</div>)}
                </div>
              </>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>{const u=URL.createObjectURL(f);setHeadshot(u);setBrandHeadshot(u);}} onClear={()=>{setHeadshot(null);setBrandHeadshot(null);}} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>{const u=URL.createObjectURL(f);setLogo(u);setBrandLogo(u);}} onClear={()=>{setLogo(null);setBrandLogo(null);}} uploading={false} compact/></div>
            </div>
          </>}

          {activeTab==="templates"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Details</div>
            <Section title="Property" icon={Home}><div className="fg"><label className="fl">Street Address</label><input className="fi" value={address} onChange={e=>setAddress(e.target.value)} placeholder="8043 Villas la Colina"/></div><div className="fg"><label className="fl">City, State</label><input className="fi" value={addressLine2} onChange={e=>setAddressLine2(e.target.value)} placeholder="Ocotal, Guanacaste"/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={beds} onChange={e=>setBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={baths} onChange={e=>setBaths(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Sq Ft</label><input className="fi" value={sqft} onChange={e=>setSqft(e.target.value)}/></div></div><div className="fg"><label className="fl">Price</label><input className="fi" value={price} onChange={e=>setPrice(e.target.value)}/></div>{selectedTemplate==="open-house"&&<div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Date</label><input className="fi" value={date} onChange={e=>setDate(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Time</label><input className="fi" value={time} onChange={e=>setTime(e.target.value)}/></div></div>}</Section>
            <Section title="Agent" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div></div></Section>
          </>}

          {activeTab==="templates"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Styles</div>
            <Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${fontId===f.id?"ac":""}`} onClick={()=>setFontId(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section>
            <Section title="Info Bar Color" icon={Paintbrush}><ColorPicker value={barColor} onChange={setBarColor}/><div style={{marginTop:10}}><span className="fl">Brokerage Presets</span><SwatchGrid colors={BROKERAGE_COLORS} current={barColor} onSelect={setBarColor} showLabels/></div></Section>
            <Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={accentColor||"#ffffff"} onChange={setAccentColor}/>{accentColor&&<button onClick={()=>setAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={accentColor} onSelect={setAccentColor}/></div></Section>
          </>}

          {/* ── VIDEO REMIX PANELS ── */}
          {activeTab==="video-remix"&&leftPanel==="clips"&&<>
            <div className="ph"><Film size={15} color="var(--sa)"/>Your Clips</div>
            <div style={{padding:14}}>
              {loadingRemixClips||loadingVideos?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 0"}}><Loader2 size={20} color="var(--std)" className="animate-spin"/></div>
              :remixClipSources.length===0?<div style={{padding:"24px 0",textAlign:"center" as const}}>
                {hasVideoOrders===false?<><Film size={28} color="var(--std)"/><p style={{fontSize:12,color:"var(--std)",margin:0,marginTop:8,lineHeight:1.6}}>Order a listing video to start remixing clips into social content.</p><a href="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,padding:"7px 18px",borderRadius:8,background:"var(--sa)",color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none"}}>Order a Video</a></>:<><p style={{fontSize:11,color:"var(--std)",margin:0,marginBottom:8}}>No completed videos found.</p><button onClick={()=>loadUserVideos()} className="bx" style={{margin:"0 auto",fontSize:11,padding:"6px 16px"}}>Reload</button></>}
              </div>
              :<div style={{display:"flex",flexDirection:"column" as const,gap:16}}>
                {remixClipSources.map(src=>(
                  <div key={src.orderId}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:13}}>{"\ud83d\udce6"}</span><div><p style={{fontSize:11,fontWeight:700,color:"var(--st)",margin:0}}>Order {src.orderId.slice(0,8)} {"\u00b7"} {src.date}</p><p style={{fontSize:10,color:"var(--std)",margin:0}}>{src.address}</p></div></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {src.clips.map((clip,ci)=>{const onTL=isClipOnTimeline(clip.url);return<button key={ci} onClick={()=>{if(onTL){removeClipFromRemix(remixClips.find(c=>c.sourceUrl===clip.url)?.id||"");}else{addClipToRemix(clip.url,clip.thumbnail,`${src.address.slice(0,20)} \u00b7 ${clip.label}`);}}} style={{position:"relative",borderRadius:8,overflow:"hidden",border:onTL?"1px solid var(--sa)":"1px solid var(--sbr)",background:"none",cursor:"pointer",padding:0,fontFamily:"var(--sf)",opacity:onTL?0.85:1,transition:"all 0.15s"}}><div style={{aspectRatio:"16/9",backgroundColor:"rgba(255,255,255,0.04)",overflow:"hidden"}}>{clip.thumbnail?<img src={clip.thumbnail} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={20} color="rgba(255,255,255,0.15)"/></div>}</div><div style={{padding:"4px 6px"}}><p style={{fontSize:9,fontWeight:600,color:"var(--st)",margin:0,textAlign:"left"}}>{clip.label}</p></div>{onTL&&<div style={{position:"absolute",top:4,right:4,width:18,height:18,borderRadius:"50%",backgroundColor:"var(--sa)",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={10} color="#fff"/></div>}{!onTL&&<div style={{position:"absolute",top:4,right:4,width:18,height:18,borderRadius:"50%",backgroundColor:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>+</div>}</button>;})}
                    </div>
                  </div>
                ))}
              </div>}
              <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>{const u=URL.createObjectURL(f);setHeadshot(u);setBrandHeadshot(u);}} onClear={()=>{setHeadshot(null);setBrandHeadshot(null);}} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>{const u=URL.createObjectURL(f);setLogo(u);setBrandLogo(u);}} onClear={()=>{setLogo(null);setBrandLogo(null);}} uploading={false} compact/></div>
            </div>
          </>}

          {activeTab==="video-remix"&&leftPanel==="timeline"&&<>
            <div className="ph"><LayoutTemplate size={15} color="var(--sa)"/>Timeline</div>
            <div style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid var(--sbr)"}}><span style={{fontSize:12,fontWeight:700,color:"var(--st)"}}>{remixClips.length} clip{remixClips.length!==1?"s":""}</span><span style={{fontSize:12,fontWeight:700,color:remixTotalDuration>119?"#f59e0b":"var(--sa)"}}>{Math.round(remixTotalDuration)}s total</span></div>
              {remixTotalDuration>119&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",marginBottom:12}}><Clock size={12} color="#f59e0b"/><span style={{fontSize:10,color:"#f59e0b",fontWeight:600}}>Total exceeds 2 min. Export may be slow or fail.</span></div>}
              {remixClips.length===0?<div style={{padding:"24px 0",textAlign:"center" as const,border:"2px dashed var(--sbr)",borderRadius:10}}><Film size={24} color="var(--std)"/><p style={{fontSize:11,color:"var(--std)",margin:0,marginTop:8}}>No clips added yet</p></div>
              :<div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
                {remixClips.map((clip,idx)=>{const isExp=expandedClipId===clip.id;const effDur=(clip.trimEnd-clip.trimStart)/clip.speed;
                  return<div key={clip.id} style={{borderRadius:10,border:"1px solid var(--sbr)",background:"rgba(255,255,255,0.02)",overflow:"hidden"}}>
                    <button onClick={()=>setExpandedClipId(isExp?null:clip.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--sf)",textAlign:"left" as const}}>
                      <span style={{fontSize:12,fontWeight:800,color:"var(--sa)",width:20,flexShrink:0}}>{idx+1}.</span>
                      <div style={{width:36,height:24,borderRadius:4,overflow:"hidden",flexShrink:0,backgroundColor:"rgba(255,255,255,0.06)"}}>{clip.thumbnail?<img src={clip.thumbnail} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={12} color="rgba(255,255,255,0.2)"/></div>}</div>
                      <div style={{flex:1,minWidth:0}}><p style={{fontSize:11,fontWeight:600,color:"var(--st)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{clip.label}</p><p style={{fontSize:9,color:"var(--std)",margin:0}}>{effDur.toFixed(1)}s{clip.speed!==1?` @ ${clip.speed}\u00d7`:""}</p></div>
                      <ChevronDown size={12} color="var(--std)" style={{transform:isExp?"rotate(180deg)":"none",transition:"transform 0.2s"}}/>
                    </button>
                    {isExp&&<div style={{padding:"0 12px 12px"}}>
                      <div style={{marginBottom:10}}><label className="fl">Trim Start: {clip.trimStart.toFixed(1)}s</label><input type="range" min={0} max={clip.duration} step={0.5} value={clip.trimStart} onChange={e=>{const v=parseFloat(e.target.value);if(v<clip.trimEnd-1)updateRemixClip(clip.id,{trimStart:v});}} style={{width:"100%",accentColor:"var(--sa)"}}/></div>
                      <div style={{marginBottom:10}}><label className="fl">Trim End: {clip.trimEnd.toFixed(1)}s</label><input type="range" min={0} max={clip.duration} step={0.5} value={clip.trimEnd} onChange={e=>{const v=parseFloat(e.target.value);if(v>clip.trimStart+1)updateRemixClip(clip.id,{trimEnd:v});}} style={{width:"100%",accentColor:"var(--sa)"}}/></div>
                      <div style={{marginBottom:10}}><label className="fl">Speed</label><div style={{display:"flex",flexWrap:"wrap" as const,gap:4}}>{SPEED_PRESETS.map(s=><button key={s} onClick={()=>updateRemixClip(clip.id,{speed:s})} style={{padding:"4px 10px",borderRadius:6,border:clip.speed===s?"1px solid var(--sa)":"1px solid var(--sbr)",background:clip.speed===s?"var(--sag)":"none",color:clip.speed===s?"var(--sa)":"var(--std)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--sf)"}}>{s}{"\u00d7"}</button>)}</div></div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>moveClipInRemix(clip.id,-1)} disabled={idx===0} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 0",borderRadius:6,border:"1px solid var(--sbr)",background:"none",color:idx===0?"var(--stm)":"var(--std)",fontSize:10,fontWeight:600,cursor:idx===0?"not-allowed":"pointer",fontFamily:"var(--sf)"}}><ArrowUp size={11}/>Up</button>
                        <button onClick={()=>moveClipInRemix(clip.id,1)} disabled={idx===remixClips.length-1} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 0",borderRadius:6,border:"1px solid var(--sbr)",background:"none",color:idx===remixClips.length-1?"var(--stm)":"var(--std)",fontSize:10,fontWeight:600,cursor:idx===remixClips.length-1?"not-allowed":"pointer",fontFamily:"var(--sf)"}}><ArrowDown size={11}/>Down</button>
                        <button onClick={()=>removeClipFromRemix(clip.id)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 0",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--sf)"}}><Trash2 size={11}/>Remove</button>
                      </div>
                    </div>}
                  </div>;})}
              </div>}
            </div>
          </>}

          {activeTab==="video-remix"&&leftPanel==="music"&&<>
            <div className="ph"><Music size={15} color="var(--sa)"/>Music</div>
            <div style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span className="fl" style={{margin:0}}>{"\ud83c\udfb5"} Background Music</span>{selectedMusicTrack&&<button onClick={()=>setSelectedMusicTrack(null)} style={{fontSize:9,color:"var(--std)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--sf)",textDecoration:"underline"}}>Clear</button>}</div>
              {selectedMusicTrack&&(<div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"rgba(99,102,241,0.1)",border:"1px solid var(--sa)",marginBottom:10}}><Music size={12} color="var(--sa)"/><span style={{fontSize:11,fontWeight:600,color:"var(--sa)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedMusicTrack.name}</span><button onClick={e=>{e.stopPropagation();handlePlayTrack(selectedMusicTrack.id,selectedMusicTrack.url);}} style={{width:20,height:20,borderRadius:"50%",background:"var(--sa)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:"#fff",fontWeight:700}}>{playingTrackId===selectedMusicTrack.id?"\u25a0":"\u25b6"}</span></button></div>)}
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginBottom:8}}>{[{key:"",label:"All"},{key:"upbeat_modern",label:"Upbeat"},{key:"chill_tropical",label:"Chill"},{key:"energetic_pop",label:"Energy"},{key:"elegant_classical",label:"Elegant"},{key:"warm_acoustic",label:"Acoustic"},{key:"bold_cinematic",label:"Cinematic"},{key:"smooth_jazz",label:"Jazz"},{key:"ambient",label:"Ambient"}].map(v=>(<button key={v.key} onClick={()=>{setMusicVibeFilter(v.key);fetchMusicTracks(v.key);}} style={{padding:"3px 8px",borderRadius:6,border:musicVibeFilter===v.key?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.1)",background:musicVibeFilter===v.key?"var(--sag)":"none",color:musicVibeFilter===v.key?"var(--sa)":"var(--std)",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--sf)",transition:"all 0.15s"}}>{v.label}</button>))}</div>
              {loadingMusic?<div style={{display:"flex",justifyContent:"center",padding:"12px 0"}}><Loader2 size={16} color="var(--std)" className="animate-spin"/></div>:<div style={{maxHeight:400,overflowY:"auto" as const,display:"flex",flexDirection:"column" as const,gap:4}}>{musicTracks.length===0&&<p style={{fontSize:10,color:"var(--std)",textAlign:"center" as const,padding:"10px 0",margin:0}}><button onClick={()=>fetchMusicTracks("")} style={{color:"var(--sa)",background:"none",border:"none",cursor:"pointer",fontSize:10,fontFamily:"var(--sf)"}}>Load tracks</button></p>}{musicTracks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:8,border:selectedMusicTrack?.id===t.id?"1px solid var(--sa)":"1px solid rgba(255,255,255,0.06)",background:selectedMusicTrack?.id===t.id?"var(--sag)":"rgba(255,255,255,0.02)",cursor:"pointer",transition:"all 0.15s"}} onClick={()=>setSelectedMusicTrack({id:t.id,url:t.file_url,name:t.display_name})}><button onClick={e=>{e.stopPropagation();handlePlayTrack(t.id,t.file_url);}} style={{width:22,height:22,borderRadius:"50%",background:playingTrackId===t.id?"var(--sa)":"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,color:playingTrackId===t.id?"#fff":"var(--std)",fontWeight:700,marginLeft:playingTrackId===t.id?0:"1px"}}>{playingTrackId===t.id?"\u25a0":"\u25b6"}</span></button><span style={{fontSize:10,fontWeight:600,color:"var(--st)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.display_name}</span><span style={{fontSize:9,color:"var(--std)",flexShrink:0}}>{t.duration_seconds}s</span>{selectedMusicTrack?.id===t.id&&<Check size={11} color="var(--sa)"/>}</div>))}</div>}
            </div>
          </>}

          {activeTab==="video-remix"&&leftPanel==="styles"&&<>
            <div className="ph"><Palette size={15} color="var(--sa)"/>Remix Styles</div>
            <LensGate locked={!isLensSubscriber}><Section title="Branding Overlay" icon={CreditCard}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",marginBottom:8}}><div><p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>Show Branding</p><p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:2}}>3s intro &amp; outro frames</p></div><button onClick={()=>setRemixBranding(!remixBranding)} style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:remixBranding?"var(--sa)":"rgba(255,255,255,0.12)",position:"relative",transition:"background 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:remixBranding?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/></button></div>{remixBranding&&<><p style={{fontSize:10,color:"var(--std)",lineHeight:1.5,margin:0,padding:"6px 8px",borderRadius:6,background:"rgba(255,255,255,0.03)",marginBottom:10}}>Your branding card appears as a 3-second intro and outro frame.</p><div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--sbr)",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}><div style={{transform:"scale(0.14)",transformOrigin:"top left",width:1920,height:1080}}><BrandingCardTemplate orientation={BRAND_ORIENTATIONS[0]} logo={logo} headshot={headshot} agentName={agentName} phone={phone} email={agentEmail} brokerage={brokerage} tagline="" website="" bgColor={barColor} accentColor={accentColor} fontFamily={fontFamily}/></div></div><div style={{width:"100%",height:0,marginTop:Math.round(1080*0.14)}}/></>}</Section></LensGate>
            <LensGate locked={!isLensSubscriber} label="Lens: Auto-fill Profile"><Section title="Saved Profile" icon={User} defaultOpen={false}><p style={{fontSize:10,color:"var(--std)",lineHeight:1.5,margin:0}}>Lens subscribers get branding auto-filled from their saved profile.</p></Section></LensGate>
            <Section title="Output Size" icon={Layers}><div style={{display:"flex",gap:4}}>{REMIX_SIZES.map(s=><button key={s.id} className={`sp ${remixSize===s.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const,fontSize:10}} onClick={()=>setRemixSize(s.id)}><div style={{fontWeight:700}}>{s.label}</div><div style={{fontSize:8,color:"var(--std)",marginTop:2}}>{s.sublabel}</div></button>)}</div></Section>
            <LensGate locked={!isLensSubscriber} label="Lens: Font Styles"><Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${fontId===f.id?"ac":""}`} onClick={()=>setFontId(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section></LensGate>
            {!isLensSubscriber&&<div style={{margin:"12px 20px",padding:"14px 16px",borderRadius:10,background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))",border:"1px solid rgba(99,102,241,0.2)"}}><p style={{fontSize:12,fontWeight:700,color:"var(--sa)",margin:0}}>Unlock Full Remix</p><p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:4,lineHeight:1.6}}>Subscribe to Lens for branded intro/outro, auto-filled profile, premium templates, and more.</p><a href="/dashboard/lens" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,padding:"7px 16px",borderRadius:8,background:"var(--sa)",color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none",boxShadow:"0 2px 12px rgba(99,102,241,0.3)"}}><Sparkles size={12}/>Subscribe to Lens</a></div>}
            <div style={{padding:"12px 20px"}}><div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 12px",borderRadius:8,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.15)"}}><Clock size={13} color="#f59e0b"/><p style={{fontSize:10,color:"#f59e0b",fontWeight:500,margin:0,lineHeight:1.5}}>Video export runs in your browser. May take 5-20 min. Keep this tab open.</p></div></div>
          </>}

          {/* ── YARD SIGN PANELS ── */}
          {activeTab==="yard-sign"&&leftPanel==="design"&&<><div className="ph"><LayoutTemplate size={15} color="var(--sa)"/>Yard Sign Design</div><div style={{padding:14}}><div className="tg" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>{YARD_DESIGNS.map(d=><button key={d.id} className={`tc ${yardDesign===d.id?"ac":""}`} onClick={()=>setYardDesign(d.id)}><div style={{fontSize:11,fontWeight:700,color:"var(--st)"}}>{d.label}</div><div style={{fontSize:9,color:"var(--std)",marginTop:2}}>{d.desc}</div></button>)}</div><div style={{marginTop:14}}><span className="fl">Sign Size</span><div className="fr" style={{marginTop:4}}>{YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}</div></div></div></>}
          {activeTab==="yard-sign"&&leftPanel==="uploads"&&<><div className="ph"><Upload size={15} color="var(--sa)"/>Uploads</div><div style={{padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={headshot} onUpload={f=>setHeadshot(URL.createObjectURL(f))} onClear={()=>setHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={logo} onUpload={f=>setLogo(URL.createObjectURL(f))} onClear={()=>setLogo(null)} uploading={false} compact/></div></div></>}
          {activeTab==="yard-sign"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Sign Details</div>
            <Section title="Header & Agent" icon={User}><div className="fg"><label className="fl">Header Text</label><input className="fi" value={yardHeaderText} onChange={e=>setYardHeaderText(e.target.value)}/></div><div className="fg"><label className="fl">Agent Name</label><input className="fi" value={agentName} onChange={e=>setAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={agentEmail} onChange={e=>setAgentEmail(e.target.value)}/></div></div><div className="fg"><label className="fl">Brokerage</label><input className="fi" value={brokerage} onChange={e=>setBrokerage(e.target.value)}/></div>{yardDesign==="split-bar"&&<div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Office Name</label><input className="fi" value={yardOfficeName} onChange={e=>setYardOfficeName(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Office Phone</label><input className="fi" value={yardOfficePhone} onChange={e=>setYardOfficePhone(e.target.value)}/></div></div>}{yardDesign==="sidebar"&&<div className="fg"><label className="fl">Website</label><input className="fi" value={yardWebsite} onChange={e=>setYardWebsite(e.target.value)} placeholder="www.janesmith.com"/></div>}</Section>
            <Section title="Property Highlights" icon={Home}><div className="fg"><input className="fi" value={yardBullet1} onChange={e=>setYardBullet1(e.target.value)} placeholder="e.g. 3 BDR / 2 BTH"/></div><div className="fg"><input className="fi" value={yardBullet2} onChange={e=>setYardBullet2(e.target.value)} placeholder="e.g. Pool & Spa"/></div><div className="fg"><input className="fi" value={yardBullet3} onChange={e=>setYardBullet3(e.target.value)} placeholder="e.g. Ocean View"/></div></Section>
          </>}
          {activeTab==="yard-sign"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Colors</div>
            {yardDesign==="split-bar"&&<><Section title="Top Bar" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels/></div></Section><Section title="Bottom Bar" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels/></div></Section></>}
            {yardDesign==="sidebar"&&<><Section title="Sidebar Color" icon={Paintbrush}><ColorPicker value={yardSidebarColor} onChange={setYardSidebarColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardSidebarColor} onSelect={setYardSidebarColor} showLabels/></div></Section><Section title="Main Bg" icon={Paintbrush}><ColorPicker value={yardMainBgColor} onChange={setYardMainBgColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardMainBgColor} onSelect={setYardMainBgColor} showLabels/></div></Section></>}
            {yardDesign==="top-heavy"&&<><Section title="Top Section" icon={Paintbrush}><ColorPicker value={yardTopColor} onChange={setYardTopColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardTopColor} onSelect={setYardTopColor} showLabels/></div></Section><Section title="Bottom Section" icon={Paintbrush}><ColorPicker value={yardBottomColor} onChange={setYardBottomColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={yardBottomColor} onSelect={setYardBottomColor} showLabels/></div></Section></>}
          </>}

          {/* ── PDF PANELS ── */}
          {activeTab==="property-pdf"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Property Details</div><Section title="Address & Price" icon={MapPin}><div className="fg"><label className="fl">Address</label><input className="fi" value={pdfAddress} onChange={e=>setPdfAddress(e.target.value)}/></div><div className="fg"><label className="fl">City, State, Zip</label><input className="fi" value={pdfCityStateZip} onChange={e=>setPdfCityStateZip(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={pdfPrice} onChange={e=>setPdfPrice(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Beds</label><input className="fi" value={pdfBeds} onChange={e=>setPdfBeds(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Baths</label><input className="fi" value={pdfBaths} onChange={e=>setPdfBaths(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Sq Ft</label><input className="fi" value={pdfSqft} onChange={e=>setPdfSqft(e.target.value)}/></div></div></Section><Section title="Description" icon={FileText} defaultOpen={false}><textarea className="ta" rows={6} value={pdfDescription} onChange={e=>setPdfDescription(e.target.value)} placeholder="Property description..."/></Section><Section title="Key Features" icon={Sparkles}><textarea className="ta" rows={6} value={pdfFeatures} onChange={e=>setPdfFeatures(e.target.value)} placeholder="One feature per line..."/></Section></>}
          {activeTab==="property-pdf"&&leftPanel==="photos"&&<><div className="ph"><ImageIcon size={15} color="var(--sa)"/>Photos ({pdfPhotos.length}/25)</div><div style={{padding:14}}><p style={{fontSize:11,color:"var(--std)",marginBottom:10}}>First 3 on page 1. Rest fill grids.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{pdfPhotos.map((url,i)=>(<div key={i} className="group" style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:"1px solid var(--sbr)"}}><img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",top:2,left:2,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>{i<3?("\u2605"+(i+1)):i+1}</div><button className="ghov" onClick={()=>setPdfPhotos(p=>p.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.2s"}}><X size={10}/></button></div>))}{pdfPhotos.length<25&&(<label style={{aspectRatio:"1",borderRadius:8,border:"2px dashed var(--sbr)",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",color:"var(--std)"}}><Upload size={16}/><span style={{fontSize:9,fontWeight:600}}>Add</span><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{Array.from(e.target.files||[]).forEach(f=>{setPdfPhotos(p=>[...p,URL.createObjectURL(f)]);});e.target.value="";}}/></label>)}</div></div></>}
          {activeTab==="property-pdf"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Accent Color</div><Section title="Color" icon={Paintbrush}><ColorPicker value={pdfAccentColor} onChange={setPdfAccentColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor} showLabels/></div><div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={pdfAccentColor} onSelect={setPdfAccentColor}/></div></Section></>}

          {/* ── BRANDING PANELS ── */}
          {activeTab==="branding-card"&&leftPanel==="uploads"&&<><div className="ph"><Upload size={15} color="var(--sa)"/>Uploads</div><div style={{padding:14}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><UploadZone label="Headshot" imageUrl={brandHeadshot} onUpload={f=>setBrandHeadshot(URL.createObjectURL(f))} onClear={()=>setBrandHeadshot(null)} uploading={false} compact/><UploadZone label="Logo" imageUrl={brandLogo} onUpload={f=>setBrandLogo(URL.createObjectURL(f))} onClear={()=>setBrandLogo(null)} uploading={false} compact/></div><div style={{marginTop:10}}><UploadZone label="Background Photo (optional)" imageUrl={brandBgPhoto} onUpload={f=>setBrandBgPhoto(URL.createObjectURL(f))} onClear={()=>setBrandBgPhoto(null)} uploading={false}/></div></div></>}
          {activeTab==="branding-card"&&leftPanel==="text"&&<><div className="ph"><Type size={15} color="var(--sa)"/>Card Details</div><Section title="Agent Info" icon={User}><div className="fg"><label className="fl">Name</label><input className="fi" value={brandAgentName} onChange={e=>setBrandAgentName(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Phone</label><input className="fi" value={brandPhone} onChange={e=>setBrandPhone(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Email</label><input className="fi" value={brandEmail} onChange={e=>setBrandEmail(e.target.value)}/></div></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">Brokerage</label><input className="fi" value={brandBrokerage} onChange={e=>setBrandBrokerage(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Tagline</label><input className="fi" value={brandTagline} onChange={e=>setBrandTagline(e.target.value)}/></div></div><div className="fg"><label className="fl">Website</label><input className="fi" value={brandWebsite} onChange={e=>setBrandWebsite(e.target.value)}/></div></Section><Section title="Property (optional)" icon={Home} defaultOpen={false}><div className="fg"><label className="fl">Address</label><input className="fi" value={brandAddress} onChange={e=>setBrandAddress(e.target.value)}/></div><div className="fr"><div className="fg" style={{flex:1}}><label className="fl">City, State</label><input className="fi" value={brandCityState} onChange={e=>setBrandCityState(e.target.value)}/></div><div className="fg" style={{flex:1}}><label className="fl">Price</label><input className="fi" value={brandPrice} onChange={e=>setBrandPrice(e.target.value)}/></div></div><div className="fg"><label className="fl">Features</label><textarea className="ta" rows={3} value={brandFeatures} onChange={e=>setBrandFeatures(e.target.value)}/></div></Section></>}
          {activeTab==="branding-card"&&leftPanel==="styles"&&<><div className="ph"><Palette size={15} color="var(--sa)"/>Styles</div><Section title="Font" icon={Type}>{FONT_OPTIONS.map(f=><button key={f.id} className={`fo ${brandFont===f.id?"ac":""}`} onClick={()=>setBrandFont(f.id)}><div style={{fontSize:10,fontWeight:700,color:"var(--std)",fontFamily:"var(--sf)"}}>{f.label}</div><div style={{fontSize:17,color:"var(--st)",marginTop:1,fontFamily:f.family}}>{f.sample}</div></button>)}</Section><Section title="Background Color" icon={Paintbrush}><ColorPicker value={brandBgColor} onChange={setBrandBgColor}/><div style={{marginTop:8}}><SwatchGrid colors={BROKERAGE_COLORS} current={brandBgColor} onSelect={setBrandBgColor} showLabels/></div></Section><Section title="Accent Color" icon={Sparkles} defaultOpen={false}><ColorPicker value={brandAccentColor||"#ffffff"} onChange={setBrandAccentColor}/>{brandAccentColor&&<button onClick={()=>setBrandAccentColor("")} style={{marginTop:6,background:"none",border:"none",color:"var(--std)",fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:"var(--sf)"}}>Clear</button>}<div style={{marginTop:10}}><SwatchGrid colors={ACCENT_COLORS} current={brandAccentColor} onSelect={setBrandAccentColor}/></div></Section><Section title="Orientation" icon={Layers}><div className="fr">{BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} style={{flex:1,padding:"8px 0",textAlign:"center" as const}} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}</div></Section></>}
        </div>

        {/* CANVAS */}
        <div className="sc">
          <div className="scb"/>
          <div className="scc">
            <div className="spf" ref={previewRef} style={{width:pW,height:pH}}>
              <div data-export-target="true" style={{width:rawW,height:rawH,transform:`scale(${scale})`,transformOrigin:"top left"}}>{renderPreview()}</div>
            </div>
          </div>
          {/* Remix timeline — YouTube Studio style */}
          {isRemixMode&&remixClips.length>0&&(()=>{
            const TC=["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"];
            const pct=remixTotalDuration>0?(remixPlaybackTime/remixTotalDuration)*100:0;
            const formatT=(s:number)=>{const m=Math.floor(s/60);const sec=Math.floor(s%60);return`${m}:${sec.toString().padStart(2,"0")}`;};
            const handleScrub=(e:React.MouseEvent|MouseEvent,el:HTMLElement)=>{
              const rect=el.getBoundingClientRect();const x=Math.max(0,Math.min(e.clientX-rect.left,rect.width));
              seekRemixTo((x/rect.width)*remixTotalDuration);
            };
            const onMouseDown=(e:React.MouseEvent)=>{
              remixDragging.current=true;
              const el=e.currentTarget as HTMLElement;
              handleScrub(e,el);
              const onMove=(ev:MouseEvent)=>handleScrub(ev,el);
              const onUp=()=>{remixDragging.current=false;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
              window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);
            };
            return<div style={{position:"absolute",bottom:52,left:0,right:0,zIndex:12,background:"var(--ss)",borderTop:"1px solid var(--sbr)",padding:"0"}}>
              {/* Clip track */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px 6px"}}>
                <button onClick={toggleRemixPlayback} style={{width:40,height:40,borderRadius:"50%",background:"var(--sa)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 10px rgba(99,102,241,0.35)"}}>{remixPlaying?<span style={{display:"flex",gap:3}}><span style={{width:4,height:16,backgroundColor:"#fff",borderRadius:1}}/><span style={{width:4,height:16,backgroundColor:"#fff",borderRadius:1}}/></span>:<Play size={18} color="#fff" style={{marginLeft:2}}/>}</button>
                <span style={{fontSize:13,fontWeight:700,color:"var(--st)",fontFamily:"monospace",minWidth:90}}>{formatT(remixPlaybackTime)} <span style={{color:"var(--std)",fontWeight:400}}>/ {formatT(remixTotalDuration)}</span></span>
                <div style={{flex:1}}/>
                <span style={{fontSize:11,color:"var(--std)",fontWeight:600}}>{remixClips.length} clip{remixClips.length!==1?"s":""}</span>
              </div>
              {/* Scrubber bar */}
              <div style={{padding:"0 16px 4px",cursor:"pointer"}} onMouseDown={onMouseDown}>
                <div style={{position:"relative",height:36,display:"flex",gap:2,alignItems:"stretch",borderRadius:6,overflow:"hidden"}}>
                  {remixClips.map((c,i)=><div key={c.id} style={{flex:remixClipDurations[i],display:"flex",flexDirection:"column" as const,justifyContent:"center",position:"relative",backgroundColor:TC[i%TC.length],opacity:i===remixPlayingIdx?1:0.5,transition:"opacity 0.15s",overflow:"hidden",borderRight:i<remixClips.length-1?"2px solid var(--ss)":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 8px",minWidth:0}}>
                      {c.thumbnail&&<img src={c.thumbnail} alt="" style={{width:24,height:16,objectFit:"cover",borderRadius:2,flexShrink:0}}/>}
                      <span style={{fontSize:9,fontWeight:700,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.label}</span>
                    </div>
                  </div>)}
                  {/* Playhead */}
                  <div style={{position:"absolute",top:0,bottom:0,left:`${pct}%`,width:3,backgroundColor:"#fff",zIndex:3,boxShadow:"0 0 8px rgba(255,255,255,0.8),-1px 0 0 rgba(0,0,0,0.3),1px 0 0 rgba(0,0,0,0.3)",pointerEvents:"none"}}>
                    <div style={{position:"absolute",top:-4,left:-5,width:13,height:13,borderRadius:"50%",backgroundColor:"#fff",boxShadow:"0 0 6px rgba(0,0,0,0.4)"}}/>
                  </div>
                </div>
              </div>
            </div>;
          })()}
          <div className="sct">
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.max(50,zoom-10))}><ZoomOut size={13}/></button>
            <div className="zd">{zoom}%</div>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(Math.min(200,zoom+10))}><ZoomIn size={13}/></button>
            <button className="bi" style={{width:28,height:28}} onClick={()=>setZoom(100)}><RotateCcw size={13}/></button>
            <div className="td"/>
            {activeTab==="video-remix"&&<>{REMIX_SIZES.map(s=><button key={s.id} className={`sp ${remixSize===s.id?"ac":""}`} onClick={()=>setRemixSize(s.id)}>{s.label}</button>)}<div className="td"/><span style={{fontSize:11,fontWeight:600,color:remixTotalDuration>119?"#f59e0b":"var(--std)",padding:"0 4px"}}>{Math.round(remixTotalDuration)}s</span></>}
            {activeTab==="templates"&&SIZES.map(s=><button key={s.id} className={`sp ${selectedSize===s.id?"ac":""}`} onClick={()=>setSelectedSize(s.id)}>{s.label}</button>)}
            {activeTab==="listing-flyer"&&<span style={{fontSize:11,fontWeight:600,color:"var(--std)",padding:"0 4px"}}>US Letter 8.5{"\u00d7"}11"</span>}
            {activeTab==="yard-sign"&&YARD_SIGN_SIZES.map(s=><button key={s.id} className={`sp ${yardSignSize===s.id?"ac":""}`} onClick={()=>setYardSignSize(s.id)}>{s.label}</button>)}
            {activeTab==="property-pdf"&&pdfTotalPages>1&&<><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.max(0,pdfPreviewPage-1))}><ChevronLeft size={13}/></button><span className="zd">Pg {pdfPreviewPage+1}/{pdfTotalPages}</span><button className="bi" style={{width:28,height:28}} onClick={()=>setPdfPreviewPage(Math.min(pdfTotalPages-1,pdfPreviewPage+1))}><ChevronRight size={13}/></button></>}
            {activeTab==="branding-card"&&BRAND_ORIENTATIONS.map(o=><button key={o.id} className={`sp ${brandOrientation===o.id?"ac":""}`} onClick={()=>setBrandOrientation(o.id)}>{o.label}</button>)}
          </div>
        </div>

        {/* RIGHT PANEL */}
        {showRight&&<div className="srp">
          <div className="ph"><Settings size={14} color="var(--sa)"/>Remix Settings<div style={{flex:1}}/><button className="bi" style={{width:26,height:26}} onClick={()=>setShowRight(false)}><X size={11}/></button></div>
          <Section title="Export" icon={Download}>
            {activeTab==="listing-flyer"&&<>
              <p style={{fontSize:11,color:"var(--std)",marginBottom:10,lineHeight:1.5}}>Print-ready US Letter. PNG for digital, PDF for print.</p>
              <button className="bx" style={{width:"100%",justifyContent:"center",padding:"11px 0",background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}} onClick={handleExport} disabled={exporting}>{exporting?<><Loader2 size={14} className="animate-spin"/>Exporting...</>:<><Printer size={14}/>Download PNG</>}</button>
              <button className="bi" style={{width:"100%",marginTop:6,fontSize:11,fontWeight:600,justifyContent:"center",gap:6,height:36}} onClick={handleExportPdf} disabled={exporting}><FileText size={13}/>Download PDF (Print)</button>
            </>}
            {activeTab!=="listing-flyer"&&<>
              <button className="bx" style={{width:"100%",justifyContent:"center",padding:"11px 0",background:isRemixMode?"linear-gradient(135deg,#7c3aed,#ec4899)":isVideoMode?"linear-gradient(135deg,#7c3aed,#6366f1)":undefined,position:"relative",overflow:"hidden"}} onClick={handleExport} disabled={exporting}>
                {exporting&&exportProgress>0&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:`${exportProgress}%`,background:"rgba(255,255,255,0.15)",transition:"width 0.3s ease"}}/>}
                <span style={{position:"relative",display:"flex",alignItems:"center",gap:7}}>
                  {exporting?<><Loader2 size={14} className="animate-spin"/>{exportProgress>0?`Exporting ${exportProgress}%`:"Preparing..."}</>:isRemixMode?<><Film size={14}/>Export Remix</>:isVideoMode?<><Film size={14}/>Export MP4</>:<><Download size={14}/>Export</>}
                </span>
              </button>
              {exporting&&exportStatus&&<p style={{fontSize:10,color:"var(--std)",textAlign:"center" as const,marginTop:6,lineHeight:1.4,fontFamily:"var(--sf)"}}>{exportStatus}</p>}
            </>}
          </Section>
          <Section title="Layers" icon={Layers} defaultOpen={false}><div style={{display:"flex",flexDirection:"column" as const,gap:3}}>{(activeTab==="listing-flyer"?[{n:"Branding Bar",i:"\ud83d\udc64"},{n:"Photos",i:"\ud83d\uddbc\ufe0f"},{n:"Details",i:"\ud83d\udccb"},{n:"Amenities",i:"\u2728"},{n:"URL Links",i:"\ud83d\udd17"}]:activeTab==="video-remix"?[{n:"Clips",i:"\ud83c\udfac"},{n:"Music",i:"\ud83c\udfb5"},{n:"Branding",i:"\ud83d\udc64"},{n:"Timeline",i:"\u23f1\ufe0f"}]:activeTab==="templates"?[{n:"Badge",i:"\ud83c\udff7\ufe0f"},{n:"Price",i:"\ud83d\udcb2"},{n:"Info Bar",i:"\ud83d\udccb"},{n:"Agent",i:"\ud83d\udc64"},{n:"Photo",i:"\ud83d\uddbc\ufe0f"}]:activeTab==="yard-sign"?[{n:"Header",i:"\ud83c\udff7\ufe0f"},{n:"Agent",i:"\ud83d\udc64"},{n:"Background",i:"\ud83d\uddbc\ufe0f"}]:activeTab==="property-pdf"?[{n:"Photos",i:"\ud83d\uddbc\ufe0f"},{n:"Details",i:"\ud83d\udccb"},{n:"Features",i:"\u2728"}]:[{n:"Headshot",i:"\ud83d\udc64"},{n:"Info",i:"\ud83d\udccb"},{n:"Background",i:"\ud83d\uddbc\ufe0f"}]).map((l,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:7,background:"rgba(255,255,255,0.02)",border:"1px solid var(--sbr)",fontSize:11,color:"var(--std)"}}><span>{l.i}</span><span style={{flex:1,fontWeight:600}}>{l.n}</span><Eye size={13} color="var(--sa)"/></div>)}</div></Section>
        </div>}
      </div>

      {/* MOBILE NAV */}
      {mobilePanel&&<div onClick={()=>setMobilePanel(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:28}}/>}
      <div className="mob-nav">
        {currentPanels.map(p=>(<button key={p.id} className={mobilePanel===p.id?"ac":""} onClick={()=>{if(mobilePanel===p.id){setMobilePanel(null);}else{setLeftPanel(p.id);setMobilePanel(p.id);}}}><p.icon size={18}/><span>{p.label}</span></button>))}
        <button onClick={handleExport} disabled={exporting}>{exporting?<Loader2 size={18} className="animate-spin"/>:<Download size={18}/>}<span>{exporting?(exportProgress>0?`${exportProgress}%`:"..."):"Export"}</span></button>
      </div>

      {/* Export status overlay — visible on all screens during export */}
      {exporting&&exportStatus&&<div style={{position:"fixed",bottom:70,left:8,right:8,zIndex:999,padding:"12px 16px",borderRadius:14,background:"var(--ss)",border:"1px solid var(--sbr)",boxShadow:"0 -4px 24px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:10,fontFamily:"var(--sf)"}}>
        <Loader2 size={16} color="var(--sa)" className="animate-spin" style={{flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:12,fontWeight:700,color:"var(--st)",margin:0}}>{exportProgress>0?`Exporting ${exportProgress}%`:"Preparing..."}</p>
          <p style={{fontSize:10,color:"var(--std)",margin:0,marginTop:2}}>{exportStatus}</p>
        </div>
        {exportProgress>0&&<div style={{width:40,height:40,borderRadius:"50%",background:`conic-gradient(var(--sa) ${exportProgress*3.6}deg, var(--sbr) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:32,height:32,borderRadius:"50%",background:"var(--ss)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"var(--st)"}}>{exportProgress}%</div></div>}
      </div>}

      
      {/* ═══ REMIX LIBRARY ═══ */}
      <div style={{position:"relative",zIndex:1,padding:"32px 24px 48px",background:"var(--sb)",borderTop:"1px solid var(--sbr)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center"}}><Film size={16} color="#fff"/></div>
            <div><h2 style={{fontSize:18,fontWeight:800,color:"var(--st)",margin:0}}>Your Remixes</h2><p style={{fontSize:11,color:"var(--std)",margin:0}}>All your exported remix videos</p></div>
          </div>
          <RemixLibraryGrid/>
        </div>
      </div>

{notification&&<div className="toast"><CheckCircle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:7}}/>{notification}</div>}
    </div></>
  );
}
