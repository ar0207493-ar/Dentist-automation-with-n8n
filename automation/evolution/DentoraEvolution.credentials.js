'use strict';
class DentoraEvolution {
 constructor(){
  this.name='dentoraEvolution';this.displayName='Dentora Evolution';
  this.documentationUrl='https://github.com/evolution-foundation/evolution-api';
  this.properties=[
   {displayName:'API URL',name:'apiUrl',type:'string',required:true,default:'https://dentora-evolution-api.onrender.com'},
   {displayName:'Instance Name',name:'instanceName',type:'string',required:true,default:'dentora'},
   {displayName:'Instance API Key',name:'apiKey',type:'string',required:true,default:'',typeOptions:{password:true}}
  ];
  // Saving/importing credentials must not send messages or start pairing.
 }
}
module.exports={DentoraEvolution};
