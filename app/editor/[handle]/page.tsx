// app/editor/[handle]/page.tsx  —  v4 (Session 5)
// Full editor with: Hero, Brand, Content, Media, Locations, FAQ, Features
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CLD = "dh6ztnoue", PRESET = "p2v_unsigned";

type FaqItem = { question: string; answer: string };
type SiteData = { id:string; user_id:string; handle:string; site_title:string|null; tagline:string|null; bio:string|null; about_content:string|null; primary_color:string|null; faq_items:FaqItem[]; blog_enabled:boolean; calendar_enabled:boolean; listings_opt_in:boolean; hero_photos:string[]; hero_video_url:string|null; about_photo_url:string|null };
type LensData = { saved_headshot_url:string|null; saved_logo_url:string|null; saved_agent_name:string|null; saved_phone:string|null; saved_email:string|null; saved_company:string|null; saved_website:string|null; saved_company_colors:string[]|null };
type MItem = { id:string; label:string; url:string; thumb:string; type:"image"|"video"; source:string; date:string; property?:string };
type LocPage = { id:string; location_name:string; location_slug:string; region:string|null; country:string|null; page_title:string|null; meta_description:string|null; hero_heading:string|null; intro_text:string|null; body_content:string|null; highlights:string[]; keywords:string[]; hero_photo_url:string|null; photos:{url:string|null;alt:string;caption:string}[]; published:boolean };
type SaveSt = "idle"|"saving"|"saved"|"error";
type Tab = "hero"|"brand"|"content"|"media"|"locations"|"faq"|"features";

async function upCld(file:File, folder:string, onP?:(n:number)=>void):Promise<string>{return new Promise((r,j)=>{const fd=new FormData();fd.append("file",file);fd.append("upload_preset",PRESET);fd.append("folder",folder);const x=new XMLHttpRequest();x.open("POST",`https://api.cloudinary.com/v1_1/${CLD}/auto/upload`);x.upload.onprogress=e=>{if(e.lengthComputable&&onP)onP(Math.round(e.loaded/e.total*100))};x.onload=()=>x.status===200?r(JSON.parse(x.responseText).secure_url):j(new Error("fail"));x.onerror=()=>j(new Error("fail"));x.send(fd)})}

export default function EditorPage(){
  const params=useParams(); const handle=params.handle as string;
  const [user,setUser]=useState<any>(null);
  const [authL,setAuthL]=useState(true);
  const [site,setSite]=useState<SiteData|null>(null);
  const [lens,setLens]=useState<LensData|null>(null);
  const [media,setMedia]=useState<MItem[]>([]);
  const [locs,setLocs]=useState<LocPage[]>([]);
  const [loadErr,setLoadErr]=useState("");
  const [ss,setSs]=useState<SaveSt>("idle");
  const [tab,setTab]=useState<Tab>("hero");
  const [uProg,setUProg]=useState<number|null>(null);
  const [uTgt,setUTgt]=useState<string|null>(null);
  const [pkOpen,setPkOpen]=useState(false);
  const [pkTgt,setPkTgt]=useState<string|null>(null);
  const [pkFilt,setPkFilt]=useState<"all"|"image"|"video">("all");
  const [prev,setPrev]=useState<MItem|null>(null);
  const [copied,setCopied]=useState<string|null>(null);
  const [mFilt,setMFilt]=useState<"all"|"image"|"video">("all");
  // Locations state
  const [newLoc,setNewLoc]=useState("");
  const [newReg,setNewReg]=useState("");
  const [genning,setGenning]=useState(false);
  const [genErr,setGenErr]=useState("");
  const [editLoc,setEditLoc]=useState<string|null>(null);
  const [locPicker,setLocPicker]=useState<{locId:string;idx:number}|null>(null);
  const sRef=useRef<NodeJS.Timeout|null>(null);

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();setUser(user);setAuthL(false)})()},[]);

  useEffect(()=>{
    if(!user)return;
    (async()=>{
      const{data:rows,error}=await supabase.from("agent_websites").select("*").eq("handle",handle).limit(1);
      if(error||!rows?.length){setLoadErr(error?.message||"Site not found");return}
      const s=rows[0]; if(s.user_id!==user.id){setLoadErr("No permission");return}
      setSite({...s,faq_items:s.faq_items??[],hero_photos:Array.isArray(s.hero_photos)?s.hero_photos:[],hero_video_url:s.hero_video_url??null,about_photo_url:s.about_photo_url??null});

      const{data:lr}=await supabase.from("lens_usage").select("saved_headshot_url,saved_logo_url,saved_agent_name,saved_phone,saved_email,saved_company,saved_website,saved_company_colors").eq("user_id",user.id).limit(1);
      if(lr?.length)setLens(lr[0]);

      // Media
      const items:MItem[]=[];
      const{data:orders}=await supabase.from("orders").select("id,property_address,photos,delivery_url,clip_urls,created_at").eq("user_id",user.id).eq("payment_status","paid").order("created_at",{ascending:false});
      if(orders)for(const o of orders){const a=o.property_address||"Order";const ph=Array.isArray(o.photos)?o.photos:[];ph.forEach((p:any,i:number)=>{const u=p.secure_url||p.url;if(u)items.push({id:`op-${o.id}-${i}`,label:p.description||a,url:u,thumb:u,type:"image",source:"Order",date:o.created_at,property:a})});if(o.delivery_url)items.push({id:`ov-${o.id}`,label:a,url:o.delivery_url,thumb:ph[0]?.secure_url||"",type:"video",source:"Video",date:o.created_at,property:a})}
      const{data:exps}=await supabase.from("design_exports").select("id,template_type,export_url,overlay_video_url,export_format,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
      if(exps)for(const e of exps){if(e.export_url){const iv=e.export_format==="video"||/\.(mp4|webm|mov)$/i.test(e.export_url);items.push({id:`de-${e.id}`,label:e.template_type||"Design Export",url:e.export_url,thumb:iv?"":e.export_url,type:iv?"video":"image",source:"Design Studio",date:e.created_at})}if(e.overlay_video_url)items.push({id:`dv-${e.id}`,label:(e.template_type||"Design")+" Video",url:e.overlay_video_url,thumb:"",type:"video",source:"Design Studio",date:e.created_at})}
      setMedia(items);

      // Location pages
      const{data:locRows}=await supabase.from("agent_location_pages").select("*").eq("handle",handle).order("location_name");
      if(locRows)setLocs(locRows);
    })();
  },[user,handle]);

  const autoSave=useCallback((d:Partial<SiteData>)=>{if(sRef.current)clearTimeout(sRef.current);sRef.current=setTimeout(async()=>{setSs("saving");const{error}=await supabase.from("agent_websites").update({site_title:d.site_title,tagline:d.tagline,bio:d.bio,about_content:d.about_content,primary_color:d.primary_color,faq_items:d.faq_items,blog_enabled:d.blog_enabled,calendar_enabled:d.calendar_enabled,listings_opt_in:d.listings_opt_in,hero_photos:d.hero_photos,hero_video_url:d.hero_video_url,about_photo_url:d.about_photo_url}).eq("handle",handle);if(error){console.error("Save:",error.message);setSs("error")}else{setSs("saved");setTimeout(()=>setSs("idle"),2000)}},1500)},[handle]);

  async function saveLens(f:string,v:string){if(!user)return;setSs("saving");const{error}=await supabase.from("lens_usage").update({[f]:v}).eq("user_id",user.id);if(error)setSs("error");else{setSs("saved");setTimeout(()=>setSs("idle"),2000)}}

  function up<K extends keyof SiteData>(k:K,v:SiteData[K]){if(!site)return;const u={...site,[k]:v};setSite(u);autoSave(u)}
  function addFaq(){if(!site)return;const u={...site,faq_items:[...site.faq_items,{question:"",answer:""}]};setSite(u);autoSave(u)}
  function upFaq(i:number,f:"question"|"answer",v:string){if(!site)return;const it=[...site.faq_items];it[i]={...it[i],[f]:v};const u={...site,faq_items:it};setSite(u);autoSave(u)}
  function rmFaq(i:number){if(!site)return;const u={...site,faq_items:site.faq_items.filter((_,x)=>x!==i)};setSite(u);autoSave(u)}
  function rmHero(i:number){if(!site)return;const u={...site,hero_photos:site.hero_photos.filter((_,x)=>x!==i)};setSite(u);autoSave(u)}

  async function doUp(e:React.ChangeEvent<HTMLInputElement>,t:string,folder:string){const f=e.target.files?.[0];if(!f)return;setUTgt(t);setUProg(0);try{const url=await upCld(f,folder,setUProg);setUProg(null);setUTgt(null);if(t==="headshot"){setLens(p=>p?{...p,saved_headshot_url:url}:p);await saveLens("saved_headshot_url",url)}else if(t==="logo"){setLens(p=>p?{...p,saved_logo_url:url}:p);await saveLens("saved_logo_url",url)}else if(t==="hero_photo"&&site){const u={...site,hero_photos:[...site.hero_photos,url]};setSite(u);autoSave(u)}else if(t==="hero_video"&&site){const u={...site,hero_video_url:url};setSite(u);autoSave(u)}}catch{setUProg(null);setUTgt(null);setSs("error")}}

  function pick(url:string){if(!site||!pkTgt)return;if(pkTgt==="hero_photo"){const u={...site,hero_photos:[...site.hero_photos,url]};setSite(u);autoSave(u)}else if(pkTgt==="hero_video"){const u={...site,hero_video_url:url};setSite(u);autoSave(u)}else if(pkTgt==="headshot"){setLens(p=>p?{...p,saved_headshot_url:url}:p);saveLens("saved_headshot_url",url)}else if(pkTgt==="logo"){setLens(p=>p?{...p,saved_logo_url:url}:p);saveLens("saved_logo_url",url)}setPkOpen(false);setPkTgt(null)}
  function openPk(t:string,f?:"all"|"image"|"video"){setPkTgt(t);setPkFilt(f||"all");setPkOpen(true)}
  function cpUrl(u:string){navigator.clipboard.writeText(u);setCopied(u);setTimeout(()=>setCopied(null),1500)}
  function useHero(m:MItem){if(!site)return;if(m.type==="image"){const u={...site,hero_photos:[...site.hero_photos,m.url]};setSite(u);autoSave(u)}else{const u={...site,hero_video_url:m.url};setSite(u);autoSave(u)}}

  // ─── Location helpers ───
  async function genLoc(){if(!newLoc.trim())return;setGenning(true);setGenErr("");try{const res=await fetch("/api/websites/generate-location",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location_name:newLoc.trim(),region:newReg.trim()||null,country:"Costa Rica",agent_name:lens?.saved_agent_name,company:lens?.saved_company,handle,user_id:user.id})});const d=await res.json();if(!res.ok)throw new Error(d.error);if(d.page){setLocs([...locs,d.page]);setNewLoc("");setNewReg("");setEditLoc(d.page.id)}}catch(e:any){setGenErr(e.message)}setGenning(false)}
  async function togglePub(loc:LocPage){const nv=!loc.published;const{error}=await supabase.from("agent_location_pages").update({published:nv}).eq("id",loc.id);if(!error)setLocs(locs.map(l=>l.id===loc.id?{...l,published:nv}:l))}
  async function upLocF(id:string,f:string,v:any){const{error}=await supabase.from("agent_location_pages").update({[f]:v,updated_at:new Date().toISOString()}).eq("id",id);if(!error)setLocs(locs.map(l=>l.id===id?{...l,[f]:v}:l))}
  async function delLoc(id:string){const{error}=await supabase.from("agent_location_pages").delete().eq("id",id);if(!error){setLocs(locs.filter(l=>l.id!==id));if(editLoc===id)setEditLoc(null)}}
  function setLocPhoto(locId:string,idx:number,url:string){if(idx===-1){upLocF(locId,"hero_photo_url",url)}else{const loc=locs.find(l=>l.id===locId);if(!loc)return;const ph=[...loc.photos];ph[idx]={...ph[idx],url};upLocF(locId,"photos",ph)}}

  const fMedia=mFilt==="all"?media:media.filter(m=>m.type===mFilt);
  const pkMedia=pkFilt==="all"?media:media.filter(m=>m.type===pkFilt);
  const eLoc=locs.find(l=>l.id===editLoc);

  const tabs:{key:Tab;label:string}[]=[{key:"hero",label:"Hero"},{key:"brand",label:"Brand"},{key:"content",label:"Content"},{key:"media",label:`Media (${media.length})`},{key:"locations",label:`Locations (${locs.length})`},{key:"faq",label:"FAQ"},{key:"features",label:"Features"}];

  if(authL)return<Ctr><p style={{color:"#9ca3af"}}>Loading…</p></Ctr>;
  if(!user){const r=`https://${handle}.p2v.homes/editor/${handle}/auth-callback`;return<Ctr><p style={{fontSize:18,fontWeight:600,color:"#1e293b",marginBottom:4}}>Site Editor</p><p style={{color:"#94a3b8",marginBottom:20}}>Sign in to edit {handle}.p2v.homes</p><a href={`https://realestatephoto2video.com/login?redirect=${encodeURIComponent(r)}`} style={S.pBtn}>Log in →</a></Ctr>}
  if(loadErr)return<Ctr><p style={{color:"#dc2626"}}>{loadErr}</p></Ctr>;
  if(!site)return<Ctr><p style={{color:"#9ca3af"}}>Loading site…</p></Ctr>;

  return(
    <div style={S.page}><style>{CSS}</style>
      <header style={S.hdr}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18,color:"#6366f1"}}>✦</span><span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Editor</span><span style={{fontSize:12,color:"#94a3b8",background:"#f1f5f9",padding:"3px 10px",borderRadius:6}}>{handle}.p2v.homes</span></div><div style={{display:"flex",alignItems:"center",gap:10}}><SvBdg s={ss}/><a href={`https://${handle}.p2v.homes`} target="_blank" rel="noopener noreferrer" style={S.vBtn}>View site ↗</a></div></header>
      <nav style={S.tBar}>{tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{...S.tI,color:tab===t.key?"#4f46e5":"#9ca3af",fontWeight:tab===t.key?600:400,borderBottom:tab===t.key?"2px solid #6366f1":"2px solid transparent"}}>{t.label}</button>)}</nav>

      <main style={S.mn}><div style={S.ctr}>

        {/* ═══ HERO ═══ */}
        {tab==="hero"&&<><Hd t="Hero Section" s="The banner visitors see first"/>
          <Cd t="Hero Video" s="Auto-plays behind your hero. MP4 or WebM.">{site.hero_video_url?<div><video src={site.hero_video_url} muted loop autoPlay playsInline style={{width:"100%",borderRadius:8,maxHeight:220,objectFit:"cover"}}/><button onClick={()=>up("hero_video_url",null)} style={S.dng}>Remove video</button></div>:<div style={{display:"flex",gap:8}}><UZ accept="video/mp4,video/webm,video/quicktime" label="Upload video" onChange={e=>doUp(e,"hero_video","photo2video/hero")} uping={uTgt==="hero_video"} prog={uTgt==="hero_video"?uProg:null}/><LB label="From your videos" onClick={()=>openPk("hero_video","video")}/></div>}</Cd>
          <Cd t="Hero Photos" s={site.hero_photos.length?`${site.hero_photos.length} photo${site.hero_photos.length>1?"s":""}`:"Falls back to listing photos when empty"}>{site.hero_photos.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>{site.hero_photos.map((u,i)=><div key={i} className="tw"><img src={u} alt="" style={{width:130,height:90,objectFit:"cover",borderRadius:8}}/><button className="tx" onClick={()=>rmHero(i)}>×</button></div>)}</div>}<div style={{display:"flex",gap:8}}><UZ accept="image/*" label="Upload photo" onChange={e=>doUp(e,"hero_photo","photo2video/hero")} uping={uTgt==="hero_photo"} prog={uTgt==="hero_photo"?uProg:null} compact/><LB label="From your photos" onClick={()=>openPk("hero_photo","image")}/></div></Cd>
        </>}

        {/* ═══ BRAND ═══ */}
        {tab==="brand"&&<><Hd t="Brand & Identity" s="Your photos, colors, and site info"/>
          <Cd t="Agent Photos" s="From your Design Studio — replace anytime"><div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 180px"}}><label style={S.lb}>Headshot</label>{lens?.saved_headshot_url?<img src={lens.saved_headshot_url} alt="" style={{width:110,height:110,borderRadius:"50%",objectFit:"cover",border:"3px solid #e5e7eb",display:"block"}}/>:<div style={{width:110,height:110,borderRadius:"50%",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:12}}>No headshot</div>}<div style={{display:"flex",gap:6,marginTop:10}}><SU accept="image/*" label="Upload" onChange={e=>doUp(e,"headshot","photo2video/design-studio")} uping={uTgt==="headshot"}/><button onClick={()=>openPk("headshot","image")} style={S.sm}>Library</button></div></div>
            <div style={{flex:"1 1 180px"}}><label style={S.lb}>Logo</label>{lens?.saved_logo_url?<img src={lens.saved_logo_url} alt="" style={{height:70,maxWidth:180,objectFit:"contain",borderRadius:8,border:"1px solid #e5e7eb",padding:8,background:"#fff",display:"block"}}/>:<div style={{width:150,height:70,borderRadius:8,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",color:"#9ca3af",fontSize:12}}>No logo</div>}<div style={{display:"flex",gap:6,marginTop:10}}><SU accept="image/*" label="Upload" onChange={e=>doUp(e,"logo","photo2video/agent-profiles")} uping={uTgt==="logo"}/><button onClick={()=>openPk("logo","image")} style={S.sm}>Library</button></div></div>
          </div></Cd>
          <Cd t="Site Info"><Fl l="Site Title" v={site.site_title??""} onChange={v=>up("site_title",v)} ph="e.g. Wall to Wall Real Estate"/><Fl l="Tagline" v={site.tagline??""} onChange={v=>up("tagline",v)} ph="e.g. Your dream home in Costa Rica"/>
            <div style={S.fg}><label style={S.lb}>Primary Color</label><div style={{display:"flex",alignItems:"center",gap:10}}><input type="color" value={site.primary_color??"#334155"} onChange={e=>up("primary_color",e.target.value)} style={{width:42,height:42,border:"1px solid #d1d5db",borderRadius:10,cursor:"pointer",padding:2}}/><input type="text" value={site.primary_color??"#334155"} onChange={e=>up("primary_color",e.target.value)} style={{...S.inp,width:110}}/>{lens?.saved_company_colors?.length?<div style={{display:"flex",gap:5,marginLeft:8}}>{lens.saved_company_colors.map((c,i)=><button key={i} onClick={()=>up("primary_color",c)} title={c} style={{width:26,height:26,borderRadius:6,background:c,border:site.primary_color===c?"2px solid #0f172a":"1px solid #d1d5db",cursor:"pointer"}}/>)}<span style={{fontSize:11,color:"#9ca3af",alignSelf:"center"}}>brand</span></div>:null}</div></div>
          </Cd>
          {lens&&<Cd t="Agent Profile" s="From your Design Studio" muted><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inf l="Name" v={lens.saved_agent_name}/><Inf l="Company" v={lens.saved_company}/><Inf l="Phone" v={lens.saved_phone}/><Inf l="Email" v={lens.saved_email}/></div></Cd>}
        </>}

        {/* ═══ CONTENT ═══ */}
        {tab==="content"&&<><Hd t="Content" s="Homepage bio and about page text"/><Cd><TA l="Bio (homepage)" v={site.bio??""} onChange={v=>up("bio",v)} ph="A brief intro — 2-3 sentences" rows={3}/><TA l="About Content (about page)" v={site.about_content??""} onChange={v=>up("about_content",v)} ph="Your full story…" rows={8}/></Cd></>}

        {/* ═══ MEDIA ═══ */}
        {tab==="media"&&<><Hd t="Media Library" s={`${media.length} items from your orders and Design Studio`}/>
          <div style={{display:"flex",gap:6,marginBottom:16}}>{(["all","image","video"] as const).map(f=><button key={f} onClick={()=>setMFilt(f)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+(mFilt===f?"#6366f1":"#e5e7eb"),background:mFilt===f?"#eef2ff":"#fff",color:mFilt===f?"#4f46e5":"#6b7280",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{f==="all"?`All (${media.length})`:f==="image"?`Photos (${media.filter(m=>m.type==="image").length})`:`Videos (${media.filter(m=>m.type==="video").length})`}</button>)}</div>
          {fMedia.length===0?<Cd><div style={{textAlign:"center",padding:32,color:"#9ca3af"}}><p style={{fontSize:32,marginBottom:8}}>📷</p><p>No {mFilt==="all"?"media":mFilt+"s"} found</p></div></Cd>:
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>{fMedia.map(m=><div key={m.id} style={{borderRadius:12,overflow:"hidden",border:"1px solid #e5e7eb",background:"#fff"}}><div onClick={()=>setPrev(m)} style={{cursor:"pointer",position:"relative"}}>{m.type==="video"?<div style={{width:"100%",height:120,background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>{m.thumb?<img src={m.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}}/>:null}<span style={{position:"absolute",width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff"}}>▶</span></div>:<img src={m.thumb} alt={m.label} style={{width:"100%",height:120,objectFit:"cover"}}/>}</div><div style={{padding:"10px 12px"}}><p style={{fontSize:13,fontWeight:500,color:"#1e293b",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.label}</p><p style={{fontSize:11,color:"#9ca3af",margin:"2px 0 8px"}}>{m.source}</p><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button onClick={()=>setPrev(m)} style={S.aBtn}>{m.type==="video"?"▶ Play":"🔍 Preview"}</button><button onClick={()=>useHero(m)} style={S.aBtn}>🖼 Hero</button><button onClick={()=>cpUrl(m.url)} style={S.aBtn}>{copied===m.url?"✓ Copied":"🔗 Copy"}</button></div></div></div>)}</div>}
        </>}

        {/* ═══ LOCATIONS ═══ */}
        {tab==="locations"&&<>
          <Hd t="Location Pages" s="AI-generated SEO pages for areas you serve"/>

          {/* Generator */}
          <Cd t="Generate New Location" s="Enter a location — AI writes the full SEO page">
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input type="text" value={newLoc} onChange={e=>setNewLoc(e.target.value)} placeholder="e.g. Playa Hermosa" style={{...S.inp,flex:2}} onKeyDown={e=>e.key==="Enter"&&genLoc()}/>
              <input type="text" value={newReg} onChange={e=>setNewReg(e.target.value)} placeholder="Region (optional)" style={{...S.inp,flex:1}}/>
            </div>
            <button onClick={genLoc} disabled={genning||!newLoc.trim()} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:genning?"#a5b4fc":"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:14,fontWeight:600,cursor:genning?"wait":"pointer",fontFamily:"inherit"}}>{genning?"✨ Generating content…":"✨ Generate with AI"}</button>
            {genErr&&<p style={{color:"#dc2626",fontSize:13,marginTop:8}}>{genErr}</p>}
          </Cd>

          {/* Location list (when not editing) */}
          {!editLoc&&locs.map(loc=>(
            <div key={loc.id} style={{...cardS,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:15,fontWeight:600,color:"#0f172a"}}>{loc.location_name}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:loc.published?"#dcfce7":"#fef3c7",color:loc.published?"#166534":"#92400e",fontWeight:500}}>{loc.published?"Published":"Draft"}</span>
                </div>
                <p style={{fontSize:12,color:"#9ca3af",margin:"2px 0 0"}}>/{loc.location_slug}{loc.region?` · ${loc.region}`:""}</p>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>setEditLoc(loc.id)} style={S.aBtn}>Edit</button>
                <button onClick={()=>togglePub(loc)} style={S.aBtn}>{loc.published?"Unpublish":"Publish"}</button>
                {loc.published&&<a href={`https://${handle}.p2v.homes/locations/${loc.location_slug}`} target="_blank" rel="noopener noreferrer" style={{...S.aBtn,textDecoration:"none"}}>View ↗</a>}
              </div>
            </div>
          ))}

          {/* Editing a location */}
          {eLoc&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <button onClick={()=>setEditLoc(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#6366f1",fontFamily:"inherit",fontWeight:500}}>← Back to list</button>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>togglePub(eLoc)} style={{...S.aBtn,background:eLoc.published?"#fef2f2":"#dcfce7",color:eLoc.published?"#991b1b":"#166534"}}>{eLoc.published?"Unpublish":"Publish"}</button>
                <button onClick={()=>{if(confirm("Delete this location page?"))delLoc(eLoc.id)}} style={{...S.aBtn,color:"#ef4444",borderColor:"#fecaca"}}>Delete</button>
              </div>
            </div>

            <Cd t="SEO">
              <Fl l="Page Title" v={eLoc.page_title??""} onChange={v=>upLocF(eLoc.id,"page_title",v)}/><span style={{fontSize:11,color:(eLoc.page_title?.length||0)>60?"#ef4444":"#9ca3af"}}>{eLoc.page_title?.length||0}/60</span>
              <TA l="Meta Description" v={eLoc.meta_description??""} onChange={v=>upLocF(eLoc.id,"meta_description",v)} rows={2}/><span style={{fontSize:11,color:(eLoc.meta_description?.length||0)>160?"#ef4444":"#9ca3af"}}>{eLoc.meta_description?.length||0}/160</span>
              <div style={S.fg}><label style={S.lb}>Keywords</label><p style={{fontSize:12,color:"#6b7280",margin:0}}>{eLoc.keywords?.join(", ")||"None"}</p></div>
            </Cd>

            <Cd t="Hero Photo">{eLoc.hero_photo_url?<div><img src={eLoc.hero_photo_url} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:8}}/><button onClick={()=>upLocF(eLoc.id,"hero_photo_url",null)} style={S.dng}>Remove</button></div>:<button onClick={()=>setLocPicker({locId:eLoc.id,idx:-1})} style={{width:"100%",padding:14,borderRadius:12,border:"2px dashed #d1d5db",background:"#fafafa",cursor:"pointer",fontSize:13,color:"#6b7280",fontWeight:500,fontFamily:"inherit"}}>📂 Choose from your photos</button>}</Cd>

            <Cd t="Content">
              <Fl l="Heading" v={eLoc.hero_heading??""} onChange={v=>upLocF(eLoc.id,"hero_heading",v)}/>
              <TA l="Intro Text" v={eLoc.intro_text??""} onChange={v=>upLocF(eLoc.id,"intro_text",v)} rows={3}/>
              <TA l="Body Content (Markdown)" v={eLoc.body_content??""} onChange={v=>upLocF(eLoc.id,"body_content",v)} rows={16}/>
            </Cd>

            <Cd t="Photos & Alt Tags" s="AI-suggested photos with SEO alt text — add your own">
              {eLoc.photos.map((ph,i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:i<eLoc.photos.length-1?"1px solid #f1f5f9":"none"}}>
                  <div style={{width:80,height:56,borderRadius:6,overflow:"hidden",flexShrink:0,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {ph.url?<img src={ph.url} alt={ph.alt} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<button onClick={()=>setLocPicker({locId:eLoc.id,idx:i})} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#9ca3af"}}>+</button>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,color:"#374151",margin:"0 0 2px",fontWeight:500}}>Alt: {ph.alt}</p>
                    {ph.url&&<button onClick={()=>{const photos=[...eLoc.photos];photos[i]={...photos[i],url:null};upLocF(eLoc.id,"photos",photos)}} style={{fontSize:11,color:"#ef4444",border:"none",background:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>Remove</button>}
                  </div>
                </div>
              ))}
            </Cd>

            <Cd t="Highlights">
              {eLoc.highlights.map((h,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:"#6366f1",marginTop:10}}>✦</span><input type="text" value={h} onChange={e=>{const hl=[...eLoc.highlights];hl[i]=e.target.value;upLocF(eLoc.id,"highlights",hl)}} style={{...S.inp,flex:1}}/></div>)}
            </Cd>
          </>}
        </>}

        {/* ═══ FAQ ═══ */}
        {tab==="faq"&&<><Hd t="FAQ" s="Frequently asked questions on your homepage"/>{site.faq_items.map((item,i)=><Cd key={i}><Fl l={`Question ${i+1}`} v={item.question} onChange={v=>upFaq(i,"question",v)} ph="e.g. What areas do you cover?"/><TA l="Answer" v={item.answer} onChange={v=>upFaq(i,"answer",v)} ph="Your answer…" rows={3}/><button onClick={()=>rmFaq(i)} style={S.dng}>Remove</button></Cd>)}<button onClick={addFaq} style={S.addB}>+ Add FAQ item</button></>}

        {/* ═══ FEATURES ═══ */}
        {tab==="features"&&<><Hd t="Features" s="Toggle site sections on or off"/><Cd><Tg l="Blog" d="Show blog page and nav link" on={site.blog_enabled} onT={()=>up("blog_enabled",!site.blog_enabled)}/><Tg l="Calendar" d="Show calendar page for bookings" on={site.calendar_enabled} onT={()=>up("calendar_enabled",!site.calendar_enabled)}/><Tg l="Listings" d="Show your property listings" on={site.listings_opt_in} onT={()=>up("listings_opt_in",!site.listings_opt_in)} last/></Cd></>}

      </div></main>

      {/* Media Picker */}
      {pkOpen&&<div className="mbg" onClick={()=>{setPkOpen(false);setPkTgt(null)}}><div className="mbox" onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16,fontWeight:600}}>Choose from your media</h3><button onClick={()=>{setPkOpen(false);setPkTgt(null)}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>×</button></div>{pkMedia.length===0?<p style={{textAlign:"center",color:"#9ca3af",padding:32}}>No matching media</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>{pkMedia.map(m=><div key={m.id} onClick={()=>pick(m.url)} className="ptb" style={{cursor:"pointer"}}>{m.type==="video"?<div style={{width:"100%",height:90,background:"#111",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>{m.thumb?<img src={m.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:.4}}/>:null}<span style={{position:"absolute",fontSize:20,color:"white"}}>▶</span></div>:<img src={m.thumb} alt={m.label} style={{width:"100%",height:90,objectFit:"cover",borderRadius:8}}/>}<p style={{fontSize:11,color:"#6b7280",margin:"4px 0 0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.label}</p></div>)}</div>}</div></div>}

      {/* Preview Modal */}
      {prev&&<div className="mbg" onClick={()=>setPrev(null)}><div className="mbox" onClick={e=>e.stopPropagation()} style={{maxWidth:900}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><h3 style={{margin:0,fontSize:16,fontWeight:600}}>{prev.label}</h3><p style={{margin:"2px 0 0",fontSize:12,color:"#9ca3af"}}>{prev.source}</p></div><button onClick={()=>setPrev(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>×</button></div>{prev.type==="video"?prev.url.includes("drive.google.com")?<div style={{position:"relative",paddingBottom:"56.25%",background:"#000",borderRadius:8,overflow:"hidden"}}><iframe src={prev.url.replace("/view","/preview")} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}} allowFullScreen/></div>:<video src={prev.url} controls autoPlay style={{width:"100%",borderRadius:8,maxHeight:500}}/>:<img src={prev.url} alt={prev.label} style={{width:"100%",borderRadius:8,maxHeight:600,objectFit:"contain",background:"#f1f5f9"}}/>}<div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}><button onClick={()=>useHero(prev)} style={S.aBtnL}>🖼 Use as hero</button><button onClick={()=>cpUrl(prev.url)} style={S.aBtnL}>{copied===prev.url?"✓ Copied!":"🔗 Copy link"}</button><a href={prev.url} target="_blank" rel="noopener noreferrer" style={{...S.aBtnL,textDecoration:"none"}}>↗ Open original</a></div></div></div>}

      {/* Location Photo Picker */}
      {locPicker&&<div className="mbg" onClick={()=>setLocPicker(null)}><div className="mbox" onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:16,fontWeight:600}}>Choose a photo</h3><button onClick={()=>setLocPicker(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>×</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>{media.filter(m=>m.type==="image").map(m=><img key={m.id} src={m.thumb||m.url} alt={m.label} onClick={()=>{setLocPhoto(locPicker.locId,locPicker.idx,m.url);setLocPicker(null)}} style={{width:"100%",height:90,objectFit:"cover",borderRadius:8,cursor:"pointer",border:"2px solid transparent"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"} onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}/>)}</div></div></div>}
    </div>
  );
}

// ─── Components ───
const cardS:React.CSSProperties={background:"#fff",border:"1px solid #eaedf0",borderRadius:14,padding:"20px 24px",marginBottom:12,boxShadow:"0 1px 2px rgba(0,0,0,0.03)"};
function Ctr({children}:{children:React.ReactNode}){return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif",padding:32,textAlign:"center",flexDirection:"column"}}>{children}</div>}
function SvBdg({s}:{s:SaveSt}){if(s==="idle")return null;const c={saving:{t:"Saving…",bg:"#fef3c7",fg:"#92400e"},saved:{t:"Saved ✓",bg:"#dcfce7",fg:"#166534"},error:{t:"Save failed",bg:"#fef2f2",fg:"#991b1b"}}[s]!;return<span style={{fontSize:12,padding:"4px 12px",borderRadius:99,background:c.bg,color:c.fg,fontWeight:500}}>{c.t}</span>}
function Hd({t,s}:{t:string;s:string}){return<div style={{marginBottom:16}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#0f172a"}}>{t}</h2><p style={{margin:"4px 0 0",fontSize:13,color:"#9ca3af"}}>{s}</p></div>}
function Cd({t,s,muted,children}:{t?:string;s?:string;muted?:boolean;children:React.ReactNode}){return<div style={{...cardS,background:muted?"#f8fafc":"#fff"}}>{t&&<div style={{marginBottom:14}}><span style={{fontSize:15,fontWeight:600,color:"#0f172a",display:"block"}}>{t}</span>{s&&<span style={{fontSize:12,color:"#9ca3af"}}>{s}</span>}</div>}{children}</div>}
function Fl({l,v,onChange,ph}:{l:string;v:string;onChange:(v:string)=>void;ph?:string}){return<div style={S.fg}><label style={S.lb}>{l}</label><input type="text" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph} style={S.inp}/></div>}
function TA({l,v,onChange,ph,rows=4}:{l:string;v:string;onChange:(v:string)=>void;ph?:string;rows?:number}){return<div style={S.fg}><label style={S.lb}>{l}</label><textarea value={v} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} style={S.ta}/></div>}
function Tg({l,d,on,onT,last}:{l:string;d:string;on:boolean;onT:()=>void;last?:boolean}){return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:last?"none":"1px solid #f1f5f9"}}><div><span style={{fontSize:14,fontWeight:500,color:"#1e293b"}}>{l}</span><p style={{margin:"2px 0 0",fontSize:12,color:"#9ca3af"}}>{d}</p></div><button onClick={onT} style={{width:46,height:25,borderRadius:99,background:on?"#6366f1":"#d1d5db",border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}><span style={{width:19,height:19,borderRadius:99,background:"#fff",position:"absolute",top:3,left:on?24:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/></button></div>}
function Inf({l,v}:{l:string;v:string|null}){return<div><span style={{color:"#9ca3af",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</span><p style={{margin:"2px 0 0",color:"#374151",fontSize:13}}>{v||"—"}</p></div>}
function UZ({accept,label,onChange,uping,prog,compact}:{accept:string;label:string;onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;uping:boolean;prog:number|null;compact?:boolean}){const r=useRef<HTMLInputElement>(null);return<div className="uz" onClick={()=>r.current?.click()} style={compact?{padding:14,flex:1}:{}}><input ref={r} type="file" accept={accept} onChange={onChange} style={{display:"none"}}/>{uping&&prog!==null?<div style={{width:"100%"}}><p style={{fontSize:13,color:"#6366f1",margin:"0 0 6px"}}>Uploading… {prog}%</p><div className="pb"><div className="pf" style={{width:`${prog}%`}}/></div></div>:<p style={{fontSize:13,color:"#6b7280",margin:0,fontWeight:500}}>{compact?"📎 ":"📤 "}{label}</p>}</div>}
function SU({accept,label,onChange,uping}:{accept:string;label:string;onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;uping:boolean}){const r=useRef<HTMLInputElement>(null);return<><input ref={r} type="file" accept={accept} onChange={onChange} style={{display:"none"}}/><button onClick={()=>r.current?.click()} style={S.sm} disabled={uping}>{uping?"…":`📎 ${label}`}</button></>}
function LB({label,onClick}:{label:string;onClick:()=>void}){return<button onClick={onClick} style={{flex:1,padding:14,borderRadius:12,border:"2px dashed #d1d5db",background:"#fafafa",cursor:"pointer",fontSize:13,color:"#6b7280",fontWeight:500,fontFamily:"inherit"}}>📂 {label}</button>}

const S:Record<string,React.CSSProperties>={
  page:{minHeight:"100vh",background:"#f8f9fb",fontFamily:"'DM Sans',system-ui,sans-serif"},
  hdr:{background:"#fff",borderBottom:"1px solid #eaedf0",padding:"0 20px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50},
  vBtn:{fontSize:13,color:"#6366f1",textDecoration:"none",fontWeight:500,padding:"6px 12px",borderRadius:8,border:"1px solid #e0e7ff",background:"#f5f3ff"},
  tBar:{background:"#fff",borderBottom:"1px solid #eaedf0",padding:"0 20px",display:"flex",gap:2,overflowX:"auto"},
  tI:{background:"none",border:"none",padding:"12px 14px",fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all .15s"},
  mn:{padding:20},ctr:{maxWidth:780,margin:"0 auto"},
  fg:{marginBottom:16},lb:{display:"block",fontSize:13,fontWeight:500,color:"#374151",marginBottom:5},
  inp:{width:"100%",padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:10,fontSize:14,color:"#0f172a",boxSizing:"border-box",background:"#fff",fontFamily:"inherit"},
  ta:{width:"100%",padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:10,fontSize:14,color:"#0f172a",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit",background:"#fff"},
  pBtn:{display:"inline-block",padding:"10px 28px",background:"#4f46e5",color:"#fff",borderRadius:10,textDecoration:"none",fontSize:14,fontWeight:600},
  sm:{fontSize:12,color:"#6b7280",border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",padding:"6px 12px",borderRadius:8,fontFamily:"inherit"},
  addB:{width:"100%",padding:14,borderRadius:12,border:"2px dashed #c7d2fe",background:"#fafafe",cursor:"pointer",fontSize:14,color:"#6366f1",fontWeight:500,fontFamily:"inherit"},
  dng:{fontSize:12,color:"#ef4444",border:"none",background:"none",cursor:"pointer",padding:"4px 0",fontFamily:"inherit",marginTop:8,display:"block"},
  aBtn:{fontSize:11,color:"#4f46e5",border:"1px solid #e0e7ff",background:"#f5f3ff",cursor:"pointer",padding:"4px 10px",borderRadius:6,fontFamily:"inherit",fontWeight:500,whiteSpace:"nowrap"},
  aBtnL:{fontSize:13,color:"#4f46e5",border:"1px solid #e0e7ff",background:"#f5f3ff",cursor:"pointer",padding:"8px 16px",borderRadius:8,fontFamily:"inherit",fontWeight:500,display:"inline-block"},
};
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box}body{margin:0}input:focus,textarea:focus{border-color:#6366f1!important;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.1)}.uz{border:2px dashed #d1d5db;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}.uz:hover{border-color:#6366f1;background:#f5f3ff}.tw{position:relative;display:inline-block}.tw .tx{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}.tw:hover .tx{opacity:1}.pb{height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden}.pf{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .3s}.mbg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}.mbox{background:#fff;border-radius:16px;width:90%;max-width:780px;max-height:85vh;overflow-y:auto;padding:24px;box-shadow:0 25px 50px rgba(0,0,0,.25)}.ptb:hover img,.ptb:hover div{outline:2px solid #6366f1;outline-offset:-2px;border-radius:8px}`;
