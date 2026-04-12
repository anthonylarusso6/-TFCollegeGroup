import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const BG="#0f0f0f";
const GREEN="#1E6B3A";
const RED="#C0392B";

const CLIENT_ID="d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET="2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

export default function Callback(){
  const router=useRouter();
  const[status,setStatus]=useState("Connecting to Polar...");
  const[error,setError]=useState(null);
  const[done,setDone]=useState(false);

  useEffect(()=>{
    if(!router.isReady)return;
    const{code,state}=router.query;
    if(!code){setError("No authorization code received from Polar.");return;}
    exchangeCode(code,state);
  },[router.isReady,router.query]);

  const exchangeCode=async(code,state)=>{
    try{
      setStatus("Exchanging authorization code...");
      // Exchange code for token
      const res=await fetch("https://polarremote.com/v2/oauth2/token",{
        method:"POST",
        headers:{
          "Content-Type":"application/x-www-form-urlencoded",
          "Authorization":"Basic "+btoa(CLIENT_ID+":"+CLIENT_SECRET),
        },
        body:new URLSearchParams({
          grant_type:"authorization_code",
          code,
          redirect_uri:"https://tfcollegegroup.com/callback",
        }),
      });
      const data=await res.json();
      if(!data.access_token){
        setError("Failed to get access token from Polar. Try connecting again.");
        return;
      }
      setStatus("Saving your Polar connection...");
      // Save token to athlete record using state (athlete id)
      if(state){
        await supabase.from("athletes").update({
          polar_token:data.access_token,
        }).eq("id",state);
        // Register user with Polar
        await fetch("https://www.polaraccesslink.com/v3/users",{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+data.access_token,
          },
          body:JSON.stringify({
            "member-id":state,
          }),
        });
      }
      setStatus("Polar connected successfully!");
      setDone(true);
      // Redirect back to athlete portal after 3 seconds
      setTimeout(()=>router.push("/athlete"),3000);
    }catch(e){
      setError("Something went wrong. Please try connecting again.");
      console.error(e);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Georgia, serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
      <div style={{textAlign:"center",maxWidth:360}}>
        <div style={{fontSize:40,marginBottom:20}}>{error?"❌":done?"✅":"⚡"}</div>
        <div style={{fontSize:18,fontWeight:500,color:error?RED:done?GREEN:"#fff",marginBottom:12}}>
          {error?"Connection failed":done?"Polar connected!":"Connecting Polar..."}
        </div>
        <div style={{fontSize:13,color:"#888",lineHeight:1.7}}>
          {error||status}
        </div>
        {done&&(
          <div style={{fontSize:12,color:"#555",marginTop:12}}>
            Redirecting you back to your profile...
          </div>
        )}
        {error&&(
          <button onClick={()=>router.push("/athlete")} style={{marginTop:20,padding:"10px 24px",borderRadius:8,border:"none",background:"#534AB7",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            Back to profile
          </button>
        )}
      </div>
    </div>
  );
}
