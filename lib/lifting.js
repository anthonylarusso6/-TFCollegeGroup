// Shared lifting definitions — the athlete Iron Room, the rack station and the
// coach views all read from here so they can't drift apart.
import { supabase } from "./supabase";

export const DAYS=["Mon","Tue","Thu","Fri"];
export const DAY_LABELS={Mon:"Monday",Tue:"Tuesday",Thu:"Thursday",Fri:"Friday"};
// Tier = how the coach ranks the lift. Shown as a colored stripe + chip.
export const TIERS={
  1:{c:"#8e7cf0",chip:"T1 · Primary",short:"T1"},
  2:{c:"#3fa577",chip:"T2 · Secondary",short:"T2"},
  3:{c:"#d9822b",chip:"T3 · Accessory",short:"T3"},
  circuit:{c:"#d9534f",chip:"Circuit · 3 rounds · 30s on / 15s off",short:"Circuit"},
  guns_and_glory:{c:"#c9a640",chip:"Guns & Glory",short:"G&G"},
};

// "2026-11-16" → local date. new Date("2026-11-16") is UTC midnight, which
// shows as the previous day on phones in Eastern time.
export const pd=(s)=>{const[y,m,d]=String(s).slice(0,10).split("-").map(Number);return new Date(y,m-1,d);};
export const fmtD=(s,o={month:"short",day:"numeric"})=>pd(s).toLocaleDateString("en-US",o);

// Band resistance colors — orange (lightest) → red → black → green → blue (max)
export const BAND_COLORS=[
  {id:"orange",label:"Orange",hex:"#E8720C",resistance:"Lightest"},
  {id:"red",   label:"Red",   hex:"#C0392B",resistance:"Light"},
  {id:"black", label:"Black", hex:"#222",   resistance:"Medium"},
  {id:"green", label:"Green", hex:"#1E6B3A",resistance:"Heavy"},
  {id:"blue",  label:"Blue",  hex:"#1A4F8A",resistance:"Max"},
];

// Medicine ball preset weights (lbs)
export const MB_WEIGHTS=[6,8,10,12,14,16,20];

// Kettlebell color → weight (lbs)
export const KB_COLORS=[
  {id:"white",  label:"White",  hex:"#e8e8e8", textColor:"#222", weight:8.8},
  {id:"pink",   label:"Pink",   hex:"#e91e8c", textColor:"#fff", weight:17.6},
  {id:"blue",   label:"Blue",   hex:"#1A4F8A", textColor:"#fff", weight:26.4},
  {id:"yellow", label:"Yellow", hex:"#f5c518", textColor:"#222", weight:35.2},
  {id:"purple", label:"Purple", hex:"#7B2D8B", textColor:"#fff", weight:44.1},
  {id:"green",  label:"Green",  hex:"#1E6B3A", textColor:"#fff", weight:52.9},
  {id:"orange", label:"Orange", hex:"#E8720C", textColor:"#fff", weight:61.7},
  {id:"red",    label:"Red",    hex:"#C0392B", textColor:"#fff", weight:70.5},
  {id:"gray",   label:"Gray",   hex:"#708090", textColor:"#fff", weight:79.4},
];

export const DEFAULT_PROGRAM={
  Mon:[
    {name:"BB Front Squat / Pitshark",    tier:1,sets:"8 (4x5)",                inputType:"weight"},
    {name:"Seated Cable Rows",             tier:1,sets:"12, 8, 8 (2:2:0)",       inputType:"weight"},
    {name:"DB Curl to Press",              tier:1,sets:"3x8",                    inputType:"weight"},
    {name:"DB Incline Bench Press",        tier:2,sets:"12, 10, 10, 8",          inputType:"weight"},
    {name:"ISOphit Copenhagen Holds",      tier:2,sets:"3x20s ea",               inputType:"bodyweight"},
    {name:"KB Swing Switches",             tier:2,sets:"3x7e",                   inputType:"kb"},
    {name:"KB SA Situp",                   tier:3,sets:"3x6e",                   inputType:"kb"},
    {name:"KB Banded Deadbug",             tier:3,sets:"3x9e",                   inputType:"band_kb"},
    {name:"DB Birddog Row on Bench",       tier:3,sets:"3x10e",                  inputType:"weight"},
  ],
  Tue:[
    {name:"BB Hang Cleans",                tier:1,sets:"4x6",                    inputType:"weight"},
    {name:"LM Banded Push Press",          tier:1,sets:"4x10",                   inputType:"band_weight"},
    {name:"TRX T,Y,I",                     tier:1,sets:"3x6e",                   inputType:"bodyweight"},
    {name:"SL/Pistol Squat",               tier:2,sets:"3x7e",                   inputType:"weight_kb"},
    {name:"DB/KB Kickstand Hinge",         tier:2,sets:"3x8e",                   inputType:"kb"},
    {name:"DB Chest Supported Row",        tier:2,sets:"3x10e",                  inputType:"weight"},
    {name:"Cable Rope Trunk Rotation",     tier:3,sets:"3x10e",                  inputType:"weight"},
    {name:"Dragon Flag",                   tier:3,sets:"3x9",                    inputType:"bodyweight"},
    {name:"KB Farmer & Waiter Carry",      tier:3,sets:"3x20 yards",               inputType:"kb2_yards"},
  ],
  Thu:[
    {name:"SA Banded Rot. Jammer Press",   tier:1,sets:"4x5e",                   inputType:"band_weight"},
    {name:"SA Lat Pull Down",              tier:1,sets:"4x14e",                  inputType:"weight"},
    {name:"DB Pronated Trap Raise",        tier:1,sets:"3x15",                   inputType:"weight"},
    {name:"Heavy Prowler Sprint",          tier:2,sets:"4x20 yards",               inputType:"weight_yards"},
    {name:"Weighted Plank Holds",          tier:2,sets:"3x30s",                  inputType:"weight"},
    {name:"KB Shrugs",                     tier:2,sets:"3x15",                   inputType:"kb"},
    {name:"Battle Rope Waves",             tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"Wall Sit w/ Band Pull Apart",   tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"Dead Hangs",                    tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"TRX Bicep Curl",                tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"SL Box Jumps",                  tier:"circuit",sets:"30s",            inputType:"bodyweight"},
    {name:"DB Lat Box Step Ups",           tier:"circuit",sets:"30s",            inputType:"weight"},
  ],
  Fri:[
    {name:"BB Deadlifts",                  tier:1,sets:"8,4,4,3",               inputType:"weight"},
    {name:"DB RFESS (3:0:0)",              tier:1,sets:"4x6e",                   inputType:"weight"},
    {name:"MB Rot Wall Toss",              tier:1,sets:"3x8e",                   inputType:"mb"},
    {name:"BB Push Press",                 tier:2,sets:"4x7e",                   inputType:"weight"},
    {name:"SA DB Bent Over Row",           tier:2,sets:"15e,13e,11e,9e",         inputType:"weight"},
    {name:"Banded Cable Pallof Press",     tier:2,sets:"3x12e",                  inputType:"band_pallof"},
    {name:"DB ISO Hammer Curl",            tier:"guns_and_glory",sets:"3x12e",   inputType:"weight"},
    {name:"DB Bench Skull Crusher",        tier:"guns_and_glory",sets:"15,13,12",inputType:"weight"},
    {name:"DB Crazy 8's",                  tier:"guns_and_glory",sets:"3x8e",    inputType:"weight",note:"Front · Upright · Lat · Rear Delt"},
  ],
};

export const epley=(w,r)=>r===1?w:Math.round(w*(1+r/30));

export const VERT_LIFTS=new Set(["pvc max vert"]);
export const isVert=(name)=>VERT_LIFTS.has((name||"").toLowerCase());

// Eastern-time "today" — class runs on ET, so a late-night phone elsewhere still
// logs to the right day.
export const nowET=()=>new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
export const ymd=(d)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export const todayET=()=>ymd(nowET());
export const weekdayET=()=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][nowET().getDay()];

// Active program from the coach's Program tab, with each lift's input type
// filled in from DEFAULT_PROGRAM by name when the upload didn't set one.
export async function loadProgram(){
  try{
    const{data}=await supabase.from("announcements").select("message").eq("type","program").eq("active",true)
      .order("created_at",{ascending:false}).limit(1);
    if(data&&data[0]){
      const p=JSON.parse(data[0].message||"{}");
      if(p.days){
        const merged={};
        Object.keys(p.days).forEach(day=>{
          merged[day]=(p.days[day]||[]).map(lift=>{
            const def=(DEFAULT_PROGRAM[day]||[]).find(d=>d.name===lift.name);
            return{...lift,inputType:lift.inputType||def?.inputType||"weight"};
          });
        });
        return{program:merged,phase:p.phase||""};
      }
      if(p.lifts){
        const mk=()=>p.lifts.map((l,i)=>({name:l,tier:i<2?1:i<4?2:3,inputType:"weight"}));
        return{program:{Mon:mk(),Tue:mk(),Thu:mk(),Fri:mk()},phase:p.phase||""};
      }
    }
  }catch(e){}
  return{program:DEFAULT_PROGRAM,phase:"Current Program"};
}

// Turn the coach's prescription into a list of sets.
//   "8, 6, 5, 4" → 8 6 5 4        "4 x 8 (3:0:0)" → 8 8 8 8 (tempo ignored)
//   "3 x 5e" → 5 5 5               "9, 7, (5, 4 (0:2:0))" → 9 7 5 4
//   "3 x 30s" → 30s ×3 (timed)     "3 x 20yds" → 20 yds ×3     "8 (4x5)" → 8 5 5 5 5
export function parseSets(raw){
  let s=String(raw||"").toLowerCase();
  s=s.replace(/\(\s*\d+\s*:\s*\d+\s*:\s*\d+\s*\)/g," ");          // tempo like (3:0:0)
  s=s.replace(/\((?![\s\d,x×:e]*\))[^)]*\)/g," ");                     // notes like (QUALITY REPS)
  s=s.replace(/[()]/g," ");
  const unit="(s|sec|secs|yds|yards|yd|ea|each|e)?";
  const re=new RegExp("(\\d+)\\s*[x×]\\s*(\\d+(?::\\d+)?)\\s*"+unit+"|(\\d+(?::\\d+)?)\\s*"+unit,"g");
  const out=[];
  const mk=(v,u)=>{
    if(v.includes(":")||u==="s"||u==="sec"||u==="secs")return{target:null,label:v.includes(":")?v:v+"s",timed:true};
    if(u==="yds"||u==="yards"||u==="yd")return{target:parseInt(v,10),label:v+" yds",yards:true};
    return{target:parseInt(v,10),label:String(parseInt(v,10))};
  };
  let m;
  while((m=re.exec(s))&&out.length<12){
    if(m[1]){const n=Math.min(10,parseInt(m[1],10));for(let i=0;i<n&&out.length<12;i++)out.push(mk(m[2],m[3]));}
    else if(m[4])out.push(mk(m[4],m[5]));
  }
  return out;
}

// One PR per athlete + lift + day: the day's best that beat everything before it.
// (With every set logged, a single session can produce several "beats" — count once.)
export function prEvents(rows,{skip=new Set(["10/5 rsi","standing sl vert"])}={}){
  const byKeyDay={};
  for(const r of rows||[]){
    const lift=(r.lift||"").toLowerCase();
    if(skip.has(lift))continue;
    const w=parseFloat(r.weight)||0; if(!w)continue;
    const metric=isVert(r.lift)?w:epley(w,parseInt(r.reps)||1);
    const k=r.athlete_id+"|"+lift+"|"+String(r.date||"").slice(0,10);
    if(!byKeyDay[k]||metric>byKeyDay[k].metric)byKeyDay[k]={...r,metric};
  }
  const days=Object.values(byKeyDay).sort((a,b)=>String(a.date)<String(b.date)?-1:String(a.date)>String(b.date)?1:String(a.created_at||"")<String(b.created_at||"")?-1:1);
  const best={},ev=[];
  for(const d of days){
    const k=d.athlete_id+"|"+(d.lift||"").toLowerCase();
    const prev=best[k];
    if(prev!=null&&d.metric>prev)ev.push({id:d.id,athlete_id:d.athlete_id,lift:d.lift,metric:d.metric,unit:isVert(d.lift)?"in":"lbs",delta:Math.round(d.metric-prev),date:d.date,created_at:d.created_at});
    if(prev==null||d.metric>prev)best[k]=d.metric;
  }
  return ev;
}
