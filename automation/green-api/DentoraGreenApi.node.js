'use strict';
const validHost=host=>/^(?:[0-9]+\.api\.greenapi\.com|api\.green-api\.com)$/.test(host);
function failure(status,details=''){
 const text=String(details).toLowerCase();
 if(/quota|limit|tariff|developer/.test(text))return'quota_restricted';
 if(/not.?authorized|not.?connected|logged.?out/.test(text))return'instance_disconnected';
 if(status===401||status===403)return'connection_error';
 if(/timeout|timed out|etimedout/.test(text))return'timeout';
 if(status>=400)return'provider_rejected';
 return'connection_error';
}
class DentoraGreenApi {
 constructor(){this.description={
  displayName:'Dentora Green API',name:'dentoraGreenApi',group:['output'],version:1,
  description:'Queue an appointment WhatsApp message with Green API',
  defaults:{name:'Dentora Green API',color:'#39b2bf'},inputs:['main'],outputs:['main'],
  credentials:[{name:'dentoraGreenApi',required:true}],
  properties:[
   {displayName:'Chat ID',name:'chatId',type:'string',required:true,default:'',description:'International phone number followed by @c.us'},
   {displayName:'Message',name:'message',type:'string',required:true,default:'',typeOptions:{rows:5}}
  ]
 };}
 async execute(){
  const results=[];
  const credentials=await this.getCredentials('dentoraGreenApi');
  for(let i=0;i<this.getInputData().length;i++){
   const result={provider:'green-api',queued:false,messageId:null,errorCode:null};
   try{
    const apiUrl=new URL(String(credentials.apiUrl));
    if(apiUrl.protocol!=='https:'||!validHost(apiUrl.hostname)||apiUrl.port||apiUrl.username||apiUrl.password||apiUrl.pathname!=='/'||apiUrl.search||apiUrl.hash||!/^\d+$/.test(credentials.idInstance)||!credentials.apiToken)throw Error('Invalid credential settings');
    const chatId=String(this.getNodeParameter('chatId',i));
    const message=String(this.getNodeParameter('message',i));
    if(!/^[1-9][0-9]{7,14}@c\.us$/.test(chatId)||!message.trim()||message.length>20000){result.errorCode='invalid_message';results.push({json:result,pairedItem:{item:i}});continue;}
    const response=await this.helpers.httpRequest({
     method:'POST',url:apiUrl.origin+'/waInstance'+credentials.idInstance+'/sendMessage/'+encodeURIComponent(credentials.apiToken),
     headers:{'Content-Type':'application/json'},body:{chatId,message,linkPreview:false},json:true,
     timeout:25000,disableFollowRedirect:true,returnFullResponse:true,ignoreHttpStatusErrors:true
    });
    const status=response.statusCode;
    const body=response.body;
    if(status>=200&&status<300&&typeof body?.idMessage==='string'&&body.idMessage.trim()){
     result.queued=true;result.messageId=body.idMessage;
    }else result.errorCode=failure(status,body?.message||body?.error||body?.description||'');
   }catch(error){
    // Provider URLs contain credentials. Never return/log a raw error or request.
    result.errorCode=failure(error?.statusCode||error?.response?.statusCode||0,error?.message||'');
   }
   results.push({json:result,pairedItem:{item:i}});
  }
  return[results];
 }
}
module.exports={DentoraGreenApi,validHost,failure};
