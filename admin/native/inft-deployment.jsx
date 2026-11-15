import React, { useEffect, useRef, useState } from 'react';
import * as api from './api.mjs';
import { Button, Dialog, ErrorBox, Facts, SafeLink } from './ui.jsx';
import { connectPolygon, previousDeployment, publishContract, removeFailedDeployment,
  validAddress, verifyDeployment, walletMessage } from './inft-wallet.mjs';

export function InftDeployment({ configuredTreasury, onClose, onUse }) {
  const [account, setAccount] = useState('');
  const [pending, setPending] = useState(previousDeployment);
  const [contract, setContract] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const action = useRef(false);
  const treasury = pending?.treasury || configuredTreasury?.toLowerCase() || account;

  async function run(operation) {
    if (action.current) return;
    action.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (failure) {
      setError(walletMessage(failure));
    } finally {
      action.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!pending || contract) return;
    let active = true;
    let timer;
    async function check(attempt) {
      try {
        const result = await verifyDeployment(pending);
        if (!active) return;
        if (result.state === 'confirmed') {
          setContract(result.address);
          return;
        }
        if (result.state === 'failed') {
          removeFailedDeployment(pending.hash);
          setPending(null);
          setError('Polygon rechazó el despliegue. Revisa la transacción en tu cartera antes de volver a intentarlo.');
          return;
        }
        if (attempt < 8) timer = setTimeout(() => check(attempt + 1), 2000);
      } catch (failure) {
        if (active) setError(walletMessage(failure));
      }
    }
    void check(1);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pending, contract, revision]);

  async function publish() {
    if (!validAddress(treasury)) throw new Error('Revisa la dirección pública de la tesorería.');
    const deployment = await publishContract(account, treasury, async () => {
      const { config } = await api.finance('admin_dashboard');
      if (config.token_address) throw new Error('Ya hay un contrato registrado. Actualiza la configuración para revisarlo.');
      if ((config.treasury_address?.toLowerCase() || account) !== treasury) {
        throw new Error('La tesorería cambió. Actualiza la configuración y verifica la dirección.');
      }
    });
    setPending(deployment);
  }

  return <Dialog title="Crear contrato INFT" onClose={() => !action.current && onClose()}>
    {error && <ErrorBox error={error}/>}
    <Facts record={{ network: 'Polygon', emission: '10,000,000 INFT' }}
      fields={[[ 'network', 'Red' ], [ 'emission', 'Emisión inicial' ]]}/>
    {treasury && <div className="inset">
      <h3>Cartera que recibirá los INFT</h3>
      <p className="mono wrap">{treasury}</p>
      {contract && <><h3>Dirección del contrato</h3><p className="mono wrap">{contract}</p></>}
    </div>}
    {pending ? <>
      <p role="status">{contract ? 'Contrato confirmado en Polygon.' : 'Transacción enviada. Esperando la confirmación de Polygon.'}</p>
      <SafeLink url={'https://polygonscan.com/tx/' + pending.hash}>Ver transacción en PolygonScan</SafeLink>
    </> : <p>{account
      ? 'Revisa la cartera receptora. Tu extensión mostrará el costo en POL y pedirá tu confirmación para publicar.'
      : 'Conecta la cartera que usas para administrar la tesorería. El contrato enviará ahí la emisión inicial si todavía no hay una tesorería registrada.'}</p>}
    <div className="form-footer">
      {contract ? <Button variant="primary" onClick={() => onUse({ token_address: contract, treasury_address: treasury })}>Cargar en configuración</Button>
        : pending ? <Button icon="refresh" onClick={() => { setError(''); setRevision(value => value + 1); }}>Comprobar transacción</Button>
        : account ? <>
          <Button disabled={busy} onClick={() => run(async () => setAccount(await connectPolygon()))}>Revisar cartera</Button>
          <Button variant="primary" disabled={busy} onClick={() => run(publish)}>{busy ? 'Esperando a la cartera…' : 'Publicar contrato'}</Button>
        </> : <Button variant="primary" disabled={busy} onClick={() => run(async () => setAccount(await connectPolygon()))}>
          {busy ? 'Conectando…' : 'Conectar cartera'}
        </Button>}
    </div>
  </Dialog>;
}
