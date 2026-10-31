const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
function replaceOne(source,find,replacement){
 const first=source.indexOf(find);
 if(first<0||source.indexOf(find,first+find.length)!==-1)throw Error('Pinned Baileys source no longer matches the reviewed pairing patch');
 return source.slice(0,first)+replacement+source.slice(first+find.length);
}
function patchBaileys(root){
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 if(version!=='7.0.0-rc.9')throw Error('Expected Baileys 7.0.0-rc.9; review patch before upgrading');
 const receivePath=path.join(root,'lib/Socket/messages-recv.js');
 const socketPath=path.join(root,'lib/Socket/socket.js');
 let receive=fs.readFileSync(receivePath,'utf8'),socket=fs.readFileSync(socketPath,'utf8');
 const pairingStart=socket.indexOf('    const requestPairingCode = async (phoneNumber, customPairingCode) => {');
 const pairingEnd=socket.indexOf('    async function generatePairingKey()',pairingStart);
 if(pairingStart<0||pairingEnd<0)throw Error('Pinned phone pairing function was not found');
 let pairing=socket.slice(pairingStart,pairingEnd);
 pairing=replaceOne(pairing,'    const requestPairingCode = async (phoneNumber, customPairingCode) => {',`    let dentoraPendingPhonePairing;
    const requestPairingCode = async (phoneNumber, customPairingCode) => {
        // QR rotation must not silently invalidate the code the user is entering.
        // A fresh manager request explicitly resets the unpaired socket first.
        if (!customPairingCode && dentoraPendingPhonePairing?.number === phoneNumber) {
            return dentoraPendingPhonePairing.code;
        }
        dentoraPendingPhonePairing = undefined;`);
 pairing=replaceOne(pairing,'        await sendNode({','        try { await query({');
 pairing=replaceOne(pairing,`        });
        return authState.creds.pairingCode;`,`        }, 15000);
        } catch (error) {
            logger.error({ statusCode: Number(error?.output?.statusCode || error?.data) || 0 }, 'Dentora phone pairing registration was rejected by WhatsApp');
            authState.creds.pairingCode = undefined;
            if (!authState.creds.registered && authState.creds.me?.id === jidEncode(phoneNumber, 's.whatsapp.net')) {
                authState.creds.me = undefined;
            }
            ev.emit('creds.update', authState.creds);
            return undefined;
        }
        dentoraPendingPhonePairing = { number: phoneNumber, code: authState.creds.pairingCode };
        return authState.creds.pairingCode;`);
 socket=socket.slice(0,pairingStart)+pairing+socket.slice(pairingEnd);
 receive=replaceOne(receive,"const linkCodeCompanionReg = getBinaryNodeChild(node, 'link_code_companion_reg');",`const linkCodeCompanionReg = getBinaryNodeChild(node, 'link_code_companion_reg');
                // WhatsApp also sends a registration notification without crypto fields.
                if (!getBinaryNodeChildBuffer(linkCodeCompanionReg, 'primary_identity_pub')) { break; }`);
 socket=replaceOne(socket,'    // QR gen',`    let refreshPairingQR;
    // QR gen`);
 socket=replaceOne(socket,'        const advB64 = creds.advSecretKey;',`        const renderer = makePairingQRRenderer(refNodes.map(node => node.content.toString('utf-8')), ref => {
            const qr = [ref, noiseKeyB64, identityKeyB64, creds.advSecretKey].join(',');
            ev.emit('connection.update', { qr });
        });
        refreshPairingQR = () => renderer.refresh();`);
 socket=replaceOne(socket,`            const refNode = refNodes.shift();
            if (!refNode) {`,`            if (!renderer.next()) {`);
 socket=replaceOne(socket,`            const ref = refNode.content.toString('utf-8');
            const qr = [ref, noiseKeyB64, identityKeyB64, advB64].join(',');
            ev.emit('connection.update', { qr });\n`,'');
 socket=replaceOne(socket,'    // device paired for the first time',`    ws.on('CB:notification,type:companion_reg_refresh', node => {
        handleCompanionRegRefresh(node, {
            creds,
            emitCredsUpdate: update => ev.emit('creds.update', update),
            refreshQR: () => refreshPairingQR?.(),
            logger
        });
    });
    // device paired for the first time`);
 socket="import { handleCompanionRegRefresh, makePairingQRRenderer } from '../Utils/dentora-companion-pairing.js';\n"+socket;
 fs.writeFileSync(receivePath,receive);fs.writeFileSync(socketPath,socket);
 fs.copyFileSync(path.join(__dirname,'companion-pairing.js'),path.join(root,'lib/Utils/dentora-companion-pairing.js'));
 for(const file of [receivePath,socketPath,path.join(root,'lib/Utils/dentora-companion-pairing.js')])execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 return {version,patched:true};
}
module.exports={patchBaileys};
if(require.main===module){try{console.log('[Dentora Evolution] Pairing protocol compatibility patch installed: '+JSON.stringify(patchBaileys(process.argv[2]||'/evolution/node_modules/baileys')));}catch(error){console.error('Pairing compatibility patch failed: '+error.message);process.exitCode=1;}}
