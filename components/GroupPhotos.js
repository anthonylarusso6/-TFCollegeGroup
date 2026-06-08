import { useState, useEffect } from "react";
import { GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";

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
    <div style={{textAlign:"center",padding:"2rem",color:"#888",fontSize:13}}>Loading photos...</div>
  );

  return(
    <div>
      {driveLinks.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",marginBottom:12,
          border:"0.5px solid #e0e0e0",borderTop:"3px solid "+GOLD}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>📄 Program documents</div>
          <div style={{fontSize:12,color:"#888",marginBottom:12}}>Tap to open in Google Drive</div>
          {driveLinks.map((link,i)=>{
            const d=JSON.parse(link.message||"{}");
            return(
              <button key={i} onClick={()=>window.open(d.url,"_blank")}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                  borderRadius:10,border:"1px solid #f0f0f0",background:"#fafafa",cursor:"pointer",
                  fontFamily:"Georgia,serif",marginBottom:8,textAlign:"left"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"#4285f4",display:"flex",
                  alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>📄</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title||"Program Document"}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{d.description||"Tap to view in Google Drive"}</div>
                </div>
                <div style={{fontSize:16,color:"#ccc"}}>→</div>
              </button>
            );
          })}
        </div>
      )}

      {photos.length>0?(
        <>
          <div style={{fontSize:12,color:"#aaa",marginBottom:10,paddingLeft:2}}>
            {photos.length} photo{photos.length!==1?"s":""} · tap to expand
          </div>
          <div style={{columns:2,columnGap:8}}>
            {photos.map((p,i)=>{
              const caption=p.message||"";
              const url=p.day;
              const dateStr=new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
              return(
                <div key={i} onClick={()=>setSelected({url,caption,date:dateStr})}
                  style={{breakInside:"avoid",marginBottom:8,borderRadius:10,overflow:"hidden",
                    cursor:"pointer",position:"relative",display:"block"}}>
                  <img src={url} style={{width:"100%",display:"block"}} alt=""/>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 8px 6px",
                    background:"linear-gradient(to top,rgba(0,0,0,0.65),transparent)"}}>
                    {caption&&<div style={{fontSize:10,color:"#fff",lineHeight:1.3,fontWeight:600}}>{caption}</div>}
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:caption?2:0}}>{dateStr}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ):(
        <div style={{background:"#fff",borderRadius:12,padding:"2.5rem",textAlign:"center",
          border:"0.5px solid #e0e0e0"}}>
          <div style={{fontSize:40,marginBottom:10}}>📸</div>
          <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a",marginBottom:4}}>No photos yet</div>
          <div style={{fontSize:12,color:"#888"}}>Coach Ant will post group photos here!</div>
        </div>
      )}

      {selected&&(
        <div onClick={()=>setSelected(null)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:200,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:12,padding:"1.5rem"}}>
          <img src={selected.url}
            style={{maxWidth:"95vw",maxHeight:"72vh",borderRadius:10,objectFit:"contain"}} alt=""/>
          {selected.caption&&(
            <div style={{fontSize:13,color:"#fff",textAlign:"center",maxWidth:"80vw",
              lineHeight:1.5,fontWeight:500}}>{selected.caption}</div>
          )}
          <div style={{fontSize:11,color:"#555"}}>{selected.date}</div>
          <a href={selected.url} download target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",
              borderRadius:20,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",
              color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>
            ⬇ Save Photo
          </a>
          <div style={{fontSize:10,color:"#333"}}>Tap anywhere else to close</div>
        </div>
      )}
    </div>
  );
}
