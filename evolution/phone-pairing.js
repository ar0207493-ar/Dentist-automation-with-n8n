/* Added to the pinned Evolution Manager bundle by patch-manager.cjs. */
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
      setError('No pairing code is ready yet. If a QR connection is already pending, let that attempt expire, then try again.');
    } catch(cause) {
      if(attempt!==run.current)return;
      setNotice('');
      const status=cause?.response?.status;
      setError(status===401||status===403?'Your manager session needs a fresh login. Sign in again, then retry.':'The pairing request could not finish. Wait a moment and try again. No message was sent.');
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
