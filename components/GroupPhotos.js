import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";

export default function GroupPhotos(){
  const[photos,setPhotos]=useState([]);
  const[selected,setSelected]=useState(null);
  const[driveLinks,setDriveLinks]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("athletes").select("name,photo_url").not("photo_url","is",null);setPhotos(data||[]);}catch(e){setPhotos([]);}
      try{const{data}=await supabase.from("announcements").select("*").eq("type","drive_link").eq("active",true).order("created_at",{ascending:false});setDriveLinks(data||[]);}catch(e){setDriveLinks([]);}
    })();
  },[]);

  const openDriveLink=(url)=>{
    // Convert Google Drive share link to embeddable preview
    window.open(url,"_blank");
  };

  return(
    <div>
      {/* Google Drive documents */}
      {driveLinks.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📄 Program documents</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>Tap to open in Google Drive</div>
          {driveLinks.map((link,i)=>{
            const data=JSON.parse(link.message||"{}");
            return(
              <button key={i} onClick={()=>openDriveLink(data.url)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:"1px solid #f0f0f0",background:"#fafafa",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:8,textAlign:"left"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"#4285f4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:20}}>📄</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.title||"Program Document"}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{data.description||"Tap to view in Google Drive"}</div>
                </div>
                <div style={{fontSize:16,color:"#ccc"}}>→</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Athlete photos grid */}
      {photos.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:12}}>📸 Team photos</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {photos.map((p,i)=>(
              <div key={i} onClick={()=>setSelected(p)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#f0f0f0",position:"relative"}}>
                <img src={p.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={p.name}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"4px 6px",background:"linear-gradient(to top,rgba(0,0,0,0.6),transparent)"}}>
                  <div style={{fontSize:10,color:"#fff",fontWeight:600}}>{p.name.split(" ")[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
          <img src={selected.photo_url} style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}} alt=""/>
          <div style={{fontSize:14,color:"#fff",fontWeight:600}}>{selected.name}</div>
        </div>
      )}

      {photos.length===0&&driveLinks.length===0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:32,marginBottom:8}}>📸</div>
          <div style={{fontSize:13,color:"#888"}}>No photos yet. Coach Ant will add them here!</div>
        </div>
      )}
    </div>
  );
}
