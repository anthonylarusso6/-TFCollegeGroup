import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const BG="#0f0f0f";
const GREEN="#1E6B3A";
const RED="#C0392B";

export default function Callback(){
  const router=useRouter();
  const[status,setStatus]=useState("Connecting to Polar...");
  const[error,setError]=useState(null);
  const[done,setDone]=useState(false);

  useEffect(()=>{
    if(!router.isReady)return;
    const{code,state}=router.query;
    const polarError=router.query.error;
    if(polarError){setError("Polar error: "+polarError);return;}
    if(!code){setError("No code received. Params: "+JSON.stringify(router.query));return;}
    setStatus("Got code — exchanging for token...");
    exchangeCode(code,state);
  },[router.isReady,router.query]);

  const exchangeCode=async(code,state)=>{
    try{
      setStatus("Saving your Polar connection...");
      // Call our SERVER-SIDE API to avoid CORS issues
      const res=await fetch(`/api/polar-auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state||"")}`);
      const data=await res.json();

      if(data.error){
        setError("Could not connect Polar: "+data.error);
        return;
      }

      setStatus("Polar connected! "+(data.hasRefreshToken?"Token saved.":"Connected."));
      setDone(true);
      setTimeout(()=>router.push("/athlete"),2500);
    }catch(e){
      setError("Connection error: "+e.message);
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
