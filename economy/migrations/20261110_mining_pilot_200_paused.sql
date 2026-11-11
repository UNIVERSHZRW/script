-- Campaña piloto de 200 Coins promocionales; queda EN PAUSA, no acredita fondos.
INSERT INTO private.uhz_eco_mining_campaigns
 (campaign_key,title,starts_at,ends_at,budget_coins,spent_coins,max_per_account,max_per_day,enabled)
VALUES
 ('piloto_200_coins','Piloto de recompensas de 200 Coins',
  now(),now()+interval '90 days',200,0,5,5,false)
ON CONFLICT(campaign_key) DO NOTHING;
