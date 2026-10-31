'use strict';
const ORIGIN='https://dentora-evolution-api.onrender.com';
function connectionSettings(credentials){
 const url=new URL(String(credentials.apiUrl));
 if(url.origin!==ORIGIN||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!/^[-A-Za-z0-9_]{1,100}$/.test(credentials.instanceName||'')||!credentials.apiKey)throw Error('Invalid Evolution settings');
 return {origin:url.origin,instance:credentials.instanceName,headers:{apikey:credentials.apiKey,'Content-Type':'application/json'}};
}
function failure(status,details=''){
 const message=String(details).toLowerCase();
 if(status===429||/rate.?overlimit|rate.?limit/.test(message))return 'rate_limited';
 if(status===401||status===403)return 'connection_error';
 if(/instance.*not.*exist|connection closed|not.?connected|not.?open|logged.?out/.test(message))return 'instance_disconnected';
 if(/invalid.*number|number.*not.*exist|invalid.*jid/.test(message))return 'invalid_recipient';
 if(/timeout|timed out|etimedout/.test(message))return 'timeout';
 return status>=400?'provider_rejected':'connection_error';
}
async function waitForConnection(request,settings,controls={}){
 const now=controls.now||Date.now,sleep=controls.sleep||(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
 const until=now()+(controls.maxWaitMs||180000);
 // Only readiness GETs may repeat. Message POSTs are never retried.
 for(let attempt=0;attempt<60&&now()<until;attempt++){
  try{
   const response=await request({method:'GET',url:settings.origin+'/instance/connectionState/'+encodeURIComponent(settings.instance),headers:settings.headers,json:true,timeout:Math.max(1,Math.min(20000,until-now())),disableFollowRedirect:true,returnFullResponse:true,ignoreHttpStatusErrors:true});
   if(response.statusCode===401||response.statusCode===403)return 'connection_error';
   if(response.statusCode===404)return 'instance_disconnected';
   if(response.statusCode===429)return 'rate_limited';
   if(response.statusCode>=200&&response.statusCode<300){
    const state=response.body?.instance?.state;
    if(state==='open')return null;
    if(state==='close'||state==='closed')return 'instance_disconnected';
   }
  }catch{/* Free hosting can still be waking up. Never log the credential-bearing request. */}
  if(now()<until)await sleep(Math.min(3000,until-now()));
 }
 return 'service_unavailable';
}
class DentoraEvolution {
 constructor(){this.description={displayName:'Dentora Evolution',name:'dentoraEvolution',group:['output'],version:1,description:'Send appointment notifications through the connected Dentora WhatsApp instance',defaults:{name:'Dentora Evolution',color:'#39b2bf'},inputs:['main'],outputs:['main'],credentials:[{name:'dentoraEvolution',required:true}],properties:[
  {displayName:'WhatsApp Number',name:'number',type:'string',required:true,default:'',description:'International phone number including country code'},
  {displayName:'Message',name:'message',type:'string',required:true,default:'',typeOptions:{rows:5}}
 ]};}
 async execute(){
  const items=this.getInputData(),output=[];
  let settings;
  try{settings=connectionSettings(await this.getCredentials('dentoraEvolution'));}
  catch{return [items.map((_,index)=>({json:{provider:'evolution',queued:false,messageId:null,status:null,errorCode:'connection_error'},pairedItem:{item:index}}))];}
  let ready;
  for(let index=0;index<items.length;index++){
   const result={provider:'evolution',queued:false,messageId:null,status:null,errorCode:null};
   try{
    const number=String(this.getNodeParameter('number',index)).replace(/[+\s()-]/g,'');
    const text=String(this.getNodeParameter('message',index));
    if(!/^[1-9][0-9]{7,14}$/.test(number)||!text.trim()||text.length>20000){result.errorCode='invalid_message';output.push({json:result,pairedItem:{item:index}});continue;}
    if(ready===undefined)ready=await waitForConnection(options=>this.helpers.httpRequest(options),settings);
    if(ready){result.errorCode=ready;output.push({json:result,pairedItem:{item:index}});continue;}
    const response=await this.helpers.httpRequest({method:'POST',url:settings.origin+'/message/sendText/'+encodeURIComponent(settings.instance),headers:settings.headers,body:{number,text,linkPreview:false},json:true,timeout:25000,disableFollowRedirect:true,returnFullResponse:true,ignoreHttpStatusErrors:true});
    const body=response.body;
    if(response.statusCode>=200&&response.statusCode<300&&typeof body?.key?.id==='string'&&body.key.id.trim()&&!['ERROR','FAILED'].includes(body.status)){
     result.queued=true;result.messageId=body.key.id;
     result.status=typeof body.status==='string'&&/^[A-Z_]{1,30}$/.test(body.status)?body.status:null;
    }else result.errorCode=failure(response.statusCode,body?.message||body?.response?.message||body?.error||'');
   }catch(error){result.errorCode=failure(error?.statusCode||error?.response?.statusCode||0,error?.message||'');}
   output.push({json:result,pairedItem:{item:index}});
  }
  return [output];
 }
}
module.exports={DentoraEvolution,connectionSettings,waitForConnection,failure};
