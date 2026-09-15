import { buildFrontend } from './build/frontend.mjs';
import { buildApiPlaceholder } from './build/api.mjs';

const target = process.argv[2];
if (!target) throw new Error('Build target required: web | telegram | api');

if (target === 'api') {
  const result = await buildApiPlaceholder();
  console.log(`Built ${result.surface} placeholder (P1 evidence only).`);
} else {
  const result = await buildFrontend(target);
  console.log(`Built ${result.surface} with ${result.modules} audited production modules.`);
}
