import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

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

  const canPost=!(mcUploading||(!mcFile&&!mcCaption.trim()));

  return (
            <div className="tfx cb cb-mc">
              {/* Header */}
              <section className="tfx-card cb-head">
                <div>
                  <div className="tfx-eyebrow cb-eb-ember">MCastles</div>
                  <h2>Photo of the week</h2>
                  <p>Upload · Motivate · Inspire</p>
                </div>
              </section>

              {/* Currently live */}
              {mcCurrentPhoto&&(
                <section className="tfx-card cb-sec">
                  <div className="cb-sec-head">
                    <div>
                      <div className="cb-live"><i className="tfx-livedot"/><span className="tfx-eyebrow">Currently live</span></div>
                      {mcCurrentPhoto.week_label&&<h3>{mcCurrentPhoto.week_label}</h3>}
                    </div>
                  </div>
                  {mcCurrentPhoto.day&&<img className="cb-live-img" src={mcCurrentPhoto.day} alt="Current motivational"/>}
                  {mcCurrentPhoto.message&&<p className="cb-caption">&ldquo;{mcCurrentPhoto.message}&rdquo;</p>}
                </section>
              )}

              {/* Post form */}
              <section className="tfx-card cb-sec">
                <div className="cb-sec-head"><h3>Post new photo of the week</h3></div>

                {/* Photo picker */}
                <div className="cb-fld">
                  <div className="cb-lbl">Photo</div>
                  <label className="cb-photo">
                    <input type="file" accept="image/*" className="cb-file" onChange={e=>{
                      const f=e.target.files?.[0];
                      if(!f)return;
                      setMcFile(f);
                      setMcPreview(URL.createObjectURL(f));
                      setMcSuccess(false);setMcError("");
                    }}/>
                    {mcPreview?(
                      <span className="cb-preview">
                        <img src={mcPreview} alt="Selected photo"/>
                        <span>Tap to change</span>
                      </span>
                    ):(
                      <span className="cb-drop">
                        <Icon name="camera" size={20}/> Tap to choose photo
                      </span>
                    )}
                  </label>
                </div>

                {/* Week label */}
                <label className="cb-fld">
                  <span className="cb-lbl">Week label</span>
                  <input className="tfx-field cb-field" value={mcWeek} onChange={e=>setMcWeek(e.target.value)} placeholder='e.g. "Week 3 — May 2026"'/>
                </label>

                {/* Caption */}
                <label className="cb-fld">
                  <span className="cb-lbl">Caption / message</span>
                  <textarea className="tfx-field cb-field" value={mcCaption} onChange={e=>setMcCaption(e.target.value)} placeholder="Write something motivational..." rows={3}/>
                </label>

                {mcError&&<div className="ir-err" role="alert">{mcError}</div>}
                {mcSuccess&&<div className="cb-ok" role="status">✓ Posted! Athletes can see it now.</div>}

                <button
                  className={"tfx-btn cb-btn-block tfx-press"+(canPost?"":" is-off")}
                  disabled={mcUploading||(!mcFile&&!mcCaption.trim())}
                  onClick={()=>postMcPhoto(mcFile||null)}>
                  {mcUploading?"Posting...":"Post photo of the week"}
                </button>
              </section>
            </div>
  );
}
