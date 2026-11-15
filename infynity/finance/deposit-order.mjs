import { validClabe } from './core.mjs';

const activeStatuses = new Set(['requested', 'review', 'processing']);

export function needsDepositOrder(request) {
  return request?.kind === 'deposit_mxn' && request.method === 'transfer' &&
    activeStatuses.has(request.status) && !request.proof_path && !request.has_proof;
}

export function depositReceiver(bank) {
  const name = typeof bank?.name === 'string' ? bank.name.trim() : '';
  const holder = typeof bank?.holder === 'string' ? bank.holder.trim() : '';
  const clabe = typeof bank?.clabe === 'string' ? bank.clabe.trim() : '';
  if (!name || name.length > 100 || holder.length < 4 || holder.length > 160 ||
      !validClabe(clabe) || /^0+$/.test(clabe)) return null;
  return { name, holder, clabe };
}

export function depositOrder(request, bank) {
  if (!needsDepositOrder(request)) return null;
  const receiver = depositReceiver(bank);
  const { folio, created_at: createdAt } = request;
  const amount = Number(request.amount);
  if (!receiver || typeof folio !== 'string' || !/^[A-Z0-9-]{1,40}$/.test(folio) ||
      !Number.isFinite(Date.parse(createdAt)) || !/^\d{1,7}(?:\.\d{1,2}0*)?$/.test(String(request.amount)) ||
      amount < 0.01 || amount > 1000000) return null;
  return { folio, createdAt, amount, receiver };
}

const spanish = {
  locale: 'es-MX',
  title: 'Orden de depósito SPEI',
  amount: 'Importe a transferir',
  date: 'Fecha del folio',
  bank: 'Banco receptor',
  holder: 'Titular de la cuenta',
  clabe: 'CLABE interbancaria',
  reference: 'Concepto de pago',
  unavailable: 'La cuenta receptora SPEI está pendiente de configuración. La descarga se habilita al registrar el banco, el titular y la CLABE.',
  ready: 'Genera la factura para obtener tu folio y descargar las instrucciones de transferencia.',
  generate: 'Generar factura SPEI',
  create: 'Crear solicitud de depósito',
  view: 'Ver factura',
  download: 'Descargar factura',
  copy: 'Copiar CLABE',
  copied: 'CLABE copiada.',
  copyFailed: 'Selecciona los 18 dígitos para copiar la CLABE.',
  downloadFailed: 'La factura no se pudo descargar. Vuelve a intentarlo.',
  stepsTitle: 'Cómo hacer el depósito',
  steps: [
    'En tu banca, elige una transferencia SPEI por el importe indicado.',
    'Comprueba el titular y la CLABE. Escribe el folio en el campo Concepto de pago.',
    'Después de transferir, adjunta el comprobante de tu banco en Movimientos.'
  ],
  guidance: 'Usa el folio como concepto. Si ya transferiste, adjunta el comprobante de tu banco.',
  footer: 'Instrucciones de transferencia. El saldo se acredita después de conciliar el depósito.'
};

const english = {
  locale: 'en-US',
  title: 'SPEI deposit order',
  amount: 'Amount to transfer',
  date: 'Request date',
  bank: 'Receiving bank',
  holder: 'Account holder',
  clabe: 'Bank account CLABE',
  reference: 'Payment description',
  unavailable: 'The receiving SPEI account is awaiting setup. The download becomes available after the bank, account holder and CLABE are saved.',
  ready: 'Generate the invoice to receive your request ID and download the transfer instructions.',
  generate: 'Generate SPEI invoice',
  create: 'Create deposit request',
  view: 'View invoice',
  download: 'Download invoice',
  copy: 'Copy CLABE',
  copied: 'CLABE copied.',
  copyFailed: 'Select the 18 digits to copy the CLABE.',
  downloadFailed: 'The invoice could not be downloaded. Try again.',
  stepsTitle: 'How to make the deposit',
  steps: [
    'Open your banking app and start a SPEI transfer for the stated amount.',
    'Check the account holder and CLABE. Enter the request ID as the payment description.',
    'After making the transfer, upload your bank receipt in Transactions.'
  ],
  guidance: 'Use the request ID as the payment description. If you already paid, upload your bank receipt.',
  footer: 'Transfer instructions. Your balance is credited after the deposit is reconciled.'
};

export const depositCopy = language => language?.toLowerCase().startsWith('en') ? english : spanish;

export function depositAmount(amount, locale) {
  return '$' + new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' MXN';
}

export function depositDate(createdAt, locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'America/Mexico_City'
  }).format(new Date(createdAt));
}
