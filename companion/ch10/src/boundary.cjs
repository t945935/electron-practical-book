function guard(getContents,expectedURL,handler){return async(event,...args)=>{
 const wc=getContents();
 if(!wc||event.sender!==wc||event.senderFrame!==wc.mainFrame||event.senderFrame?.url!==expectedURL)return {ok:false,error:{code:'SOURCE',message:'拒絕未授權來源'}};
 try{return {ok:true,data:await handler(...args)};}catch(error){const codes=['VALIDATION','HTTP','FORMAT','OFFLINE','TIMEOUT','BUSY','NOT_SELECTED'];return {ok:false,error:codes.includes(error.code)?{code:error.code,message:error.message}:{code:'INTERNAL',message:'操作失敗，請重試'}};}
};}
function noArgs(args){if(args.length)throw Object.assign(new Error('此操作不接受參數'),{code:'VALIDATION'});}
module.exports={guard,noArgs};
