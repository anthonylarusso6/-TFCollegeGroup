import { useState, useEffect } from "react";
import { GOLD, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { Skeleton } from "./Skeleton";
import EmptyState from "./EmptyState";
import Icon from "./Icon";

export default function GroupPhotos(){
  const[photos,setPhotos]=useState([]);
  const[driveLinks,setDriveLinks]=useState([]);
  const[selected,setSelected]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("announcements").select("*").eq("type","group_photo")
          .eq("active",true).order("created_at",{ascending:false});
        setPhotos(data||[]);
      }catch(e){setPhotos([]);}
      try{
        const{data}=await supabase.from("announcements").select("*").eq("type","drive_link")
          .eq("active",true).order("created_at",{ascending:false});
        setDriveLinks(data||[]);
      }catch(e){setDriveLinks([]);}
      setLoading(false);
    })();
  },[]);

  if(loading)return(
    <div>
      <Skeleton height={64} radius={12} style={{marginBottom:12}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {Array.from({length:4}).map((_,i)=><Skeleton key={i} height={150} radius={12}/>)}
      </div>
    </div>
  );

  return(
    <div>
      {/* Drive links — glass card */}
      {driveLinks.length>0&&(
        <div style={{background:"rgba(255,255,255,0.045)",borderRadius:14,padding:"1.25rem",marginBottom:12,border:"1px solid rgba(255,255,255,0.08)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GOLD+","+ORANGE+",transparent)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <Icon name="fileText" size={14} color={GOLD}/>
            <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>Program Documents</span>
          </div>
          <div style={{fontSize:11,color:"#555",marginBottom:12}}>Tap to open in Google Drive</div>
          {driveLinks.map((link,i)=>{
            const d=JSON.parse(link.message||"{}");
            return(
              <button key={i} onClick={()=>window.open(d.url,"_blank")}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:8,textAlign:"left",transition:"background 0.15s"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#1a66cc,#4285f4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon name="fileText" size={18} color="#fff"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title||"Program Document"}</div>
                  <div style={{fontSize:11,color:"#555",marginTop:2}}>{d.description||"Tap to view in Google Drive"}</div>
                </div>
                <Icon name="chevronRight" size={14} color="rgba(255,255,255,0.3)"/>
              </button>
            );
          })}
        </div>
      )}

      {/* Photos grid */}
      {photos.length>0?(
        <>
          <div style={{fontSize:11,color:"#555",marginBottom:10,paddingLeft:2,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="camera" size={12} color="#555"/>
            {photos.length} photo{photos.length!==1?"s":""} · tap to expand
          </div>
          <div style={{columns:2,columnGap:8}}>
            {photos.map((p,i)=>{
              const caption=p.message||"";
              const url=p.day;
              const dateStr=new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
              return(
                <div key={i} onClick={()=>setSelected({url,caption,date:dateStr})}
                  style={{breakInside:"avoid",marginBottom:8,borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",display:"block",border:"1px solid rgba(255,255,255,0.08)"}}>
                  <img src={url} style={{width:"100%",display:"block"}} alt=""/>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"22px 10px 8px",background:"linear-gradient(to top,rgba(0,0,0,0.75),transparent)"}}>
                    {caption&&<div style={{fontSize:10,color:"#fff",lineHeight:1.3,fontWeight:600,textShadow:"0 1px 4px rgba(0,0,0,0.7)"}}>{caption}</div>}
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:caption?2:0}}>{dateStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ):(
        <EmptyState icon="camera" color={GOLD} title="No photos yet" hint="Coach Ant will post group photos here. Check back soon!" />
      )}

      {/* Fullscreen lightbox */}
      {selected&&(
        <div onClick={()=>setSelected(null)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"1.5rem"}}>
          <img src={selected.url} style={{maxWidth:"95vw",maxHeight:"72vh",borderRadius:12,objectFit:"contain"}} alt=""/>
          {selected.caption&&(
            <div style={{fontSize:13,color:"#fff",textAlign:"center",maxWidth:"80vw",lineHeight:1.5,fontWeight:500}}>{selected.caption}</div>
          )}
          <div style={{fontSize:11,color:"#555"}}>{selected.date}</div>
          <a href={selected.url} download target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 22px",borderRadius:22,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.16)",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>
            <Icon name="camera" size={13} color="#fff"/> Save Photo
          </a>
          <div style={{fontSize:10,color:"#444"}}>Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
}
