import { useState, useEffect } from "react";
import { PUR, RED, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

function DriveLinksManager(){
  const[links,setLinks]=useState([]);
  const[title,setTitle]=useState("");
  const[url,setUrl]=useState("");
  const[desc,setDesc]=useState("");
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{const{data}=await supabase.from("announcements").select("*").eq("type","drive_link").eq("active",true).order("created_at",{ascending:false});setLinks(data||[]);}catch(e){}
    })();
  },[]);

  const addLink=async()=>{
    if(!title.trim()||!url.trim())return;
    setSaving(true);
    try{
      const{data}=await supabase.from("announcements").insert({
        type:"drive_link",active:true,
        message:JSON.stringify({title,url,description:desc})
      }).select().single();
      if(data)setLinks(p=>[data,...p]);
    }catch(e){}
    setTitle("");setUrl("");setDesc("");setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const removeLink=async(id)=>{
    try{await supabase.from("announcements").update({active:false}).eq("id",id);}catch(e){}
    setLinks(p=>p.filter(l=>l.id!==id));
  };

  return(
    <>
      {links.length>0&&(
        <div className="cc-docs">
          {links.map((l,i)=>{
            let data={};try{data=JSON.parse(l.message||"{}")||{};}catch(e){data={url:l.message};}
            return(
              <div key={i} className="cc-doc">
                <span className="cc-doc-ico"><Icon name="fileText" size={18}/></span>
                <div className="cc-doc-txt">
                  <b>{data.title}</b>
                  {data.description&&<small>{data.description}</small>}
                </div>
                <a className="cc-mini is-tint" href={data.url} target="_blank" rel="noreferrer">Open</a>
                <button className="cc-mini is-danger" onClick={()=>removeLink(l.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="cc-form">
        <input className="cc-in" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title (e.g. Summer Program Poster)" aria-label="Document title"/>
        <input className="cc-in" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Google Drive link" aria-label="Google Drive link"/>
        <input className="cc-in" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description (optional)" aria-label="Short description"/>
        <button className={"tfx-btn tfx-press cc-btn cc-wide cc-accent"+(saved?" is-green":"")} onClick={addLink} disabled={!title.trim()||!url.trim()||saving}>
          {saved?"✓ Added!":saving?"Saving...":"Add document →"}
        </button>
      </div>
    </>
  );
}

export default function PhotosTab({ athletes, setAthletes, uploadAthletePhoto }){
  const[gpCaption,setGpCaption]=useState("");
  const[gpFile,setGpFile]=useState(null);
  const[gpPreview,setGpPreview]=useState(null);
  const[gpUploading,setGpUploading]=useState(false);
  const[gpError,setGpError]=useState("");
  const[gpSuccess,setGpSuccess]=useState(false);
  const[gpPhotos,setGpPhotos]=useState([]);
  const[uploadingPhoto,setUploadingPhoto]=useState(null);

  const loadGroupPhotos=async()=>{
    try{const{data}=await supabase.from("announcements").select("*").eq("type","group_photo").eq("active",true).order("created_at",{ascending:false}).limit(30);if(data)setGpPhotos(data);}catch(e){}
  };

  const uploadGroupPhoto=async(file)=>{
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error("Could not read file"));
      reader.onload=ev=>{
        const img=new Image();
        img.onerror=()=>reject(new Error("Could not decode image"));
        img.onload=()=>{
          // Keep full resolution up to 4000px — high quality for download
          const MAX=4000;
          const scale=Math.min(1,MAX/Math.max(img.width,img.height));
          const canvas=document.createElement("canvas");
          canvas.width=Math.round(img.width*scale);
          canvas.height=Math.round(img.height*scale);
          canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(async blob=>{
            try{
              const fileName=`group_${Date.now()}.jpg`;
              const{error:upErr}=await supabase.storage.from("athlete-photos").upload(fileName,blob,{contentType:"image/jpeg",upsert:true});
              if(upErr){reject(upErr);return;}
              const{data:{publicUrl}}=supabase.storage.from("athlete-photos").getPublicUrl(fileName);
              resolve(publicUrl);
            }catch(e){reject(e);}
          },"image/jpeg",0.96);
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const postGroupPhoto=async()=>{
    if(!gpFile){setGpError("Select a photo first.");return;}
    setGpUploading(true);setGpError("");
    try{
      const url=await uploadGroupPhoto(gpFile);
      const{error}=await supabase.from("announcements").insert({type:"group_photo",day:url,message:gpCaption.trim(),active:true});
      if(error){setGpError("Post failed: "+error.message);setGpUploading(false);return;}
      await loadGroupPhotos();
      setGpFile(null);setGpPreview(null);setGpCaption("");
      setGpSuccess(true);setTimeout(()=>setGpSuccess(false),3000);
    }catch(e){setGpError("Post failed: "+e.message);}
    setGpUploading(false);
  };

  const deleteGroupPhoto=async(id)=>{
    try{
      await supabase.from("announcements").update({active:false}).eq("id",id);
      setGpPhotos(prev=>prev.filter(p=>p.id!==id));
    }catch(e){}
  };

  useEffect(()=>{ loadGroupPhotos(); },[]);

  const activeAthletes=athletes.filter(a=>a.status==="active");

  return (
    <div className="tfx cc">
      {/* ── Post group photos ── */}
      <section className="tfx-card cc-head is-violet">
        <div className="cc-top">
          <div>
            <div className="tfx-eyebrow">Group feed</div>
            <h2>Post photos</h2>
            <p>Athletes see these in their Photos tab</p>
          </div>
        </div>
        <label className="cc-drop">
          {gpPreview?(
            <img src={gpPreview} alt="Selected photo preview"/>
          ):(
            <span className="cc-drop-empty">
              <span><Icon name="camera" size={22}/></span>
              <b>Tap to choose photo</b>
              <small>Full quality, up to 4000px</small>
            </span>
          )}
          <input type="file" accept="image/*" className="cc-hide" onChange={e=>{
            const file=e.target.files[0];
            if(!file)return;
            setGpFile(file);
            const reader=new FileReader();
            reader.onload=ev=>setGpPreview(ev.target.result);
            reader.readAsDataURL(file);
          }}/>
        </label>
        <input className="cc-in" value={gpCaption} onChange={e=>setGpCaption(e.target.value)} placeholder="Caption (optional)..." aria-label="Caption"/>
        {gpError&&<div className="ir-err" role="alert">{gpError}</div>}
        <button className={"tfx-btn tfx-press cc-wide cc-accent"+(gpSuccess?" is-green":" is-pur")} onClick={postGroupPhoto} disabled={gpUploading||!gpFile}>
          {gpSuccess?"✓ Posted!":gpUploading?"Uploading...":"Post to athletes →"}
        </button>
        {gpPhotos.length>0&&(
          <div className="cc-divide cc-form">
            <div className="cc-sec-head">
              <div className="tfx-eyebrow">Posted · {gpPhotos.length}</div>
              <span className="cc-sub">Tap × to remove</span>
            </div>
            <div className="cc-thumbs">
              {gpPhotos.map((p,i)=>(
                <figure key={i} className="cc-thumb">
                  <img src={p.day} alt={p.message||""}/>
                  <button className="cc-thumb-x" onClick={()=>deleteGroupPhoto(p.id)} aria-label={"Remove photo"+(p.message?" — "+p.message:"")}>×</button>
                  {p.message&&<figcaption>{p.message}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Google Drive documents ── */}
      <section className="tfx-card cc-sec is-sky">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">Documents</div>
            <h3>Google Drive</h3>
            <p>Share docs, programs, or posters with athletes</p>
          </div>
        </div>
        <div className="cc-tip">
          <b>How to share from Google Drive:</b>
          <ol>
            <li>Open doc in Google Drive</li>
            <li>Share → Anyone with link</li>
            <li>Paste below</li>
          </ol>
        </div>
        <DriveLinksManager/>
      </section>

      {/* ── Athlete profile photos ── */}
      <section className="tfx-card cc-sec is-ember">
        <div className="cc-sec-head">
          <div>
            <div className="tfx-eyebrow">Profile photos</div>
            <h3>Athlete headshots</h3>
            <p>Used on profile cards, leaderboards, etc.</p>
          </div>
          <span className="cc-pill"><span className="tfx-num">{activeAthletes.filter(a=>a.photo_url).length}/{activeAthletes.length}</span></span>
        </div>
        <ul className="cc-heads">
          {activeAthletes.map((a,i)=>(
            <li key={i} className={a.photo_url?"":"is-missing"}>
              <span className="rk-av cc-av is-md" style={{"--c":STEEL}}>
                {a.photo_url?<img src={a.photo_url} onError={ev=>{ev.target.style.display="none";}} alt=""/>:(a.name||"?")[0]}
              </span>
              <span className="cc-who">
                <b>{a.name}</b>
                <small>{a.photo_url?"Photo on file":"No photo yet"}</small>
              </span>
              <label className={"cc-mini is-tint cc-upload"+(uploadingPhoto===a.id?" is-busy":"")}>
                {uploadingPhoto===a.id?"Saving...":a.photo_url?"Change":"Add Photo"}
                <input type="file" accept="image/*" capture="environment" className="cc-hide" onChange={async e=>{
                  const file=e.target.files[0];
                  if(!file)return;
                  setUploadingPhoto(a.id);
                  try{
                    const publicUrl=await uploadAthletePhoto(a.id,file);
                    const{error}=await supabase.from("athletes").update({photo_url:publicUrl}).eq("id",a.id);
                    if(error){alert("Error saving photo: "+error.message);}
                    else{setAthletes(prev=>prev.map(x=>x.id===a.id?{...x,photo_url:publicUrl}:x));}
                  }catch(err){alert("Error saving photo: "+err.message);}
                  setUploadingPhoto(null);
                }}/>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
