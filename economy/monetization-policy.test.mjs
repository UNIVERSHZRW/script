import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteCoins,verifiedNet,creatorPool,accessRoyalty,campaignClaim,distributePremiumPool} from './monetization-policy.mjs';

test('Promotions remain nonredeemable and limited to published packs',()=>{
  for(const [base,extra] of [[50,5],[150,23],[500,100]]) {
    const q=quoteCoins(base); assert.equal(q.bonusCoins,extra);assert.equal(q.totalCoins,base+extra);assert.equal(q.bonusRedeemable,false);
  }
  assert.equal(quoteCoins(100).bonusCoins,0);
  assert.throws(()=>quoteCoins(5001),RangeError);
});
test('Creator receives 70 percent of net verified revenue, not gross face value',()=>{
 const net=verifiedNet(10000);assert.equal(net.vatIncludedCents,1379);assert.equal(net.processingCents,869);
 assert.equal(net.netCents,7752);assert.deepEqual(creatorPool(net.netCents,'paid-content'),
 {source:'paid-content',netCents:7752,creatorCents:5426,platformCents:2326});
});
test('Premium $49 has a finite creator fund, not a royalty per file',()=>{
 const net=verifiedNet(4900);assert.equal(net.netCents,3562);
 assert.deepEqual(creatorPool(net.netCents,'premium'),
 {source:'premium',netCents:3562,creatorCents:1068,platformCents:2494});
 assert.deepEqual(accessRoyalty({source:'premium',buyerId:'buyer',creatorId:'author',verified:true}),
 {allowed:true,royaltyCents:0,reason:'monthly_pool_only'});
});
test('Same user or related accounts cannot generate any royalty',()=>{
 assert.equal(accessRoyalty({source:'paid-coins',buyerId:'x',creatorId:'x',verified:true,allocatedNetCents:10000}).reason,'self_dealing');
 assert.equal(accessRoyalty({source:'paid-coins',buyerId:'x',creatorId:'y',sameBeneficialOwner:true,verified:true,allocatedNetCents:10000}).royaltyCents,0);
});
test('Mining and promotional Coins cannot create withdrawable money',()=>{
 assert.deepEqual(accessRoyalty({source:'mined-coins',buyerId:'x',creatorId:'y',creatorAllowsPromo:true}),{allowed:true,royaltyCents:0,reason:'free_promotion'});
 assert.equal(accessRoyalty({source:'promo-coins',buyerId:'x',creatorId:'y'}).allowed,false);
 assert.equal(accessRoyalty({source:'promo-coins',buyerId:'x',creatorId:'y',verifiedCampaignFundingCents:100}).allowed,false);
 assert.equal(accessRoyalty({source:'promo-coins',buyerId:'x',creatorId:'y',verified:true,verifiedCampaignFundingCents:100}).royaltyCents,70);
});
test('Claims require campaign limits, verified work and identity; no extra payout at cap',()=>{
 const valid={state:'active',budgetRemainingCoins:200,rewardCoins:5,verifiedAction:true,identityApproved:true};
 assert.deepEqual(campaignClaim(valid),{allowed:true,reason:'reserve_atomically',reserveCoins:5});
 assert.equal(campaignClaim({...valid,perPersonClaims:1}).allowed,false);
 assert.equal(campaignClaim({...valid,budgetRemainingCoins:4}).allowed,false);
 assert.equal(campaignClaim({...valid,riskHold:true}).allowed,false);
 assert.equal(campaignClaim({...valid,identityApproved:false}).allowed,false);
});
test('Premium shares exactly exhaust the fixed verified monthly fund',()=>{
 const shares=distributePremiumPool(1069,[{creatorId:'a',weight:2},{creatorId:'b',weight:1}]);
 assert.equal(shares.reduce((n,v)=>n+v.amountCents,0),1069);
 assert.deepEqual(shares,[{creatorId:'a',amountCents:713},{creatorId:'b',amountCents:356}]);
 assert.deepEqual(distributePremiumPool(500,[]),[]);
 assert.throws(()=>distributePremiumPool(100,[{creatorId:'x',weight:1},{creatorId:'x',weight:2}]));
});
