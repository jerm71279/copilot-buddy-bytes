#!/usr/bin/env node
import { execSync } from 'child_process';

try {
  const output = execSync('node scripts/validate-all.js', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
  process.exit(0);
} catch (error) {
  console.log(error.stdout || error.stderr || error.message);
  process.exit(error.status || 1);
}
