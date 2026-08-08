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
    <div>
      {links.map((l,i)=>{
        const data=JSON.parse(l.message||"{}");
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#141414",borderRadius:10,marginBottom:8,border:"0.5px solid #252525"}}>
            <div style={{fontSize:20}}>📄</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#ddd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data.title}</div>
              {data.description&&<div style={{fontSize:11,color:"#666"}}>{data.description}</div>}
            </div>
            <a href={data.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#4285f4",textDecoration:"none",fontFamily:"Georgia,serif",padding:"4px 8px",border:"0.5px solid #4285f4",borderRadius:6}}>Open</a>
            <button onClick={()=>removeLink(l.id)} style={{fontSize:11,color:RED,background:"transparent",border:"0.5px solid "+RED+"44",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontFamily:"Georgia,serif"}}>Remove</button>
          </div>
        );
      })}
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Document title (e.g. Summer Program Poster)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Google Drive link" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:6,boxSizing:"border-box"}}/>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description (optional)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid #222",fontSize:12,fontFamily:"Georgia,serif",background:"#111",color:"#ddd",marginBottom:8,boxSizing:"border-box"}}/>
      <button onClick={addLink} disabled={!title.trim()||!url.trim()||saving} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:title&&url?"#4285f4":"#e0e0e0",color:title&&url?"#fff":"#aaa",fontSize:13,fontWeight:600,cursor:title&&url?"pointer":"not-allowed",fontFamily:"Georgia,serif"}}>
        {saved?"✓ Added!":saving?"Saving...":"Add document →"}
      </button>
    </div>
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

  return (
            <div>
              {/* ── Post group photos ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+PUR+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+PUR+"30,"+PUR+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+PUR+","+PUR+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="camera" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+PUR+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+PUR+"44,"+PUR+"22)",border:"1px solid "+PUR+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+PUR+"33"}}>📸</div>
                    <div>
                      <div style={{fontSize:8,color:PUR,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Group Feed</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Post Photos</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Athletes see these in their Photos tab</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <label style={{display:"block",marginBottom:10,cursor:"pointer"}}>
                    <div style={{borderRadius:12,overflow:"hidden",border:"1.5px dashed "+PUR+"55",background:"#0d0d0d",
                      minHeight:110,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      {gpPreview?(
                        <img src={gpPreview} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}} alt=""/>
                      ):(
                        <div style={{textAlign:"center",padding:"1.5rem"}}>
                          <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><Icon name="camera" size={28} color="rgba(255,255,255,0.4)"/></div>
                          <div style={{fontSize:12,color:"#555"}}>Tap to choose photo</div>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const file=e.target.files[0];
                      if(!file)return;
                      setGpFile(file);
                      const reader=new FileReader();
                      reader.onload=ev=>setGpPreview(ev.target.result);
                      reader.readAsDataURL(file);
                    }}/>
                  </label>
                  <input value={gpCaption} onChange={e=>setGpCaption(e.target.value)}
                    placeholder="Caption (optional)..."
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #252525",
                      background:"#0d0d0d",color:"#fff",fontSize:13,fontFamily:"Georgia,serif",
                      marginBottom:10,boxSizing:"border-box"}}/>
                  {gpError&&<div style={{fontSize:12,color:RED,marginBottom:8}}>{gpError}</div>}
                  <button onClick={postGroupPhoto} disabled={gpUploading||!gpFile}
                    style={{width:"100%",padding:"12px",borderRadius:10,border:"none",
                      background:gpUploading||!gpFile?"#252525":"linear-gradient(135deg,"+PUR+","+PUR+"cc)",
                      color:gpUploading||!gpFile?"#555":"#fff",fontSize:13,fontWeight:700,
                      cursor:gpUploading||!gpFile?"not-allowed":"pointer",fontFamily:"Georgia,serif"}}>
                    {gpSuccess?"✓ Posted!":gpUploading?"Uploading...":"Post to athletes →"}
                  </button>
                  {gpPhotos.length>0&&(
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:11,color:"#444",marginBottom:8}}>Posted ({gpPhotos.length}) · tap × to remove</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                        {gpPhotos.map((p,i)=>(
                          <div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"1",background:"#1a1a1a"}}>
                            <img src={p.day} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                            <button onClick={()=>deleteGroupPhoto(p.id)}
                              style={{position:"absolute",top:3,right:3,width:20,height:20,borderRadius:"50%",
                                border:"none",background:"rgba(0,0,0,0.75)",color:RED,cursor:"pointer",
                                fontSize:13,fontWeight:900,lineHeight:1,padding:0,display:"flex",
                                alignItems:"center",justifyContent:"center"}}>×</button>
                            {p.message&&(
                              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"2px 4px",
                                background:"rgba(0,0,0,0.6)",fontSize:8,color:"#ddd",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.message}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Google Drive documents ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid #4285f433"}}>
                <div style={{background:"linear-gradient(140deg,#4285f430,#4285f410,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#4285f4,#4285f444,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="fileText" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,#4285f412,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,#4285f444,#4285f422)",border:"1px solid #4285f444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px #4285f433"}}>📁</div>
                    <div>
                      <div style={{fontSize:8,color:"#4285f4",textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Documents</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Google Drive</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Share docs, programs, or posters with athletes</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{background:"#0a1520",borderRadius:8,padding:"10px 12px",marginBottom:12,border:"0.5px solid #4285f422"}}>
                    <div style={{fontSize:11,color:"#4285f4",fontWeight:600,marginBottom:4}}>How to share from Google Drive:</div>
                    <div style={{fontSize:11,color:"#777",lineHeight:2}}>1. Open doc in Google Drive &nbsp; 2. Share → Anyone with link &nbsp; 3. Paste below</div>
                  </div>
                  <DriveLinksManager/>
                </div>
              </div>

              {/* ── Athlete profile photos ── */}
              <div style={{borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 8px 32px #00000060",border:"1px solid "+STEEL+"33"}}>
                <div style={{background:"linear-gradient(140deg,"+STEEL+"30,"+STEEL+"10,#0d0d0d)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+STEEL+","+STEEL+"44,transparent)"}}/>
                  <div style={{position:"absolute",bottom:-10,right:-8,opacity:0.08,lineHeight:0,userSelect:"none",pointerEvents:"none"}}><Icon name="profile" size={66} color="#fff"/></div>
                  <div style={{position:"absolute",top:0,right:0,bottom:0,width:"40%",background:"radial-gradient(ellipse at right,"+STEEL+"12,transparent 70%)",pointerEvents:"none"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(145deg,"+STEEL+"44,"+STEEL+"22)",border:"1px solid "+STEEL+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px "+STEEL+"33"}}>👤</div>
                    <div>
                      <div style={{fontSize:8,color:STEEL,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:900,marginBottom:2}}>Profile Photos</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Athlete Headshots</div>
                      <div style={{fontSize:11,color:"#666",marginTop:1}}>Used on profile cards, leaderboards, etc.</div>
                    </div>
                  </div>
                </div>
                <div style={{background:"#111",padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {athletes.filter(a=>a.status==="active").map((a,i)=>(
                      <div key={i} style={{background:"#1a1a1a",borderRadius:12,padding:"1rem",border:"0.5px solid #252525",textAlign:"center"}}>
                        <div style={{width:64,height:64,borderRadius:"50%",background:STEEL,margin:"0 auto 8px",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>
                          {a.photo_url?<img src={a.photo_url} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={ev=>{ev.target.style.display="none";}} alt=""/>:a.name[0]}
                        </div>
                        <div style={{fontSize:12,fontWeight:500,color:"#ddd",marginBottom:8}}>{a.name}</div>
                        <label style={{padding:"6px 12px",borderRadius:8,border:"0.5px solid "+ORANGE,background:ORANGE+"18",fontSize:11,cursor:"pointer",color:ORANGE,display:"inline-block",fontWeight:600}}>
                          {uploadingPhoto===a.id?"Saving...":a.photo_url?"Change":"Add Photo"}
                          <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
  );
}
