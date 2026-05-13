import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state={hasError:false,error:null};
  }
  static getDerivedStateFromError(error){
    return{hasError:true,error};
  }
  componentDidCatch(error,info){
    console.error("Tab crashed:",error,info);
  }
  render(){
    if(this.state.hasError){
      return(
        <div style={{background:"#fff",borderRadius:12,padding:"2rem",textAlign:"center",border:"0.5px solid #e0e0e0",margin:"1rem 0"}}>
          <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
          <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a",marginBottom:6}}>Something went wrong</div>
          <div style={{fontSize:12,color:"#888",marginBottom:16}}>This section had an error. The rest of the app still works.</div>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#534AB7",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Georgia,serif"}}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
