import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function AttendanceCalendar({athleteId}){
  const[records,setRecords]=useState([]);
  const[monthIdx,setMonthIdx]=useState(0);
  const GREEN="#1E6B3A",RED="#C0392B",GOLD="#D4AF37";

  useEffect(()=>{
    (async()=>{
      try{
        const{data}=await supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:true});
        setRecords(data||[]);
      }catch(e){setRecords([]);}
    })();
  },[]);

  const totalEarly=records.filter(r=>r.status==="early").length;
  const totalLate=records.filter(r=>r.status==="late").length;
  const byDate={};
  records.forEach(r=>{byDate[r.date]=r.status;});

  // Build months covering the season: June–September 2026
  const START=new Date(2026,5,1); // June 2026
  const END=new Date(2026,8,1);   // September 2026
  const allMonths=[];
  let cur=new Date(START);
  while(cur<=END){
    const year=cur.getFullYear();
    const month=cur.getMonth();
    const monthName=cur.toLocaleString("default",{month:"long"});
    const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;
    const daysInMonth=new Date(year,month+1,0).getDate();
    const today=new Date();
    const days=[];
    for(let d=1;d<=daysInMonth;d++){
      const dateStr=`${monthKey}-${String(d).padStart(2,"0")}`;
      const dow=new Date(year,month,d,12,0,0).getDay();
      const isClassDay=[1,2,4,5].includes(dow);
      const localDateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const isFuture=new Date(localDateStr+"T12:00:00")>today;
      days.push({dateStr,day:d,isClassDay,isFuture,status:byDate[dateStr]||null});
    }
    const mEarly=days.filter(d=>d.status==="early").length;
    const mLate=days.filter(d=>d.status==="late").length;
    allMonths.push({monthName,year,days,mEarly,mLate});
    cur=new Date(year,month+1,1);
  }

  // Default to current month
  const today=new Date();
  const defaultIdx=allMonths.findIndex(m=>m.monthName===today.toLocaleString("default",{month:"long"})&&m.year===today.getFullYear());
  const[initialized,setInitialized]=useState(false);
  useEffect(()=>{if(!initialized&&defaultIdx>=0){setMonthIdx(defaultIdx);setInitialized(true);}},[defaultIdx]);

  const month=allMonths[monthIdx]||allMonths[0];
  const DAYS_SHORT=["S","M","T","W","T","F","S"];

  const firstDay=month?new Date(month.days[0].dateStr+"T12:00:00").getDay():0;
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  if(month) month.days.forEach(d=>cells.push(d));
  const rows=[];
  for(let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7));

  return(
    <div>
      {/* Overall stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[
          {label:"Early",val:totalEarly,color:GREEN,accent:GREEN+"33",border:GREEN+"44"},
          {label:"Late",val:totalLate,color:GOLD,accent:GOLD+"22",border:GOLD+"33"},
          {label:"Total",val:records.length,color:"#aaa",accent:"#1a1a1a",border:"#2a2a2a"},
        ].map(s=>(
          <div key={s.label} style={{background:s.accent,borderRadius:12,padding:"14px 10px",textAlign:"center",border:"1px solid "+s.border}}>
            <div style={{fontSize:26,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:10,color:"#555",marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Month slider card */}
      <div style={{background:"#111",borderRadius:14,padding:"1.25rem",border:"1px solid #1e1e1e"}}>
        {/* Navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={()=>setMonthIdx(i=>Math.max(0,i-1))} disabled={monthIdx===0} style={{width:34,height:34,borderRadius:10,border:"1px solid #1e1e1e",background:"#0e0e0e",fontSize:18,cursor:monthIdx===0?"default":"pointer",color:monthIdx===0?"#2a2a2a":"#888",fontWeight:300}}>‹</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",textTransform:"uppercase",letterSpacing:"0.04em"}}>{month?.monthName} {month?.year}</div>
            <div style={{fontSize:11,marginTop:3}}>
              <span style={{color:GREEN,fontWeight:700}}>{month?.mEarly||0} early</span>
              {(month?.mLate||0)>0&&<span style={{color:GOLD,fontWeight:700}}> · {month.mLate} late</span>}
              {(month?.mEarly||0)===0&&(month?.mLate||0)===0&&<span style={{color:"#333"}}> · no check-ins</span>}
            </div>
          </div>
          <button onClick={()=>setMonthIdx(i=>Math.min(allMonths.length-1,i+1))} disabled={monthIdx===allMonths.length-1} style={{width:34,height:34,borderRadius:10,border:"1px solid #1e1e1e",background:"#0e0e0e",fontSize:18,cursor:monthIdx===allMonths.length-1?"default":"pointer",color:monthIdx===allMonths.length-1?"#2a2a2a":"#888",fontWeight:300}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
          {DAYS_SHORT.map((d,i)=>(
            <div key={i} style={{fontSize:10,color:"#333",textAlign:"center",fontWeight:700,textTransform:"uppercase"}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {rows.map((row,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
            {row.map((cell,ci)=>{
              let bg="transparent",textColor="#2a2a2a",borderStyle="none",fontWeight=400;
              if(cell){
                if(cell.isFuture){bg="transparent";textColor="#2a2a2a";}
                else if(!cell.isClassDay){bg="#0e0e0e";textColor="#282828";}
                else if(cell.status==="early"){bg=GREEN;textColor="#fff";fontWeight=700;borderStyle="none";}
                else if(cell.status==="late"){bg="#7a5a00";textColor=GOLD;fontWeight=700;borderStyle="none";}
                else{bg="#141414";textColor="#3a3a3a";borderStyle="1px solid #1e1e1e";}
              }
              return(
                <div key={ci} style={{height:36,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center",border:borderStyle,boxShadow:cell?.status==="early"?"0 2px 8px "+GREEN+"44":cell?.status==="late"?"0 2px 8px "+GOLD+"22":"none"}}>
                  {cell&&<span style={{fontSize:11,color:textColor,fontWeight}}>{cell.day}</span>}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{display:"flex",gap:12,marginTop:12,fontSize:10,color:"#444",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:GREEN,boxShadow:"0 0 6px "+GREEN+"66"}}/><span style={{color:"#666"}}>Early</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#7a5a00",border:"1px solid "+GOLD+"44"}}/><span style={{color:"#666"}}>Late</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#141414",border:"1px solid #1e1e1e"}}/><span style={{color:"#555"}}>Missed</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:3,background:"#0e0e0e"}}/><span style={{color:"#333"}}>Off day</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Group Photos ────────────────────────────────────────────────
