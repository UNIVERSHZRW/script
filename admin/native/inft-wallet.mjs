import { creationCode } from '../../infynity/finance/contracts/creation-code.mjs';

const polygon = '0x89';
const polygonNetwork = {
  chainId: polygon,
  chainName: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://polygon.drpc.org'],
  blockExplorerUrls: ['https://polygonscan.com'],
};
const address = /^0x[0-9a-f]{40}$/i;
const txHash = /^0x[0-9a-f]{64}$/i;
const pendingKey = 'uhz-inft-polygon-deployment';

export function validAddress(value) {
  return typeof value === 'string' && address.test(value) && !/^0x0{40}$/i.test(value);
}
function initCode(treasury) {
  if (!validAddress(treasury)) throw new Error('Revisa la dirección pública de la tesorería.');
  return creationCode + treasury.slice(2).toLowerCase().padStart(64, '0');
}
function walletProvider() {
  const provider = window.ethereum;
  if (!provider?.request) throw new Error('Abre la administración en un navegador con MetaMask para conectar tu cartera.');
  return provider;
}
async function onPolygon(provider) {
  const chainId = await provider.request({ method: 'eth_chainId' });
  return typeof chainId === 'string' && chainId.toLowerCase() === polygon;
}
async function requirePolygon(provider) {
  if (!await onPolygon(provider)) throw new Error('Selecciona la red principal Polygon en tu cartera.');
}
export async function connectPolygon() {
  const provider = walletProvider();
  await provider.request({ method: 'eth_requestAccounts' });
  if (!await onPolygon(provider)) {
    const change = () => provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: polygon }] });
    try {
      await change();
    } catch (error) {
      if (Number(error?.code) !== 4902 && Number(error?.data?.originalError?.code) !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [polygonNetwork] });
      if (!await onPolygon(provider)) await change();
    }
  }
  await requirePolygon(provider);
  const [account] = await provider.request({ method: 'eth_accounts' });
  if (!validAddress(account)) throw new Error('Selecciona una cuenta de tu cartera.');
  return account.toLowerCase();
}
export function previousDeployment() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(pendingKey));
    if (txHash.test(saved?.hash) && validAddress(saved.account) && validAddress(saved.treasury)) return saved;
  } catch {}
  return null;
}
export function removeFailedDeployment(hash) {
  try {
    if (previousDeployment()?.hash === hash) window.localStorage.removeItem(pendingKey);
  } catch {}
}

export async function publishContract(account, treasury, checkSettings) {
  const publish = async () => {
    const previous = previousDeployment();
    if (previous) return previous;
    await checkSettings();
    const provider = walletProvider();
    await requirePolygon(provider);
    const [current] = await provider.request({ method: 'eth_accounts' });
    if (current?.toLowerCase() !== account) throw new Error('La cuenta cambió. Vuelve a conectar la cartera y revisa la tesorería.');
    const transaction = { from: account, value: '0x0', data: initCode(treasury) };
    const gas = await provider.request({ method: 'eth_estimateGas', params: [transaction] });
    if (typeof gas !== 'string' || !/^0x[1-9a-f][0-9a-f]*$/i.test(gas)) {
      throw new Error('Polygon no pudo estimar el costo del despliegue. Revisa la conexión de tu cartera.');
    }
    await requirePolygon(provider);
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ ...transaction, gas }],
    });
    if (!txHash.test(hash)) throw new Error('Consulta el registro de transacciones de tu cartera para obtener el hash del despliegue.');
    const deployment = { account, treasury, hash: hash.toLowerCase() };
    try { window.localStorage.setItem(pendingKey, JSON.stringify(deployment)); } catch {}
    return deployment;
  };
  if (!navigator.locks?.request) return publish();
  return navigator.locks.request(pendingKey, { ifAvailable: true }, lock => {
    if (!lock) throw new Error('Ya hay una solicitud de despliegue abierta en otra pestaña.');
    return publish();
  });
}
export async function verifyDeployment(deployment) {
  const { hash, account, treasury } = deployment;
  const provider = walletProvider();
  await requirePolygon(provider);
  const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [hash] });
  if (!receipt) return { state: 'pending' };
  if (receipt.transactionHash?.toLowerCase() !== hash) throw new Error('La respuesta de Polygon no coincide con la transacción.');
  if (receipt.status === '0x0') return { state: 'failed' };
  if (receipt.status !== '0x1' || !validAddress(receipt.contractAddress)) throw new Error('La transacción no devolvió una dirección de contrato.');
  const tx = await provider.request({ method: 'eth_getTransactionByHash', params: [hash] });
  if (!tx) return { state: 'pending' };
  if (tx.hash?.toLowerCase() !== hash || tx.blockHash !== receipt.blockHash
    || tx.to !== null || tx.from?.toLowerCase() !== account || tx.input?.toLowerCase() !== initCode(treasury)) {
    throw new Error('La transacción no corresponde al contrato INFYNITY y la tesorería seleccionada.');
  }
  return { state: 'confirmed', address: receipt.contractAddress.toLowerCase() };
}
export function walletMessage(error) {
  if (Number(error?.code) === 4001) return 'Cancelaste la solicitud en la cartera.';
  if (Number(error?.code) === -32002) return 'Revisa la solicitud abierta en la extensión de tu cartera.';
  const message = error?.message || '';
  if (/insufficient funds|not enough (?:gas|funds|balance)|insufficient balance/i.test(message)) {
    return 'La cartera necesita saldo en POL para pagar el costo del despliegue.';
  }
  return message.slice(0, 220) || 'No se pudo consultar la cartera. Revisa la conexión a Polygon.';
}
