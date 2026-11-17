export function preparePlansAccount(source) {
  const marker = /^const HTML=("[^\n]+");$/m;
  const match = source.match(marker);
  if (!match) throw new Error('The Plans Worker HTML differs from the expected source.');
  const html = JSON.parse(match[1]);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const script = scripts.find(([, body]) => body.includes('async function loadTipHistory()') && body.includes('async function checkGateway()'));
  const invocation = 'update();refresh();checkGateway();loadTipHistory();';
  const response = 'null:HTML,{headers:{"content-type":"text/html; charset=utf-8",';
  if (!script || !script[1].includes(invocation) || !source.includes(response)) {
    throw new Error('The Plans Worker account code differs from the expected source.');
  }
  const oldAccount = script[1].indexOf('async function rpc(name)');
  const firstControl = script[1].indexOf("const input=$('coinAmount')");
  const oldHistory = script[1].indexOf('async function loadTipHistory()');
  const start = script[1].indexOf(invocation);
  if (oldAccount < 0 || firstControl <= oldAccount || oldHistory <= firstControl || start <= oldHistory) {
    throw new Error('The Plans Worker account code could not be located.');
  }
  const updatedScript = script[1].slice(0, oldAccount) + script[1].slice(firstControl, oldHistory) +
    'update();checkGateway();' + script[1].slice(start + invocation.length);
  const updatedHtml = html.slice(0, script.index) + '<script>' + updatedScript + '</script>' + html.slice(script.index + script[0].length);
  return source.replace(marker, () => `const HTML=${JSON.stringify(updatedHtml)};`)
    .replace(response, 'null:HTML,{headers:{"x-uhz-plans-account":"1","content-type":"text/html; charset=utf-8",');
}
