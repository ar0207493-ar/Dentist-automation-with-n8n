const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function patchManager(root,componentFile=path.join(__dirname,'phone-pairing.js')) {
 const htmlPath=path.join(root,'index.html');
 let html=fs.readFileSync(htmlPath,'utf8');
 const asset=html.match(/src="\/assets\/(index-[^"/]+\.js)"/);
 if(!asset)throw Error('Pinned manager entrypoint was not found');
 const file=path.join(root,'assets',asset[1]);
 let source=fs.readFileSync(file,'utf8');
 if(source.includes('function DentoraPhonePairing('))throw Error('Manager is already patched');
 const start='g.number&&i.jsxs(Pt,{children:[i.jsx(Bt,{className:"connect-code-button"';
 const end='})]})]})]}),i.jsxs(Vh,';
 const from=source.indexOf(start);
 if(from<0||source.indexOf(start,from+1)!==-1)throw Error('Expected one pinned pairing button');
 const boundary=source.indexOf(end,from);
 if(boundary<0)throw Error('Pairing dialog end was not found');
 // Preserve the enclosing alert and its children; replace only its pairing dialog.
 const through=boundary+'})]})'.length;
 source=source.slice(0,from)+'i.jsx(DentoraPhonePairing,{instance:g,connect:f,token:u,onClose:j})'+source.slice(through);
 const suffix='});export default tie();';
 const endOfModule=source.lastIndexOf(suffix);
 if(endOfModule<0)throw Error('Pinned manager module boundary was not found');
 source=source.slice(0,endOfModule)+'\n'+fs.readFileSync(componentFile,'utf8')+'\n'+source.slice(endOfModule);
 // Fail the build on an invalid patch before touching the manager entrypoint.
 try {new (require('node:vm').Script)(source.replace('export default tie();','tie();'),{filename:'patched-manager.js'});}
 catch(error){throw Error('Invalid manager patch: '+error.message);}
 const name='index-dentora-phone-'+crypto.createHash('sha256').update(source).digest('hex').slice(0,12)+'.js';
 fs.writeFileSync(path.join(root,'assets',name),source);
 html=html.replace('/assets/'+asset[1],'/assets/'+name);
 fs.writeFileSync(htmlPath,html);
 return {asset:name};
}
module.exports={patchManager};
if(require.main===module)console.log('[Dentora Evolution] Phone pairing manager installed: '+patchManager(process.argv[2]||'/evolution/manager/dist').asset);
