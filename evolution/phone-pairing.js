/* Added to the pinned Evolution Manager bundle by patch-manager.cjs. */
async function DentoraPreparePhonePairing({api,instance,token,active,announce}) {
  const config={headers:{apikey:token}};
  const route='/instance/connectionState/'+encodeURIComponent(instance.name);
  const readState=async()=>{const result=await api.get(route,config);return result.data?.instance?.state;};
  const fail=message=>{const error=new Error(message);error.dentoraPairingMessage=message;throw error;};
  let state=await readState();
  if(!active())return 'cancelled';
  if(state==='open')return 'connected';
  if(state==='close')return 'ready';
  if(state!=='connecting')fail('The instance is not ready for pairing. Refresh the dashboard and try again.');
  const response=await api.get('/instance/fetchInstances',{...config,params:{instanceName:instance.name}});
  if(!active())return 'cancelled';
  const pending=Array.isArray(response.data)?response.data.find(item=>item.name===instance.name):null;
  if(!pending)fail('The instance could not be verified. Refresh the dashboard and try again.');
  if(pending.connectionStatus==='open')return 'connected';
  // Never log out an account that has already been paired. Only replace an unpaired QR attempt.
  if(pending.ownerJid||pending.profileName)fail('An existing WhatsApp account is reconnecting. Wait for it to connect, or disconnect it from the dashboard before linking another number.');
  state=await readState();
  if(!active())return 'cancelled';
  if(state==='open')return 'connected';
  if(state==='close')return 'ready';
  if(state!=='connecting')fail('The connection changed. Refresh the dashboard and try again.');
  announce('Clearing the previous unpaired QR attempt…');
  await api.delete('/instance/logout/'+encodeURIComponent(instance.name),config);
  for(let count=0;count<12;count++) {
    if(!active())return 'cancelled';
    state=await readState();
    if(!active())return 'cancelled';
    if(state==='close')return 'ready';
    if(state==='open')return 'connected';
    if(count<11)await new Promise(resolve=>setTimeout(resolve,1000));
  }
  fail('The previous pairing attempt is still closing. Wait a moment, then request the code again.');
}
function DentoraPhonePairing({instance,connect,token,onClose}) {
  const [open,setOpen]=y.useState(false);
  const [phone,setPhone]=y.useState(instance.number||'');
  const [code,setCode]=y.useState('');
  const [busy,setBusy]=y.useState(false);
  const [error,setError]=y.useState('');
  const [notice,setNotice]=y.useState('');
  const run=y.useRef(0);
  y.useEffect(()=>()=>{run.current++;},[]);
  function changeOpen(value) {
    run.current++;
    setBusy(false);setError('');setNotice('');setCode('');setOpen(value);
  }
  async function generate(event) {
    event.preventDefault();
    if(busy)return;
    const number=phone.trim().replace(/[+\s()-]/g,'');
    if(!/^[1-9]\d{7,14}$/.test(number)) {
      setError('Enter your WhatsApp number with country code, for example +923001234567.');
      return;
    }
    const attempt=++run.current;
    setBusy(true);setError('');setCode('');setNotice('Requesting a pairing code…');
    try {
      const prepared=await DentoraPreparePhonePairing({api:bd,instance,token,active:()=>attempt===run.current,announce:setNotice});
      if(attempt!==run.current||prepared==='cancelled')return;
      if(prepared==='connected'){setNotice('WhatsApp is already connected.');return;}
      setNotice('Requesting a pairing code…');
      for(let count=0;count<8;count++) {
        if(attempt!==run.current)return;
        const result=await connect({instanceName:instance.name,token,number});
        if(attempt!==run.current)return;
        if(result?.instance?.state==='open'||result?.instance?.status==='open') {
          setNotice('WhatsApp is already connected.');
          return;
        }
        const raw=result?.pairingCode||result?.qrcode?.pairingCode;
        if(typeof raw==='string'&&/^[A-Z0-9]{8}$/i.test(raw.replace(/-/g,''))) {
          const clean=raw.replace(/-/g,'').toUpperCase();
          setCode(clean.slice(0,4)+'-'+clean.slice(4));setNotice('Enter this code in WhatsApp on your phone.');
          return;
        }
        if(result?.error)throw new Error('pairing');
        if(count<7)await new Promise(resolve=>setTimeout(resolve,2000));
      }
      setNotice('');
      setError('WhatsApp has not returned a pairing code yet. Wait a moment and request a fresh code.');
    } catch(cause) {
      if(attempt!==run.current)return;
      setNotice('');
      const status=cause?.response?.status;
      setError(cause?.dentoraPairingMessage||(status===401||status===403?'Your manager session needs a fresh login. Sign in again, then retry.':'The pairing request could not finish. Wait a moment and try again. No message was sent.'));
    } finally {
      if(attempt===run.current)setBusy(false);
    }
  }
  const field={width:'100%',border:'1px solid hsl(var(--border))',borderRadius:'8px',padding:'11px 12px',background:'transparent',color:'inherit',fontSize:'16px'};
  return i.jsxs(Pt,{open,onOpenChange:changeOpen,children:[
    i.jsx(Bt,{asChild:true,children:i.jsx(se,{variant:'warning',className:'dentora-phone-pairing-button',children:'Link with phone number'})}),
    i.jsxs(Nt,{onCloseAutoFocus:()=>onClose?.(),children:[
      i.jsx(Mt,{children:'Link WhatsApp with your phone number'}),
      i.jsxs('form',{onSubmit:generate,style:{display:'grid',gap:'16px',paddingTop:'12px'},children:[
        i.jsxs('label',{htmlFor:'dentora-pairing-phone',style:{display:'grid',gap:'8px'},children:[
          'WhatsApp number',
          i.jsx('input',{id:'dentora-pairing-phone',name:'whatsappNumber',type:'tel',inputMode:'tel',autoComplete:'tel',placeholder:'+923001234567',value:phone,onChange:event=>setPhone(event.target.value),disabled:busy,required:true,style:field})
        ]}),
        i.jsx('p',{style:{fontSize:'13px',opacity:0.8},children:'Include the country code. Use the number registered in your WhatsApp Business app.'}),
        i.jsx(se,{type:'submit',disabled:busy,children:busy?'Getting pairing code…':code?'Get a new pairing code':'Get pairing code'}),
        error&&i.jsx('p',{role:'alert',style:{fontSize:'14px',color:'#f87171'},children:error}),
        notice&&i.jsx('p',{role:'status','aria-live':'polite',style:{fontSize:'14px'},children:notice}),
        code&&i.jsxs('div',{style:{display:'grid',gap:'16px'},children:[
          i.jsx('output',{'aria-label':'WhatsApp pairing code',style:{display:'block',textAlign:'center',fontFamily:'monospace',fontSize:'34px',letterSpacing:'4px',fontWeight:700,padding:'16px',border:'1px solid hsl(var(--border))',borderRadius:'10px',userSelect:'all'},children:code}),
          i.jsxs('ol',{style:{paddingLeft:'20px',fontSize:'14px',lineHeight:1.8,listStyle:'decimal'},children:[
            i.jsx('li',{children:'Open WhatsApp Business on your phone.'}),
            i.jsx('li',{children:'Open Linked devices → Link a device.'}),
            i.jsx('li',{children:'Choose “Link with phone number instead” and enter this code.'})
          ]}),
          i.jsx('p',{style:{fontSize:'12px',opacity:0.75},children:'If the code expires, request a new one. Pairing does not send a WhatsApp message.'})
        ]})
      ]})
    ]})
  ]});
}
