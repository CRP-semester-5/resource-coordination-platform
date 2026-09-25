/**
 * ResQ Hub — Master Functional Test Runner (Section 3.1.2)
 * Purpose: Executes all functional end-to-end test suites (Flow A, Flow B, Flow C, RBAC, State Machines).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  '01_flow_a_request_lifecycle.test.js',
  '02_flow_b_donation_lifecycle.test.js',
  '03_flow_c_stock_sufficiency.test.js',
  '04_use_case_state_machines.test.js',
  '05_auth_rbac_boundaries.test.js'
];

console.log('================================================================================');
console.log(' ResQ Hub — Function Testing Suite Runner');
console.log(' Target: Microservice Business Logic, Use-Case Flows & Handover PIN Verification');
console.log('================================================================================\n');

const testPaths = testFiles.map((file) => path.resolve(__dirname, file));

const child = spawn(
  process.execPath,
  ['--test', ...testPaths],
  {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  }
);

child.on('exit', (code) => {
  console.log('\n================================================================================');
  if (code === 0) {
    console.log(' ✅ ALL FUNCTIONAL USE-CASE TESTS PASSED (100% SUCCESS)');
    console.log(' Citizen Help Request Lifecycle, Donation Lifecycle, Stock Sufficiency Rules and Handover PIN Protocol Verified');
  } else {
    console.log(` ❌ FUNCTIONAL TESTS FAILED WITH EXIT CODE ${code}`);
  }
  console.log('================================================================================\n');
  process.exit(code);
});
