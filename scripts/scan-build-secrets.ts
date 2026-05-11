import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(import.meta.dir, '..', 'dist');
const maxFileSizeBytes = 5 * 1024 * 1024;

const secretPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Stripe secret key', pattern: /\bsk_(live|test)_[A-Za-z0-9]{12,}\b/g },
  { name: 'Stripe restricted key', pattern: /\brk_(live|test)_[A-Za-z0-9]{12,}\b/g },
  { name: 'Stripe webhook secret', pattern: /\bwhsec_[A-Za-z0-9]{12,}\b/g },
  { name: 'JWT secret variable', pattern: /\bJWT_SECRET\b/g },
  { name: 'Password pepper variable', pattern: /\bPASSWORD_PEPPER\b/g },
  { name: 'Private key block', pattern: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
  { name: 'Postgres URL', pattern: /\bpostgres(?:ql)?:\/\/[^"'\s)]+/g },
  { name: 'Redis URL', pattern: /\bredis:\/\/[^"'\s)]+/g },
  { name: 'SMTP password variable', pattern: /\bSMTP_PASSWORD\b/g },
];

if (!existsSync(distDir)) {
  console.error(`Build output not found: ${distDir}`);
  process.exit(1);
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return listFiles(fullPath);
    if (!stat.isFile() || stat.size > maxFileSizeBytes) return [];
    return [fullPath];
  });
}

const findings = [];
for (const file of listFiles(distDir)) {
  const content = readFileSync(file, 'utf8');
  for (const { name, pattern } of secretPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      findings.push({ file: path.relative(distDir, file), name, count: matches.length });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential secrets found in frontend bundle:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.name} (${finding.count})`);
  }
  process.exit(1);
}

console.log('No backend secrets found in frontend bundle.');
