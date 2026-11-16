export const kinds = ['deposit_mxn','withdraw_mxn','buy_inft','sell_inft','coins_to_inft','inft_to_coins'];
export const userActions = new Set(['dashboard','request_detail','create_request','confirm','cancel','upload_url','attach_proof','proof_url','business']);
export const businessAdminActions = new Set(['admin_business','admin_business_terms','admin_business_sale','admin_business_reverse']);
export const adminActions = new Set(['admin_dashboard','admin_detail','admin_config','admin_price','admin_review','admin_proof_url',...businessAdminActions]);
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
  const keys=['id','kind','amount','method','request_key','reference','note','clabe','holder','bank','path','decision','external_reference','verified','payment_link','bank_name','bank_holder','bank_clabe','token_address','treasury_address','fee_bps','price_mxn','coins_per_inft','reason','mime','unit_base','basis_reference','share_bps','terms_reference','product','gross_mxn','costs_mxn','sale_id'];
  return Object.fromEntries(keys.filter(k=>Object.hasOwn(source,k)).map(k=>[k,source[k]]));
}
export function decimalUnits(value, decimals) {
  const s=String(value);if(!/^\d+(\.\d{1,8})?$/.test(s))throw Error('Importe inválido.');
  const [whole,fraction='']=s.split('.');
  if(fraction.length>decimals&&/[1-9]/.test(fraction.slice(decimals)))throw Error('La cantidad supera la precisión del contrato.');
  return BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.slice(0,decimals).padEnd(decimals,'0')||'0');
}
export const morseMap={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','-':'-....-'};
export const toMorse=text=>String(text).toUpperCase().split('').map(x=>morseMap[x]||'/').join(' ');
