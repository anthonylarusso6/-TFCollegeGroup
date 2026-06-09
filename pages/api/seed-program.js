import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NEW_PROGRAM = {
  phase: "Summer Block",
  days: {
    Mon: [
      {name:"BB Front Squat / Pitshark",tier:1,sets:"8 (4x5)"},
      {name:"Seated Cable Rows",tier:1,sets:"12, 8, 8 (2:2:0)"},
      {name:"DB Curl to Press",tier:1,sets:"3x8"},
      {name:"DB Incline Bench Press",tier:2,sets:"12, 10, 10, 8"},
      {name:"ISOphit Copenhagen Holds",tier:2,sets:"3x20s ea"},
      {name:"KB Swing Switches",tier:2,sets:"3x7e"},
      {name:"KB SA Situp",tier:3,sets:"3x6e"},
      {name:"KB Banded Deadbug",tier:3,sets:"3x9e"},
      {name:"DB Birddog Row on Bench",tier:3,sets:"3x10e"},
    ],
    Tue: [
      {name:"BB Hang Cleans",tier:1,sets:"4x6"},
      {name:"LM Banded Push Press",tier:1,sets:"4x10"},
      {name:"TRX T,Y,I",tier:1,sets:"3x6e"},
      {name:"SL/Pistol Squat",tier:2,sets:"3x7e"},
      {name:"DB/KB Kickstand Hinge",tier:2,sets:"3x8e"},
      {name:"DB Chest Supported Row",tier:2,sets:"3x10e"},
      {name:"Cable Rope Trunk Rotation",tier:3,sets:"3x10e"},
      {name:"Dragon Flag",tier:3,sets:"3x9"},
      {name:"KB Farmer & Waiter Carry",tier:3,sets:"3x20 yards"},
    ],
    Thu: [
      {name:"SA Banded Rot. Jammer Press",tier:1,sets:"4x5e"},
      {name:"SA Lat Pull Down",tier:1,sets:"4x14e"},
      {name:"DB Pronated Trap Raise",tier:1,sets:"3x15"},
      {name:"Heavy Prowler Sprint",tier:2,sets:"4x20 yards"},
      {name:"Weighted Plank Holds",tier:2,sets:"3x30s"},
      {name:"KB Shrugs",tier:2,sets:"3x15"},
      {name:"Battle Rope Waves",tier:"circuit",sets:"30s"},
      {name:"Wall Sit w/ Band Pull Apart",tier:"circuit",sets:"30s"},
      {name:"Dead Hangs",tier:"circuit",sets:"30s"},
      {name:"TRX Bicep Curl",tier:"circuit",sets:"30s"},
      {name:"SL Box Jumps",tier:"circuit",sets:"30s"},
      {name:"DB Lat Box Step Ups",tier:"circuit",sets:"30s"},
    ],
    Fri: [
      {name:"BB Deadlifts",tier:1,sets:"8,4,4,3"},
      {name:"DB RFESS (3:0:0)",tier:1,sets:"4x6e"},
      {name:"MB Rot Wall Toss",tier:1,sets:"3x8e"},
      {name:"BB Push Press",tier:2,sets:"4x7e"},
      {name:"SA DB Bent Over Row",tier:2,sets:"15e,13e,11e,9e"},
      {name:"Banded Cable Pallof Press",tier:2,sets:"3x12e"},
      {name:"DB ISO Hammer Curl",tier:"guns_and_glory",sets:"3x12e"},
      {name:"DB Bench Skull Crusher",tier:"guns_and_glory",sets:"15,13,12"},
      {name:"DB Crazy 8's",tier:"guns_and_glory",sets:"3x8e",note:"Front · Upright · Lat · Rear Delt"},
    ],
  },
  updatedAt: new Date().toISOString(),
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await supabase.from("announcements").update({ active: false }).eq("type", "program");
    const { error } = await supabase.from("announcements").insert({
      type: "program",
      message: JSON.stringify(NEW_PROGRAM),
      active: true,
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, phase: NEW_PROGRAM.phase });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
