import test from 'node:test';
import assert from 'node:assert/strict';
import { depositOrder, depositReceiver } from '../deposit-order.mjs';
import { createDepositPdf } from '../deposit-pdf.js';

const receiver = { name: 'Banco de prueba', holder: 'Titular de prueba', clabe: '032180000118359719' };
const request = {
  kind: 'deposit_mxn',
  method: 'transfer',
  status: 'review',
  amount: '100.01000000',
  folio: 'INFT-261115-EXAMPLE',
  created_at: '2026-11-15T05:52:00.000Z'
};

test('an existing transfer can produce an order once a valid receiving account is configured', () => {
  assert.equal(depositOrder(request, null), null);
  assert.equal(depositReceiver({ ...receiver, holder: ' ' }), null);
  assert.equal(depositReceiver({ ...receiver, clabe: '032180000118359718' }), null);
  assert.equal(depositReceiver({ ...receiver, clabe: '000000000000000000' }), null);
  assert.equal(depositOrder({ ...request, amount: '100.011' }, receiver), null);
  assert.deepEqual(depositOrder(request, receiver), {
    folio: request.folio, amount: 100.01, createdAt: request.created_at, receiver
  });
});

test('only an active bank transfer without uploaded evidence offers a new payment order', () => {
  for (const overrides of [
    { status: 'completed' }, { status: 'cancelled' }, { method: 'card' },
    { kind: 'deposit_inft' }, { proof_path: 'uploaded.pdf' }
  ]) {
    assert.equal(depositOrder({ ...request, ...overrides }, receiver), null);
  }
});

test('the deposit order generates a printable PDF in Spanish and English', () => {
  const order = depositOrder(request, receiver);
  for (const language of ['es', 'en']) {
    const pdf = createDepositPdf(order, language);
    assert.equal(pdf.getNumberOfPages(), 1);
    assert.match(pdf.output(), /^%PDF-/);
  }
});
