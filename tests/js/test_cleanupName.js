// Test of cleanupName() in meclib.js (names typed into the input field of forceGen and momentGen).
// Run from the repo root: node tests/js/test_cleanupName.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'meclib.js'), 'utf8');
function extract(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(name + ' not found in meclib.js');
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
}
const cleanupName = new Function(extract('cleanupName') + '\nreturn cleanupName;')();
const toTEX = new Function(extract('toTEX') + '\nreturn toTEX;')();

const cases = [
  // unchanged behaviour
  ['F', 'F'],
  ['F1', 'F_1'],
  ['FA', 'F_A'],
  ['F_A', 'F_A'],
  ['F12', 'F_12'],
  ['FA_x', 'F_Ax'],
  ['m g', 'm g'],
  ['m*g', 'm g'],
  // Greek names stay whole, the rest becomes a subscript
  ['phi', 'phi'],
  ['omega', 'omega'],
  ['Theta', 'Theta'],
  ['omegaS', 'omega_S'],
  ['omega_S', 'omega_S'],
  ['alphax', 'alpha_x'],
  // accents directly after the base, without underscore
  ['Fhat', 'Fhat'],
  ['F_hat', 'Fhat'],
  ['FhatA', 'Fhat_A'],
  ['Fhat_A', 'Fhat_A'],
  ['F_hat_A', 'Fhat_A'],
  ['Ahatx', 'Ahat_x'],
  ['Ahat_x', 'Ahat_x'],
  ['xddot', 'xddot'],
  ['x_ddot', 'xddot'],
  ['phi_ddot', 'phiddot'],
  ['phiddot', 'phiddot'],
  ['vbar', 'vbar'],
  ['xddot m', 'xddot m'],
  ['phiddot*Theta', 'phiddot Theta'],
];

let failed = 0;
for (const [inp, exp] of cases) {
  const got = cleanupName(inp);
  if (got !== exp) { failed++; console.log(`FAIL cleanupName(${JSON.stringify(inp)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`); }
}
// the cleaned names give the intended labels
const labels = [
  ['xddot m', '\\(\\ddot{x}\\;m\\)'],
  ['phiddot Theta', '\\(\\ddot{\\varphi}\\;\\Theta\\)'],
  ['Ahat_x', '\\(\\hat{A}_{x}\\)'],
  ['omega_S', '\\(\\omega_{S}\\)'],
];
for (const [inp, exp] of labels) {
  const got = toTEX(inp);
  if (got !== exp) { failed++; console.log(`FAIL toTEX(${JSON.stringify(inp)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`); }
}
console.log(`${cases.length + labels.length - failed} of ${cases.length + labels.length} passed`);
process.exit(failed ? 1 : 0);
