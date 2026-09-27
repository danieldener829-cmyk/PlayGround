// Gera páginas estáticas reais em public/s/<slug>.html
// Uso: node scripts/export-static.mjs "<prompt do site>" <slug>
// Essas páginas funcionam em QUALQUER navegador/aparelho, sem depender de localStorage.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// simula plano PRO para exportar sem marca d'água
globalThis.localStorage = { getItem: () => JSON.stringify({ name: 'pro' }), setItem(){}, removeItem(){} };

const { generateSiteData, slugify } = await import('../src/gen.js');
const { exportStandaloneHTML } = await import('../src/renderSite.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const prompt = process.argv[2] || 'Site de restaurante italiano com cardápio e delivery';
const slug = (process.argv[3] || slugify(prompt) || 'meu-site').toLowerCase();
const tplId = process.argv[4] || null;

import { TEMPLATES } from '../src/gen.js';
const tplOverride = tplId ? TEMPLATES.find(t => t.id === tplId) : null;
const data = tplOverride ? generateSiteData(prompt, tplOverride) : generateSiteData(prompt);
const proj = {
  business: data.business, niche: data.niche, prompt,
  theme: { ...data.tpl.colors }, font: data.tpl.font,
  wa: data.wa, sections: data.sections,
  slug, published: true, url: `https://${slug}.sitegenius.com.br`,
};

mkdirSync(join(root, 'public', 's'), { recursive: true });
writeFileSync(join(root, 'public', 's', `${slug}.html`), exportStandaloneHTML(proj));

// atualiza o manifesto usado pelo gateway de subdomínios (<slug>.sitegenius.com.br)
const manPath = join(root, 'public', 's', 'manifest.json');
let man = { sites: [] };
try { if (existsSync(manPath)) man = JSON.parse(readFileSync(manPath, 'utf8')); } catch {}
man.sites = (man.sites || []).filter(s => s.slug !== slug);
man.sites.unshift({ slug, business: proj.business, file: `/s/${slug}.html`, updatedAt: new Date().toISOString() });
writeFileSync(manPath, JSON.stringify(man, null, 2));
console.log(`OK public/s/${slug}.html (${proj.business}, ${proj.sections.length} seções)`);
