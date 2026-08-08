import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RED, GREEN, GOLD, ORANGE } from "../lib/constants";

export default function MCastlesPostTab(){
  const[mcCurrentPhoto,setMcCurrentPhoto]=useState(null);
  const[mcCaption,setMcCaption]=useState("");
  const[mcWeek,setMcWeek]=useState("");
  const[mcUploading,setMcUploading]=useState(false);
  const[mcError,setMcError]=useState("");
  const[mcFile,setMcFile]=useState(null);
  const[mcPreview,setMcPreview]=useState(null);
  const[mcSuccess,setMcSuccess]=useState(false);

  useEffect(()=>{loadMcPhoto();},[]);

  const loadMcPhoto=async()=>{
    try{
      const{data}=await supabase.from("announcements").select("*").eq("type","mcastles").order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data){setMcCurrentPhoto(data);setMcCaption(data.message||"");setMcWeek(data.week_label||"");}
    }catch(e){}
  };

  const uploadMotivationalPhoto=async(file)=>{
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("Could not read file"));
      reader.onload=ev=>{
        const img=new Image();
        img.onerror=()=>reject(new Error("Could not decode image"));
        img.onload=()=>{
          const MAX=900;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const canvas=document.createElement("canvas");
          canvas.width=Math.round(img.width*scale);
          canvas.height=Math.round(img.height*scale);
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(async blob=>{
            try{
              const fileName=`motivational_${Date.now()}.jpg`;
              const{error:upErr}=await supabase.storage.from("athlete-photos").upload(fileName,blob,{contentType:"image/jpeg",upsert:true});
              if(upErr){reject(upErr);return;}
              const{data:{publicUrl}}=supabase.storage.from("athlete-photos").getPublicUrl(fileName);
              resolve(publicUrl);
            }catch(e){reject(e);}
          },"image/jpeg",0.85);
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const postMcPhoto=async(file)=>{
    setMcUploading(true);setMcError("");setMcSuccess(false);
    try{
      let photoUrl=mcCurrentPhoto?.day||null;
      if(file){photoUrl=await uploadMotivationalPhoto(file);}
      if(!photoUrl&&!mcCaption.trim()){setMcError("Add a photo or caption first.");setMcUploading(false);return;}
      const{error:insErr}=await supabase.from("announcements").insert({
        message:mcCaption.trim(),
        week_label:mcWeek.trim(),
        day:photoUrl,
        type:"mcastles",
        active:false
      });
      if(insErr){setMcError("Save failed: "+insErr.message);setMcUploading(false);return;}
      await loadMcPhoto();
      setMcCaption("");setMcWeek("");setMcFile(null);setMcPreview(null);setMcSuccess(true);
    }catch(e){setMcError("Error: "+e.message);}
    setMcUploading(false);
  };

  return (
            <div>
              {/* Hero banner */}
              <div style={{borderRadius:16,marginBottom:14,overflow:"hidden",border:"1px solid "+ORANGE+"44",position:"relative"}}>
                <div style={{background:"linear-gradient(140deg,#1a0800,#0f0600)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+ORANGE+","+GOLD+",transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,fontSize:72,opacity:0.07,lineHeight:1,userSelect:"none"}}>🍑</div>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(145deg,"+ORANGE+"44,"+ORANGE+"22)",border:"1px solid "+ORANGE+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 0 20px "+ORANGE+"33"}}>🍑🚀</div>
                    <div>
                      <div style={{fontSize:9,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.22em",fontWeight:900,marginBottom:2}}>MCASTLES</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Photo of the Week</div>
                      <div style={{fontSize:11,color:"#555",marginTop:1}}>Upload · Motivate · Inspire</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Currently live */}
              {mcCurrentPhoto&&(
                <div style={{background:"#111",borderRadius:14,padding:"14px",marginBottom:14,border:"0.5px solid #1e1e1e"}}>
                  <div style={{fontSize:10,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:8}}>Currently Live</div>
                  {mcCurrentPhoto.week_label&&<div style={{fontSize:11,color:"#777",marginBottom:6}}>{mcCurrentPhoto.week_label}</div>}
                  {mcCurrentPhoto.day&&<img src={mcCurrentPhoto.day} alt="Current motivational" style={{width:"100%",borderRadius:10,marginBottom:8,display:"block"}}/>}
                  {mcCurrentPhoto.message&&<div style={{fontSize:13,color:"#ccc",fontStyle:"italic",lineHeight:1.6}}>&ldquo;{mcCurrentPhoto.message}&rdquo;</div>}
                </div>
              )}

              {/* Post form */}
              <div style={{background:"#111",borderRadius:14,padding:"16px",border:"0.5px solid "+ORANGE+"33"}}>
                <div style={{fontSize:12,fontWeight:700,color:ORANGE,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em"}}>Post New Photo of the Week</div>

                {/* Photo picker */}
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:6}}>Photo</div>
                  <label style={{display:"block",cursor:"pointer"}}>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const f=e.target.files?.[0];
                      if(!f)return;
                      setMcFile(f);
                      setMcPreview(URL.createObjectURL(f));
                      setMcSuccess(false);setMcError("");
                    }}/>
                    {mcPreview?(
                      <div style={{position:"relative"}}>
                        <img src={mcPreview} style={{width:"100%",borderRadius:10,maxHeight:200,objectFit:"cover",display:"block"}}/>
                        <div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.7)",borderRadius:6,padding:"3px 8px",fontSize:11,color:ORANGE}}>tap to change</div>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"18px",borderRadius:10,border:"1px dashed "+ORANGE+"55",background:"#0f0600",color:ORANGE,fontSize:13,fontWeight:600}}>
                        📸 Tap to choose photo
                      </div>
                    )}
                  </label>
                </div>

                {/* Week label */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:4}}>Week label</div>
                  <input value={mcWeek} onChange={e=>setMcWeek(e.target.value)} placeholder='e.g. "Week 3 — May 2026"'
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #2a2a2a",fontSize:13,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",boxSizing:"border-box"}}/>
                </div>

                {/* Caption */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:"#666",marginBottom:4}}>Caption / message</div>
                  <textarea value={mcCaption} onChange={e=>setMcCaption(e.target.value)} placeholder="Write something motivational..." rows={3}
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #2a2a2a",fontSize:13,background:"#1a1a1a",color:"#ddd",fontFamily:"Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/>
                </div>

                {mcError&&<div style={{fontSize:12,color:RED,marginBottom:10,padding:"8px 10px",background:"#1a0808",borderRadius:6,border:"0.5px solid "+RED+"33"}}>{mcError}</div>}
                {mcSuccess&&<div style={{fontSize:12,color:GREEN,marginBottom:10,padding:"8px 10px",background:"#081a0d",borderRadius:6,border:"0.5px solid "+GREEN+"33"}}>✓ Posted! Athletes can see it now.</div>}

                <button
                  disabled={mcUploading||(!mcFile&&!mcCaption.trim())}
                  onClick={()=>postMcPhoto(mcFile||null)}
                  style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:mcUploading?"#333":ORANGE,color:"#fff",fontSize:15,fontWeight:800,cursor:mcUploading?"not-allowed":"pointer",fontFamily:"Georgia,serif",opacity:(mcUploading||(!mcFile&&!mcCaption.trim()))?0.5:1,letterSpacing:"0.02em"}}>
                  {mcUploading?"⏳ Posting...":"🍑🚀 Post Photo of the Week"}
                </button>
              </div>
            </div>
  );
}
