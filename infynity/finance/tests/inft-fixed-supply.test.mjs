import test from 'node:test';
import assert from 'node:assert/strict';
import { INFT_FIXED_SUPPLY, validateInftSupply } from '../core.mjs';

test('INFT approved total supply is exactly 10m', () => {
 assert.equal(INFT_FIXED_SUPPLY, 10000000n);
 assert.equal(validateInftSupply('0x'+(10000000n*10n**18n).toString(16),18), true);
});

test('INFT rejects old 21m supply, zero, inflation and wrong decimal scale', () => {
 for(const wrong of [21000000n*10n**18n,0n,10000001n*10n**18n,10000000n*10n**6n]){
  assert.throws(()=>validateInftSupply('0x'+wrong.toString(16),18),/suministro fijo/);
 }
});

test('INFT rejects invalid decimals', () => {
 assert.throws(()=>validateInftSupply('0x01',19),/Decimales/);
 assert.throws(()=>validateInftSupply('0x01',-1),/Decimales/);
});
