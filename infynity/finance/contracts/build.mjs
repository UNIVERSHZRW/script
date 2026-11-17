import { readFileSync, writeFileSync } from 'node:fs';
import solc from 'solc';

const name = 'INFYNITY.sol';
const source = readFileSync(new URL(name, import.meta.url), 'utf8');
const prefix = '@openzeppelin/contracts@5.6.1/';
const input = {
  language: 'Solidity',
  sources: { [name]: { content: source } },
  settings: {
    evmVersion: 'paris',
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['evm.bytecode.object'] } },
  },
};
const result = JSON.parse(solc.compile(JSON.stringify(input), {
  import(path) {
    if (!path.startsWith(prefix)) return { error: 'Unsupported import: ' + path };
    const url = new URL('node_modules/@openzeppelin/contracts/' + path.slice(prefix.length), import.meta.url);
    return { contents: readFileSync(url, 'utf8') };
  },
}));
const errors = result.errors?.filter(item => item.severity === 'error') ?? [];
if (errors.length) throw new Error(errors.map(item => item.formattedMessage).join('\n'));
const code = result.contracts[name].INFYNITY.evm.bytecode.object;
writeFileSync(new URL('creation-code.mjs', import.meta.url),
  '// Generated from INFYNITY.sol with Solidity 0.8.38 and OpenZeppelin 5.6.1.\n'
  + 'export const creationCode = ' + JSON.stringify('0x' + code) + ';\n');
