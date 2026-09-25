/**
 * ResQ Hub — Master Database Integrity Test Runner (Section 3.1.1)
 * Purpose: Executes all database integrity test suites and generates executive summary metrics.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  '01_schema_constraints.test.js',
  '02_unique_constraints.test.js',
  '03_foreign_keys.test.js',
  '04_triggers_procedures.test.js',
  '05_inventory_ledger.test.js',
  '06_rls_security.test.js',
  '07_orphan_records_audit.test.js'
];

console.log('================================================================================');
console.log(' ResQ Hub — Section 3.1.1 Data & Database Integrity Test Suite Runner');
console.log(' Testing against Supabase PostgreSQL Persistence Tier');
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
    console.log(' ✅ ALL DATABASE INTEGRITY TESTS PASSED (100% SUCCESS)');
    console.log(' Status: Approved for Iteration Release / RUP Section 3.1.1 Verified');
  } else {
    console.log(` ❌ DATABASE INTEGRITY TESTS FAILED WITH EXIT CODE ${code}`);
  }
  console.log('================================================================================\n');
  process.exit(code);
});
