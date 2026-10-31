// Adapted from Evolution PR #2727 / Baileys PRs #2765 and #2602.
// Copyright (c) 2025 Rajeh Taher/WhiskeySockets. MIT; see BAILEYS-LICENSE.
import { randomBytes } from 'node:crypto';

export function makePairingQRRenderer(refs, render) {
  let index=0,current;
  return {
    next() {
      const ref=refs[index];
      if(ref===undefined)return false;
      index++;current=ref;render(ref);return true;
    },
    refresh() {
      if(current===undefined)return false;
      render(current);return true;
    }
  };
}

export function handleCompanionRegRefresh(node,{creds,emitCredsUpdate,refreshQR,logger}) {
  const valid=Array.isArray(node?.content)&&node.content.some(child=>
    child?.tag==='companion_reg_refresh'||child?.tag==='pair-device-rotate-qr');
  if(!valid){logger.warn('Ignoring malformed companion registration refresh');return 'ignored_malformed';}
  // A pending phone-code handshake also has creds.me. Rotating its key would invalidate that code.
  if(creds.me||creds.registered)return 'ignored_registered';
  creds.advSecretKey=randomBytes(32).toString('base64');
  emitCredsUpdate({advSecretKey:creds.advSecretKey});
  refreshQR();
  return 'rotated';
}
