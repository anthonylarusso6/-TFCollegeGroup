import { useState, useEffect, useRef } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";


export default function AttendanceCalendar({athleteId}){
  const[records,setRecords]=useState([]);
  const[monthIdx,setMonthIdx]=useState(0);
  const GREEN="#1E6B3A",RED="#C0392B",GOLD="#D4AF37";

  useEffect(()=>{
    supabase.from("attendance").select("*").eq("athlete_id",athleteId).order("date",{ascending:true}).then(({data})=>setRecords(data||[])).catch(()=>setRecords([]));
  },[]);

  const totalEarly=records.filter(r=>r.status==="early").length;
  const totalLate=records.filter(r=>r.status==="late").length;
  const byDate={};
  records.forEach(r=>{byDate[r.date]=r.status;});

  // Build months from June 2025 to August 2026
  const START=new Date(2025,5,1); // June 2025
  const END=new Date(2026,7,1);   // August 2026
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
        {[{label:"Early",val:totalEarly,color:GREEN,bg:"#EAF3DE"},{label:"Late",val:totalLate,color:RED,bg:"#FCEBEB"},{label:"Total",val:records.length,color:"#1a1a1a",bg:"#f5f5f5"}].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"12px",textAlign:"center",border:"0.5px solid #e0e0e0"}}>
            <div style={{fontSize:20,fontWeight:600,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Month slider card */}
      <div style={{background:"#fff",borderRadius:12,padding:"1.25rem",border:"0.5px solid #e0e0e0"}}>
        {/* Navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>setMonthIdx(i=>Math.max(0,i-1))} disabled={monthIdx===0} style={{width:32,height:32,borderRadius:8,border:"0.5px solid #e0e0e0",background:monthIdx===0?"#f9f9f9":"#fff",fontSize:16,cursor:monthIdx===0?"default":"pointer",color:monthIdx===0?"#ccc":"#1a1a1a"}}>‹</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{month?.monthName} {month?.year}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>
              <span style={{color:GREEN,fontWeight:500}}>{month?.mEarly||0} early</span>
              {(month?.mLate||0)>0&&<span style={{color:GOLD,fontWeight:500}}> · {month.mLate} late</span>}
              {(month?.mEarly||0)===0&&(month?.mLate||0)===0&&<span> · no check-ins</span>}
            </div>
          </div>
          <button onClick={()=>setMonthIdx(i=>Math.min(allMonths.length-1,i+1))} disabled={monthIdx===allMonths.length-1} style={{width:32,height:32,borderRadius:8,border:"0.5px solid #e0e0e0",background:monthIdx===allMonths.length-1?"#f9f9f9":"#fff",fontSize:16,cursor:monthIdx===allMonths.length-1?"default":"pointer",color:monthIdx===allMonths.length-1?"#ccc":"#1a1a1a"}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
          {DAYS_SHORT.map((d,i)=>(
            <div key={i} style={{fontSize:10,color:"#aaa",textAlign:"center",fontWeight:500}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {rows.map((row,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
            {row.map((cell,ci)=>(
              <div key={ci} style={{
                height:34,borderRadius:8,
                background:!cell?"transparent":cell.isFuture?"#fafafa":!cell.isClassDay?"#f5f5f5":cell.status==="early"?GREEN:cell.status==="late"?GOLD:"#ebebeb",
                display:"flex",alignItems:"center",justifyContent:"center",
                border:cell&&cell.isClassDay&&!cell.isFuture&&!cell.status?"0.5px solid #ddd":"none",
              }}>
                {cell&&<span style={{fontSize:11,color:!cell.isClassDay||cell.isFuture?"#ccc":cell.status?"#fff":"#999",fontWeight:cell.status?600:400}}>{cell.day}</span>}
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div style={{display:"flex",gap:10,marginTop:10,fontSize:10,color:"#888",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:GREEN}}/> Early</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:GOLD}}/> Late</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#ebebeb",border:"0.5px solid #ddd"}}/> Missed</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#f5f5f5"}}/> Off day</div>
        </div>
      </div>
    </div>
  );
}

// ── Group Photos ────────────────────────────────────────────────
