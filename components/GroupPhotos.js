import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function GroupPhotos(){
  const[photos,setPhotos]=useState([]);
  const[selected,setSelected]=useState(null);
  useEffect(()=>{
    supabase.from("athletes").select("name,photo_url").not("photo_url","is",null).then(({data})=>setPhotos(data||[])).catch(()=>setPhotos([]));
  },[]);
  return(
    <div>
      <div style={{background:"#0f0f0f",borderRadius:12,padding:"1.25rem",marginBottom:12,border:"0.5px solid #333"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:4}}>📸 Group Photos</div>
        <div style={{fontSize:12,color:"#888"}}>Your crew.</div>
      </div>
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
          <img src={selected.photo_url} style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}} alt={selected.name}/>
          <div style={{fontSize:14,color:"#fff"}}>{selected.name}</div>
        </div>
      )}
      {photos.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0"}}><div style={{fontSize:13,color:"#888"}}>No photos yet. Coach Ant can add them from the roster.</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {photos.map((p,i)=>(
          <div key={i} onClick={()=>setSelected(p)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#f0f0f0"}}>
            <img src={p.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={p.name}/>
          </div>
        ))}
      </div>
    </div>
  );
}
