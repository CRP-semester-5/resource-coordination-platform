import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  '01_status_badge_tokens.test.js',
  '02_request_triage_ui.test.js',
  '03_donation_modal_ui.test.js',
  '04_inventory_3tier_stock_badge.test.js',
  '05_handover_pin_ui_lifecycle.test.js',
  '06_responsive_viewports_audit.test.js'
];

console.log('================================================================================');
console.log(' ResQ Hub — User Interface Testing Suite Runner');
console.log(' Target: React Web Coordinator Dashboard & Flutter Mobile Client UI Components');
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
    console.log(' ✅ ALL USER INTERFACE TESTS PASSED (100% SUCCESS)');
    console.log(' Web Dashboard Triage, 3-Tier Inventory, and Mobile PIN Modal Verified');
  } else {
    console.log(` ❌ USER INTERFACE TESTS FAILED WITH EXIT CODE ${code}`);
  }
  console.log('================================================================================\n');
  process.exit(code);
});
