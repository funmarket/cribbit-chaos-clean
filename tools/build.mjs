import { buildFrontend } from './build/frontend.mjs';
import { buildApi } from './build/api.mjs';

const target = process.argv[2];
if (!target) throw new Error('Build target required: web | telegram | api');

if (target === 'api') {
  const result = await buildApi();
  console.log(`Built ${result.surface} with ${result.modules} audited production modules.`);
} else {
  const result = await buildFrontend(target);
  console.log(`Built ${result.surface} with ${result.modules} audited production modules.`);
}
