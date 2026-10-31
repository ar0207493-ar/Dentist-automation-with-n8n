'use strict';
class DentoraGreenApi {
 constructor(){
  this.name='dentoraGreenApi';this.displayName='Dentora Green API';
  this.documentationUrl='https://green-api.com/en/docs/api/sending/SendMessage/';
  this.properties=[
   {displayName:'API URL',name:'apiUrl',type:'string',required:true,default:'https://7107.api.greenapi.com'},
   {displayName:'Instance ID',name:'idInstance',type:'string',required:true,default:''},
   {displayName:'API Token',name:'apiToken',type:'string',required:true,default:'',typeOptions:{password:true}}
  ];
  // No credential test: saving/importing credentials must not contact Green API.
 }
}
module.exports={DentoraGreenApi};
