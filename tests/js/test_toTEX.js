// Test of toTEX() in meclib.js (labels of meclib objects).
// Run from the repo root: node tests/js/test_toTEX.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'meclib.js'), 'utf8');
// extract "function toTEX(str) {...}" by counting braces
const start = src.indexOf('function toTEX(');
if (start < 0) throw new Error('toTEX not found in meclib.js');
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const toTEX = new Function(src.slice(start, end) + '\nreturn toTEX;')();

const cases = [
  // unchanged behaviour
  ['F', '\\(F\\)'],
  ['F_1', '\\(F_{1}\\)'],
  ['F_Ax', '\\(F_{Ax}\\)'],
  ['m*g', '\\(m\\;g\\)'],
  ['a b', '\\(a\\;b\\)'],
  ['', '\\(\\)'],
  // Greek names
  ['alpha', '\\(\\alpha\\)'],
  // no gap after Delta/delta (also as TeX name)
  ['Delta*p', '\\(\\Delta p\\)'],
  ['Delta p', '\\(\\Delta p\\)'],
  ['delta*x', '\\(\\delta x\\)'],
  ['\\Delta p', '\\(\\Delta p\\)'],
  ['Delta*Fhat', '\\(\\Delta \\hat{F}\\)'],
  ['Delta_p', '\\(\\Delta_{p}\\)'],
  ['x_alpha', '\\(x_{\\alpha}\\)'],
  ['omega_S', '\\(\\omega_{S}\\)'],
  ['Pi', '\\(\\Pi\\)'],
  ['alpha*beta', '\\(\\alpha\\;\\beta\\)'],
  ['theta', '\\(\\theta\\)'],
  // as in STACK: phi and epsilon in the variant form
  ['phi', '\\(\\varphi\\)'],
  ['phi_S', '\\(\\varphi_{S}\\)'],
  ['epsilon', '\\(\\varepsilon\\)'],
  ['Phi', '\\(\\Phi\\)'],
  // digits after a Greek name become a subscript (as in STACK)
  ['alpha1', '\\(\\alpha_{1}\\)'],
  ['omega12', '\\(\\omega_{12}\\)'],
  ['F1', '\\(F1\\)'],
  // not Greek names
  ['alphax', '\\(alphax\\)'],
  ['Alphabet', '\\(Alphabet\\)'],
  ['Alpha', '\\(Alpha\\)'],
  ['beta2x', '\\(beta2x\\)'],
  ['meta', '\\(meta\\)'],
  ['\\alpha', '\\(\\alpha\\)'],
  // accents as suffix of a single letter or a Greek name, with or without underscore
  ['Fhat', '\\(\\hat{F}\\)'],
  ['F_hat', '\\(\\hat{F}\\)'],
  ['xdot', '\\(\\dot{x}\\)'],
  ['x_dot', '\\(\\dot{x}\\)'],
  ['xddot', '\\(\\ddot{x}\\)'],
  ['x_ddot', '\\(\\ddot{x}\\)'],
  ['vbar', '\\(\\bar{v}\\)'],
  ['phiddot', '\\(\\ddot{\\varphi}\\)'],
  ['phi_ddot', '\\(\\ddot{\\varphi}\\)'],
  ['Omegadot', '\\(\\dot{\\Omega}\\)'],
  ['Fhat_A', '\\(\\hat{F}_{A}\\)'],
  ['F_hat_A', '\\(\\hat{F}_{A}\\)'],
  ['v_bar_1', '\\(\\bar{v}_{1}\\)'],
  ['x_ddot*m', '\\(\\ddot{x}\\;m\\)'],
  ['phi_ddot*Theta', '\\(\\ddot{\\varphi}\\;\\Theta\\)'],
  // no accent
  ['dot', '\\(dot\\)'],
  ['hat', '\\(hat\\)'],
  ['F_A', '\\(F_{A}\\)'],
  ['Fhat2', '\\(Fhat2\\)'],
  ['xyhat', '\\(xyhat\\)'],
];

let failed = 0;
for (const [inp, exp] of cases) {
  const got = toTEX(inp);
  if (got !== exp) { failed++; console.log(`FAIL toTEX(${JSON.stringify(inp)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(exp)}`); }
}
console.log(`${cases.length - failed} of ${cases.length} passed`);
process.exit(failed ? 1 : 0);
