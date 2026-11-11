/* UNIVERSHZRW — deterministic policy primitives; server-side callers must authenticate events.
   IMPORTANT: This module never credits wallets, authorizes payouts, or exchanges INFT. */
const BPS=10000;
const BONUSES=Object.freeze({50:5,150:23,500:100});
function whole(value,name){if(!Number.isSafeInteger(value)||value<0)throw new RangeError(name+' debe ser un entero no negativo');return value;}
function id(value){return typeof value==='string'&&value.length>0;}
export function quoteCoins(baseCoins){
  whole(baseCoins,'baseCoins');
  if(baseCoins<1||baseCoins>5000)throw new RangeError('Paquete fuera de rango');
  const bonusCoins=BONUSES[baseCoins]??0;
  return Object.freeze({priceCents:baseCoins*100,baseCoins,bonusCoins,totalCoins:baseCoins+bonusCoins,bonusRedeemable:false});
}
export function verifiedNet(grossCents,{vatBps=1600,processorBps=349,processorFixedCents=400,processorVatBps=1600}={}){
  whole(grossCents,'grossCents');
  for(const [k,v] of Object.entries({vatBps,processorBps,processorFixedCents,processorVatBps}))whole(v,k);
  if(vatBps>10000||processorBps>10000||processorVatBps>10000)throw new RangeError('Porcentaje inválido');
  const vatIncludedCents=Math.round(grossCents*vatBps/(BPS+vatBps));
  const processingCents=Math.round((grossCents*processorBps/BPS+processorFixedCents)*(BPS+processorVatBps)/BPS);
  const netCents=Math.max(0,grossCents-vatIncludedCents-processingCents);
  return Object.freeze({grossCents,vatIncludedCents,processingCents,netCents,feeAssumptions:true});
}
export function creatorPool(netCents,kind){
  whole(netCents,'netCents');
  if(!['paid-content','premium'].includes(kind))throw new RangeError('Origen no compatible');
  const creatorBps=kind==='premium'?3000:7000;
  const creatorCents=Math.floor(netCents*creatorBps/BPS);
  return Object.freeze({source:kind,netCents,creatorCents,platformCents:netCents-creatorCents});
}
export function accessRoyalty({source,buyerId,creatorId,sameBeneficialOwner=false,verified=false,
                                 allocatedNetCents=0,creatorAllowsPromo=false,verifiedCampaignFundingCents=0}){
  whole(allocatedNetCents,'allocatedNetCents');whole(verifiedCampaignFundingCents,'verifiedCampaignFundingCents');
  if(!id(buyerId)||!id(creatorId))return {allowed:false,royaltyCents:0,reason:'identity_unverified'};
  if(buyerId===creatorId||sameBeneficialOwner)return {allowed:false,royaltyCents:0,reason:'self_dealing'};
  if(source==='promo-coins'||source==='mined-coins'){
    if(!creatorAllowsPromo&&verifiedCampaignFundingCents===0)return {allowed:false,royaltyCents:0,reason:'promo_not_authorized'};
    // Promotional grants can never be redeemed. An explicitly VERIFIED sponsor pool is the only exception.
    if(verifiedCampaignFundingCents>0&&!verified)return {allowed:false,royaltyCents:0,reason:'funding_unverified'};
    return {allowed:true,royaltyCents:verifiedCampaignFundingCents?creatorPool(verifiedCampaignFundingCents,'paid-content').creatorCents:0,
            reason:verifiedCampaignFundingCents?'verified_sponsor_pool':'free_promotion'};
  }
  if(source==='premium')return {allowed:verified,royaltyCents:0,reason:verified?'monthly_pool_only':'subscription_unverified'};
  if(source==='paid-coins'){
    if(!verified||allocatedNetCents===0)return {allowed:false,royaltyCents:0,reason:'payment_unverified'};
    return {allowed:true,royaltyCents:creatorPool(allocatedNetCents,'paid-content').creatorCents,reason:'verified_paid_consumption'};
  }
  return {allowed:false,royaltyCents:0,reason:'unknown_source'};
}
export function campaignClaim({state,budgetRemainingCoins,rewardCoins,perPersonClaims=0,personCap=1,
                               verifiedAction=false,identityApproved=false,riskHold=false}){
  whole(budgetRemainingCoins,'budgetRemainingCoins');whole(rewardCoins,'rewardCoins');
  whole(perPersonClaims,'perPersonClaims');whole(personCap,'personCap');
  if(state!=='active'||rewardCoins===0||budgetRemainingCoins<rewardCoins)
    return {allowed:false,reason:'budget_or_state',reserveCoins:0};
  if(perPersonClaims>=personCap)return {allowed:false,reason:'person_cap',reserveCoins:0};
  if(!verifiedAction||!identityApproved||riskHold)return {allowed:false,reason:'review_required',reserveCoins:0};
  // Caller MUST atomically lock campaign/person and debit budget; do not trust a browser-side result.
  return {allowed:true,reason:'reserve_atomically',reserveCoins:rewardCoins};
}
export function distributePremiumPool(poolCents,qualifiedShares){
  whole(poolCents,'poolCents');
  if(!Array.isArray(qualifiedShares))throw new TypeError('Se requieren participaciones verificadas');
  const seen=new Set();
  const shares=qualifiedShares.map(v=>{
    if(!v||!id(v.creatorId)||!Number.isSafeInteger(v.weight)||v.weight<1||seen.has(v.creatorId))
      throw new RangeError('Participación inválida o duplicada');
    seen.add(v.creatorId);return {creatorId:v.creatorId,weight:v.weight};
  });
  if(!shares.length)return [];
  const totalWeight=shares.reduce((a,v)=>a+v.weight,0);
  if(!Number.isSafeInteger(totalWeight))throw new RangeError('Pesos acumulados fuera de rango');
  const rows=shares.map(v=>({creatorId:v.creatorId,base:Math.floor(poolCents*v.weight/totalWeight),
    remainder:(poolCents*v.weight)%totalWeight}));
  let leftover=poolCents-rows.reduce((a,v)=>a+v.base,0);
  const order=[...rows].sort((a,b)=>b.remainder-a.remainder||a.creatorId.localeCompare(b.creatorId));
  for(let i=0;i<leftover;i++)order[i].base++;
  return rows.map(v=>({creatorId:v.creatorId,amountCents:v.base}));
}
