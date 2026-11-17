const copy = {
  es: {
    title: 'Valoración de UniversHZRW', empty: 'La valoración aparecerá al publicar un corte de la empresa.',
    company: 'Valor estimado de la empresa', holding: 'Valor estimado de tus INFT', unit: 'Referencia por 1 INFT',
    noBasis: 'Base de unidades pendiente', cut: 'Corte', first: 'Primer corte disponible',
    delta: 'Variación desde el corte anterior', format: 'es-MX', noChange: 'Sin variación en este corte',
    assets: 'Activos estimados', accounts: 'Cuentas registradas', resources: 'Recursos', products: 'Productos',
    adjustments: 'Ajustes de riesgo', fullReport: 'Consultar metodología y métricas', graph: 'Historial de valor estimado',
    note: 'La equivalencia se calcula sobre tu tenencia total. El cambio de valor se registra como referencia en MXN.',
    exchange: 'Para operar, consulta la cotización disponible en Convertir.',
    allocations: 'Participación en ventas', amounts: 'Estimación acumulada', eligible: 'INFT enteros vigentes',
    noTerms: 'El reparto se calculará cuando se registren sus condiciones.',
    noSales: 'Aún no tienes estimaciones por ventas conciliadas.',
    allocationNote: 'El cálculo usa los INFT enteros registrados al conciliar la venta. Los importes estimados están sujetos al cierre de utilidades.',
    date: 'Fecha', product: 'Producto', amount: 'Importe', state: 'Estado',
    coins: 'Coins', plan: 'Plan', reversed: 'Revertido', estimated: 'Estimado', holdingDelta: 'Variación a tenencia actual',
  },
  en: {
    title: 'UniversHZRW valuation', empty: 'The valuation will appear when a business report is published.',
    company: 'Estimated company value', holding: 'Estimated value of your INFT', unit: 'Reference per 1 INFT',
    noBasis: 'Unit basis pending', cut: 'Reporting date', first: 'First available report',
    delta: 'Change since the previous report', format: 'en-US', noChange: 'No change in this report',
    assets: 'Estimated assets', accounts: 'Registered accounts', resources: 'Resources', products: 'Products',
    adjustments: 'Risk adjustments', fullReport: 'View methodology and metrics', graph: 'Estimated value history',
    note: 'The estimate uses your total holdings. Changes in value are shown as an MXN reference.',
    exchange: 'To make a transaction, check the available conversion quote.',
    allocations: 'Share of sales', amounts: 'Estimated total', eligible: 'Active whole INFT',
    noTerms: 'Your share will be calculated once the terms are on record.',
    noSales: 'You do not yet have estimates from reconciled sales.',
    allocationNote: 'The calculation uses whole INFT recorded when the payment is reconciled. Estimated amounts are subject to the profit closing.',
    date: 'Date', product: 'Product', amount: 'Amount', state: 'Status',
    coins: 'Coins', plan: 'Plan', reversed: 'Reversed', estimated: 'Estimated', holdingDelta: 'Change at current holdings',
  },
};

const labels = language => copy[String(language).toLowerCase().startsWith('en') ? 'en' : 'es'];
const sameDate = /^\d{4}-\d{2}-\d{2}$/;
const cutDate = date => sameDate.test(date ?? '') ? date : '—';

function money(value, c, precision = 2) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat(c.format, {
    style: 'currency', currency: 'MXN', currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2, maximumFractionDigits: precision,
  }).format(Number(value));
}

function signedMoney(value, c) {
  return Number(value) > 0 ? '+' + money(value, c) : money(value, c);
}

function chart(history, c) {
  const dates = (history || []).filter(x => sameDate.test(x.snapshot_date) && Number.isFinite(Number(x.value_mxn)));
  if (dates.length < 2) return '';
  const values = dates.map(point => Number(point.value_mxn));
  const bottom = Math.min(...values), top = Math.max(...values), span = top - bottom || 1;
  const coordinates = values.map((value, index) => {
    const x = 12 + index * 576 / (values.length - 1);
    const y = top === bottom ? 69 : 119 - (value - bottom) * 100 / span;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  return '<svg class="chart ref-chart" viewBox="0 0 600 138" preserveAspectRatio="none" role="img" aria-label="'
    + c.graph + '"><path d="M12 19H588 M12 69H588 M12 119H588" fill="none" stroke-dasharray="4 4"/>'
    + '<polyline points="' + coordinates + '" fill="none" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>'
    + '<div class="chart-labels"><span>' + cutDate(dates[0].snapshot_date) + '</span><span>'
    + cutDate(dates.at(-1).snapshot_date) + '</span></div>';
}

function movement(latest, previous, c) {
  if (!previous) return '<p class="sub">' + c.first + '</p>';
  const change = latest.value_mxn - previous.value_mxn;
  const rows = [
    ['accounts_mxn', c.accounts], ['resources_mxn', c.resources], ['products_mxn', c.products],
    ['assets_mxn', c.assets], ['adjustments_mxn', c.adjustments],
  ].flatMap(([key, label]) => {
    const delta = latest[key] - previous[key];
    return delta !== 0 ? [label + ' ' + signedMoney(delta, c)] : [];
  });
  return '<div class="reason"><strong>' + c.delta + ' · ' + signedMoney(change, c)
    + ' MXN</strong>' + (rows.length ? rows.join(' · ') : c.noChange) + '</div>';
}

export function holdingReference(data, language) {
  const c = labels(language);
  return data?.holding_value_mxn == null ? '' : money(data.holding_value_mxn, c) + ' MXN · ' + c.holding;
}

export function valuationPanel(data, language) {
  const c = labels(language);
  const latest = data?.valuation;
  if (!latest) return '<section class="box"><h2>' + c.title + '</h2><p class="sub">' + c.empty + '</p></section>';
  const balance = data.holding_value_mxn == null ? c.noBasis : money(data.holding_value_mxn, c) + ' MXN';
  return '<section class="box reference-panel"><div class="box-head"><h2>' + c.title + '</h2><span class="status">'
    + c.cut + ' ' + cutDate(latest.snapshot_date) + '</span></div>'
    + '<div class="ref-amounts"><div><span>' + c.company + '</span><strong>' + money(latest.value_mxn, c) + ' MXN</strong></div>'
    + '<div><span>' + c.holding + '</span><strong>' + balance + '</strong></div></div>'
    + '<div class="mini-list"><div class="mini-row"><span>' + c.unit + '</span><b>'
    + (data.unit_value_mxn == null ? '—' : money(data.unit_value_mxn, c, 8) + ' MXN') + '</b></div>'
    + (data.holding_change_mxn == null ? '' : '<div class="mini-row"><span>' + c.holdingDelta + '</span><b>'
      + signedMoney(data.holding_change_mxn, c) + ' MXN</b></div>')
    + '</div>' + chart(data.history, c) + movement(latest, data.previous, c)
    + '<p class="sub">' + c.note + ' ' + c.exchange + '</p><a class="row-link" href="/inversionistas">' + c.fullReport + ' →</a></section>';
}

export function allocationPanel(data, language) {
  if (!data) return '';
  const c = labels(language);
  const formatter = new Intl.DateTimeFormat(c.format, { dateStyle: 'medium', timeZone: 'America/Mexico_City' });
  const entries = data.allocations || [];
  const activity = entries.length ? '<div class="table-wrap"><table><thead><tr><th>' + c.date + '</th><th>' + c.product
    + '</th><th>' + c.amount + '</th><th>' + c.state + '</th></tr></thead><tbody>'
    + entries.map(entry => {
      const date = new Date(entry.created_at);
      return '<tr><td>' + (Number.isFinite(date.valueOf()) ? formatter.format(date) : '—')
        + '</td><td>' + (entry.product === 'plan' ? c.plan : c.coins)
        + '</td><td>' + money(entry.amount_mxn, c) + ' MXN</td><td>'
        + (entry.reversed_at ? c.reversed : c.estimated) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="sub">' + c.noSales + '</p>';
  const eligible = Number.isFinite(Number(data.eligible_units)) ? new Intl.NumberFormat(c.format).format(Number(data.eligible_units)) : '—';
  return '<section class="box"><h2>' + c.allocations + '</h2><div class="mini-list">'
    + '<div class="mini-row"><span>' + c.amounts + '</span><b>' + money(data.allocation_total_mxn, c) + ' MXN</b></div>'
    + '<div class="mini-row"><span>' + c.eligible + '</span><b>' + eligible + '</b></div></div>'
    + (data.share_bps == null ? '<p class="sub">' + c.noTerms + '</p>' : '')
    + activity + '<p class="sub">' + c.allocationNote + '</p></section>';
}
