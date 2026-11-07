export const kinds = ['deposit_mxn','withdraw_mxn','deposit_inft','withdraw_inft','buy_inft','sell_inft','coins_to_inft','inft_to_coins'];
export const userActions = new Set(['dashboard','request_detail','wallet_challenge','wallet_bind','create_request','confirm','cancel','upload_url','attach_proof','proof_url','attach_crypto_hash']);
export const adminActions = new Set(['admin_dashboard','admin_detail','admin_config','admin_price','admin_review','admin_proof_url']);
export function isInftSymbol(value) {
  if(typeof value!=='string'||!/^0x(?:[0-9a-f]{64})+$/i.test(value))return false;
  const data=value.slice(2).toLowerCase(),symbol='494e4654'.padEnd(64,'0');
  return data.length===64?data===symbol:data.slice(0,64)==='20'.padStart(64,'0')&&data.slice(64,128)==='4'.padStart(64,'0')&&data.slice(128)===symbol;
}
export function validClabe(value) {
  if (!/^\d{18}$/.test(value)) return false;
  const factors=[3,7,1]; let sum=0;
  for(let i=0;i<17;i++)sum+=(Number(value[i])*factors[i%3])%10;
  return (10-sum%10)%10===Number(value[17]);
}
export function paymentLink(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['mercadopago.com.mx','mercadopago.com','mpago.la'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}
}
export function fileType(b) {
  if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)return 'image/png';
  if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';
  if(String.fromCharCode(...b.slice(0,5))==='%PDF-')return 'application/pdf';
  return '';
}
export function safePayload(body) {
  const source=body.payload||{};if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Solicitud inválida.');
  const keys=['id','kind','amount','method','request_key','reference','note','clabe','holder','bank','nonce','address','signature','path','crypto_hash','decision','external_reference','verified','payment_link','bank_name','bank_holder','bank_clabe','token_address','treasury_address','fee_bps','price_mxn','coins_per_inft','reason','mime'];
  return Object.fromEntries(keys.filter(k=>Object.hasOwn(source,k)).map(k=>[k,source[k]]));
}
export function decimalUnits(value, decimals) {
  const s=String(value);if(!/^\d+(\.\d{1,8})?$/.test(s))throw Error('Importe inválido.');
  const [whole,fraction='']=s.split('.');
  if(fraction.length>decimals&&/[1-9]/.test(fraction.slice(decimals)))throw Error('La cantidad supera la precisión del contrato.');
  return BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.slice(0,decimals).padEnd(decimals,'0')||'0');
}
export function validateTransfer(receipt,canonical,cfg,r,tx,latest) {
  if(!receipt||receipt.status!=='0x1'||String(receipt.transactionHash).toLowerCase()!==tx.toLowerCase()||BigInt(receipt.blockNumber)>latest-128n)throw Error('La transferencia necesita 128 confirmaciones en Polygon.');
  if(!canonical||canonical.hash!==receipt.blockHash)throw Error('Revalida la transferencia confirmada.');
  const earliest=Date.parse(r.created_at)-(r.kind==='deposit_inft'?600000:0);
  if(!Number.isFinite(earliest)||Number(BigInt(canonical.timestamp))*1000+999<earliest)throw Error('La transferencia es anterior a esta solicitud.');
  const source=r.kind==='deposit_inft'?r.wallet_address:cfg.treasury_address;
  const dest=r.kind==='deposit_inft'?cfg.treasury_address:r.wallet_address;
  const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const logs=(receipt.logs||[]).filter(l=>!l.removed&&l.address.toLowerCase()===cfg.token_address&&l.topics?.length===3&&l.topics[0].toLowerCase()===topic&&('0x'+l.topics[1].slice(-40)).toLowerCase()===source&&('0x'+l.topics[2].slice(-40)).toLowerCase()===dest);
  const total=logs.reduce((a,l)=>a+BigInt(l.data),0n);
  if(total===0n||total!==decimalUnits(r.amount,cfg.token_decimals))throw Error('El contrato, las carteras o el importe de la transferencia no coinciden.');
  return total;
}
export const morseMap={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','-':'-....-'};
export const toMorse=text=>String(text).toUpperCase().split('').map(x=>morseMap[x]||'/').join(' ');
