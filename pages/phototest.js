import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function PhotoTest(){
  const[log,setLog]=useState([]);
  const[preview,setPreview]=useState(null);
  const[athleteId,setAthleteId]=useState("");

  const addLog=(msg)=>setLog(p=>[...p,new Date().toLocaleTimeString()+": "+msg]);

  const handleFile=async(e)=>{
    const file=e.target.files[0];
    if(!file){addLog("No file selected");return;}
    addLog("File selected: "+file.name+" ("+Math.round(file.size/1024)+"KB)");

    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const dataUrl=ev.target.result;
      addLog("FileReader done, dataUrl length: "+dataUrl.length);

      // Compress
      const img=new Image();
      img.onload=async()=>{
        addLog("Image loaded: "+img.width+"x"+img.height);
        const canvas=document.createElement("canvas");
        canvas.width=150;canvas.height=150;
        const ctx=canvas.getContext("2d");
        const min=Math.min(img.width,img.height);
        ctx.drawImage(img,(img.width-min)/2,(img.height-min)/2,min,min,0,0,150,150);
        const compressed=canvas.toDataURL("image/jpeg",0.5);
        addLog("Compressed size: "+Math.round(compressed.length/1024)+"KB");
        setPreview(compressed);

        if(!athleteId){addLog("No athlete ID entered — not saving to DB");return;}

        addLog("Saving to DB for athlete: "+athleteId);
        const{data,error}=await supabase.from("athletes")
          .update({photo_url:compressed})
          .eq("id",athleteId)
          .select("id,name,photo_url");
        if(error){addLog("DB ERROR: "+JSON.stringify(error));}
        else{addLog("DB SUCCESS: "+JSON.stringify(data));}
      };
      img.onerror=()=>addLog("Image load ERROR");
      img.src=dataUrl;
    };
    reader.onerror=()=>addLog("FileReader ERROR");
    reader.readAsDataURL(file);
  };

  return(
    <div style={{padding:20,fontFamily:"monospace",maxWidth:600}}>
      <h2>Photo Upload Test</h2>
      <div style={{marginBottom:12}}>
        <label>Athlete ID (from Supabase):</label><br/>
        <input value={athleteId} onChange={e=>setAthleteId(e.target.value)} style={{width:"100%",padding:8,marginTop:4,border:"1px solid #ccc",borderRadius:4}}/>
      </div>
      <input type="file" accept="image/*" onChange={handleFile} style={{marginBottom:12}}/>
      {preview&&<img src={preview} style={{width:150,height:150,objectFit:"cover",borderRadius:"50%",display:"block",marginBottom:12}}/>}
      <div style={{background:"#f5f5f5",padding:12,borderRadius:8,fontSize:12}}>
        {log.length===0?<div>No logs yet</div>:log.map((l,i)=><div key={i} style={{marginBottom:4,color:l.includes("ERROR")?"red":l.includes("SUCCESS")?"green":"#333"}}>{l}</div>)}
      </div>
    </div>
  );
}
