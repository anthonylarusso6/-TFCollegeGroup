import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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
    <div className="tfx ae ae-gold" aria-label="Loading">
      <div className="ae-skel" style={{height:64}}/>
      <div className="ae-ph-grid-skel">
        {Array.from({length:4}).map((_,i)=><div key={i} className="ae-skel" style={{height:150}}/>)}
      </div>
    </div>
  );

  return(
    <div className="tfx ae ae-gold">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">Group</div>
          <h2>Photos</h2>
          <p>{photos.length>0?<>{photos.length} photo{photos.length!==1?"s":""} · tap to expand</>:"Group photos and program documents."}</p>
        </div>
      </header>

      {/* Drive links */}
      {driveLinks.length>0&&(
        <section className="tfx-card ae-card">
          <div className="ae-sec is-stack">
            <div className="tfx-eyebrow">Program documents</div>
            <span>Tap to open in Google Drive</span>
          </div>
          <div className="ae-docs">
            {driveLinks.map((link,i)=>{
              const d=JSON.parse(link.message||"{}");
              return(
                <button key={i} type="button" className="ae-doc tfx-press" onClick={()=>window.open(d.url,"_blank")}>
                  <span className="ae-doc-ico"><Icon name="fileText" size={18}/></span>
                  <span className="ae-doc-txt">
                    <b>{d.title||"Program Document"}</b>
                    <small>{d.description||"Tap to view in Google Drive"}</small>
                  </span>
                  <span className="ae-chev"><Icon name="chevronRight" size={16}/></span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Photos grid */}
      {photos.length>0?(
        <div className="ae-masonry">
          {photos.map((p,i)=>{
            const caption=p.message||"";
            const url=p.day;
            const dateStr=new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
            return(
              <button key={i} type="button" className="ae-ph" onClick={()=>setSelected({url,caption,date:dateStr})} aria-label={caption?"Open photo: "+caption:"Open photo from "+dateStr}>
                <img src={url} alt=""/>
                <span className="ae-ph-cap">
                  {caption&&<b>{caption}</b>}
                  <span>{dateStr}</span>
                </span>
              </button>
            );
          })}
        </div>
      ):(
        <section className="tfx-card ae-empty">
          <span className="ae-empty-ico"><Icon name="camera" size={24}/></span>
          <b>No photos yet</b>
          <p>Coach Ant will post group photos here. Check back soon!</p>
        </section>
      )}

      {/* Fullscreen lightbox */}
      {selected&&(
        <div className="ae-lb" onClick={()=>setSelected(null)} role="dialog" aria-modal="true" aria-label="Photo">
          <button type="button" className="ae-lb-x" onClick={()=>setSelected(null)} aria-label="Close photo">✕</button>
          <img src={selected.url} alt=""/>
          {selected.caption&&(
            <div className="ae-lb-cap">{selected.caption}</div>
          )}
          <div className="ae-lb-date">{selected.date}</div>
          <a className="ae-lb-save" href={selected.url} download target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}>
            <Icon name="camera" size={15}/> Save photo
          </a>
          <div className="ae-lb-hint">Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
}
