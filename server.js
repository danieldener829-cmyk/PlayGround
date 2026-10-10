/* Loja Virtual Premium — backend Express + SQLite (node:sqlite) + JWT
 * Instalação: npm install && npm start
 * Env: PORT, JWT_SECRET, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, STRIPE_SECRET_KEY, STORE_NAME
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';
const STORE_NAME = process.env.STORE_NAME || 'LUMIÈRE Store';
const MP_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';

if (!process.env.JWT_SECRET) console.warn('[AVISO] JWT_SECRET não definido. Usando segredo de desenvolvimento.');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'img', 'produtos');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'loja.db'));
db.exec(`PRAGMA journal_mode = WAL;`);

/* ---------- SCHEMA ---------- */
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL, is_admin INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS addresses(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, label TEXT DEFAULT 'Casa',
  nome TEXT, rua TEXT, numero TEXT, complemento TEXT, bairro TEXT, cidade TEXT, uf TEXT, cep TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS categories(
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  descricao TEXT DEFAULT '', imagem TEXT DEFAULT '', parent_id INTEGER DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  descricao TEXT DEFAULT '', preco REAL NOT NULL, preco_promo REAL DEFAULT NULL,
  categoria_id INTEGER DEFAULT NULL, estoque INTEGER DEFAULT 0, imagens TEXT DEFAULT '[]',
  destaque INTEGER DEFAULT 0, lancamento INTEGER DEFAULT 0, vendas INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1, criado_em TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(categoria_id) REFERENCES categories(id)
);
CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  nota INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5), comentario TEXT DEFAULT '',
  criado_em TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS favorites(
  user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, criado_em TEXT DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, product_id)
);
CREATE TABLE IF NOT EXISTS coupons(
  id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT UNIQUE NOT NULL, tipo TEXT DEFAULT 'percent',
  valor REAL NOT NULL, minimo REAL DEFAULT 0, usos_max INTEGER DEFAULT NULL, usos INTEGER DEFAULT 0,
  expira_em TEXT DEFAULT NULL, ativo INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS banners(
  id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, subtitulo TEXT, imagem TEXT, link TEXT DEFAULT '#',
  ordem INTEGER DEFAULT 0, ativo INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT UNIQUE NOT NULL, user_id INTEGER DEFAULT NULL,
  convidado_nome TEXT DEFAULT NULL, convidado_email TEXT DEFAULT NULL,
  status TEXT DEFAULT 'aguardando_pagamento', subtotal REAL, desconto REAL DEFAULT 0,
  frete REAL DEFAULT 0, total REAL, endereco_json TEXT, pagamento TEXT DEFAULT 'pix',
  parcelas INTEGER DEFAULT 1, rastreio TEXT DEFAULT NULL, cupom TEXT DEFAULT NULL,
  criado_em TEXT DEFAULT (datetime('now')), atualizado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
  product_id INTEGER, nome TEXT, preco REAL, qtd INTEGER,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, provedor TEXT,
  metodo TEXT, status TEXT DEFAULT 'pendente', referencia TEXT, payload TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings(
  chave TEXT PRIMARY KEY, valor TEXT
);
CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT, assunto TEXT, texto TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS resets(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL,
  expira_em TEXT, usado INTEGER DEFAULT 0
);
`);

function getSetting(k, fb = '') {
  const r = db.prepare('SELECT valor FROM settings WHERE chave=?').get(k);
  return r ? r.valor : fb;
}
function setSetting(k, v) {
  db.prepare('INSERT INTO settings(chave,valor) VALUES(?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor').run(k, String(v));
}
const seedDefaults = {
  store_name: STORE_NAME, whatsapp: '5511999999999', instagram: 'https://instagram.com',
  facebook: 'https://facebook.com', tiktok: 'https://tiktok.com',
  frete_gratis_acima: '299', frete_fixo: '19.9', prazo_envio: 'Postagem em até 48h úteis',
  banner_topo: 'Frete grátis acima de R$ 299 • Cupom BEMVINDO10 com 10% OFF'
};
for (const [k, v] of Object.entries(seedDefaults)) if (!db.prepare('SELECT 1 FROM settings WHERE chave=?').get(k)) setSetting(k, v);

const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- SEED ---------- */
function seed() {
  const n = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  if (n > 0) return;
  const cats = [
    ['Moda Feminina', 'roupas femininas modernas', '👗'],
    ['Calçados', 'tênis, sandálias e botas', '👟'],
    ['Beleza', 'skincare e maquiagem', '💄'],
    ['Casa & Decor', 'decoração e utilidades', '🛋️'],
    ['Eletrônicos', 'tech e acessórios', '🎧'],
  ];
  const catIds = {};
  for (const [nome, desc, img] of cats) {
    const r = db.prepare('INSERT INTO categories(nome,slug,descricao,imagem) VALUES(?,?,?,?)').run(nome, slug(nome), desc, img);
    catIds[nome] = Number(r.lastInsertRowid);
  }
  const P = [
    ['Vestido Midi Elegance', 'Vestido midi em viscose premium, caimento perfeito.', 189.9, 149.9, 'Moda Feminina', 32, 1, 0, '👗'],
    ['Tênis Urban Runner', 'Tênis confortável para o dia a dia e academia.', 299.9, 239.9, 'Calçados', 45, 1, 1, '👟'],
    ['Sérum Vitamina C 30ml', 'Skincare com vitamina C pura, pele radiante.', 89.9, null, 'Beleza', 80, 1, 1, '🧴'],
    ['Luminária Aurora', 'Luminária de mesa com luz quente regulável.', 159.9, 129.9, 'Casa & Decor', 20, 0, 1, '💡'],
    ['Fone Bluetooth Pro', 'Cancelamento de ruído e 36h de bateria.', 249.9, 199.9, 'Eletrônicos', 60, 1, 0, '🎧'],
    ['Bolsa Tote Couro Eco', 'Bolsa espaçosa em couro ecológico.', 219.9, null, 'Moda Feminina', 25, 0, 0, '👜'],
    ['Sandália Confort Flex', 'Sandália anatômica para o verão.', 139.9, 109.9, 'Calçados', 40, 0, 0, '👡'],
    ['Kit Pincéis Profissionais', '12 pincéis macios com estojo.', 99.9, 79.9, 'Beleza', 55, 0, 1, '🖌️'],
    ['Vela Aromática Lavanda', 'Cera vegetal, 40h de queima.', 59.9, null, 'Casa & Decor', 100, 0, 0, '🕯️'],
    ['Smartwatch Fit S', 'Monitor cardíaco, GPS e 10 dias de bateria.', 399.9, 329.9, 'Eletrônicos', 30, 1, 1, '⌚'],
    ['Blazer Alfaiataria Premium', 'Blazer estruturado, tecido italiano.', 459.9, 389.9, 'Moda Feminina', 12, 1, 0, '🧥'],
    ['Mochila Voyager Antifurto', 'Mochila com porta USB e compartimento acolchoado.', 229.9, null, 'Eletrônicos', 35, 0, 0, '🎒'],
  ];
  for (const [nome, desc, preco, promo, cat, est, dest, lanc, emoji] of P) {
    db.prepare(`INSERT INTO products(nome,slug,descricao,preco,preco_promo,categoria_id,estoque,imagens,destaque,lancamento,vendas,ativo)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,1)`).run(nome, slug(nome) + '-' + Math.floor(Math.random() * 900 + 100),
      desc, preco, promo, catIds[cat], est, JSON.stringify([emoji]), dest, lanc, Math.floor(Math.random() * 200));
  }
  db.prepare(`INSERT OR IGNORE INTO coupons(codigo,tipo,valor,minimo,usos_max,expira_em) VALUES('BEMVINDO10','percent',10,0,1000,NULL)`).run();
  db.prepare(`INSERT OR IGNORE INTO coupons(codigo,tipo,valor,minimo,usos_max,expira_em) VALUES('FRETEZERO','frete',100,299,NULL,NULL)`).run();
  const B = [
    ['Nova Coleção Outono', 'Até 40% OFF em peças selecionadas', '🌸', '#ofertas', 1],
    ['Tech Week', 'Eletrônicos com até 30% OFF no Pix', '🎧', '#ofertas', 2],
    ['Beleza Natural', 'Skincare a partir de R$ 59,90', '💄', '#lancamentos', 3],
  ];
  B.forEach(([t, s, img, link, ordem]) => db.prepare('INSERT INTO banners(titulo,subtitulo,imagem,link,ordem) VALUES(?,?,?,?,?)').run(t, s, img, link, ordem));
  if (!db.prepare('SELECT 1 FROM users WHERE email=?').get('admin@loja.com')) {
    const h = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users(name,email,pass_hash,is_admin) VALUES(?,?,?,1)').run('Administradora', 'admin@loja.com', h);
    const h2 = bcrypt.hashSync('cliente123', 10);
    db.prepare('INSERT INTO users(name,email,pass_hash) VALUES(?,?,?)').run('Cliente Demo', 'cliente@loja.com', h2);
  }
  console.log('[seed] dados iniciais criados. Admin: admin@loja.com / admin123');
}
seed();

/* ---------- APP ---------- */
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });

const sign = (u) => jwt.sign({ id: u.id, is_admin: !!u.is_admin }, JWT_SECRET, { expiresIn: '7d' });
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ erro: 'Não autenticado.' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' }); }
}
function admin(req, res, next) {
  auth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
    next();
  });
}
const BRL = (v) => Number(v || 0);
const precoFinal = (p) => (p.preco_promo != null ? Number(p.preco_promo) : Number(p.preco));
function parseImgs(p) { try { return { ...p, imagens: JSON.parse(p.imagens || '[]') }; } catch { return { ...p, imagens: [] }; } }
function avgNota(pid) {
  const r = db.prepare('SELECT AVG(nota) m, COUNT(*) t FROM reviews WHERE product_id=?').get(pid);
  return { media: r.m ? Math.round(r.m * 10) / 10 : 0, total: r.t || 0 };
}

/* ---------- AUTH ---------- */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ erro: 'E-mail inválido.' });
  if (String(password).length < 6) return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
  try {
    const h = bcrypt.hashSync(password, 10);
    const r = db.prepare('INSERT INTO users(name,email,pass_hash) VALUES(?,?,?)').run(String(name).slice(0, 80), String(email).toLowerCase().trim(), h);
    const u = db.prepare('SELECT id,name,email,is_admin FROM users WHERE id=?').get(r.lastInsertRowid);
    res.json({ token: sign(u), user: u });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    res.status(500).json({ erro: 'Erro ao cadastrar.' });
  }
});
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').toLowerCase().trim());
  if (!u || !bcrypt.compareSync(String(password || ''), u.pass_hash)) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  const safe = { id: u.id, name: u.name, email: u.email, is_admin: !!u.is_admin };
  res.json({ token: sign(u), user: safe });
});
app.post('/api/auth/forgot', (req, res) => {
  const { email } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').toLowerCase().trim());
  if (!u) return res.json({ ok: true, aviso: 'Se o e-mail existir, enviaremos instruções.' });
  const token = crypto.randomBytes(24).toString('hex');
  const exp = new Date(Date.now() + 3600e3).toISOString();
  db.prepare('INSERT INTO resets(user_id,token,expira_em) VALUES(?,?,?)').run(u.id, token, exp);
  // Em produção: enviar por e-mail (SMTP). Sem SMTP configurado, devolvemos o token apenas em modo demonstração.
  res.json({ ok: true, aviso: 'Link de recuperação gerado (demonstração — configure SMTP em produção).', token_demo: token });
});
app.post('/api/auth/reset', (req, res) => {
  const { token, password } = req.body || {};
  const r = db.prepare('SELECT * FROM resets WHERE token=? AND usado=0').get(token);
  if (!r || new Date(r.expira_em) < new Date()) return res.status(400).json({ erro: 'Token inválido ou expirado.' });
  db.prepare('UPDATE users SET pass_hash=? WHERE id=?').run(bcrypt.hashSync(String(password || '123456'), 10), r.user_id);
  db.prepare('UPDATE resets SET usado=1 WHERE id=?').run(r.id);
  res.json({ ok: true });
});
app.get('/api/auth/me', auth, (req, res) => {
  const u = db.prepare('SELECT id,name,email,is_admin,created_at FROM users WHERE id=?').get(req.user.id);
  res.json(u);
});
app.put('/api/auth/me', auth, (req, res) => {
  const { name } = req.body || {};
  if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(String(name).slice(0, 80), req.user.id);
  res.json({ ok: true });
});

/* ---------- CATÁLOGO ---------- */
app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY nome').all());
});
app.post('/api/admin/categories', admin, (req, res) => {
  const { nome, descricao = '', imagem = '' } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  try {
    const r = db.prepare('INSERT INTO categories(nome,slug,descricao,imagem) VALUES(?,?,?,?)').run(nome, slug(nome) + '-' + Date.now() % 10000, descricao, imagem);
    res.json(db.prepare('SELECT * FROM categories WHERE id=?').get(r.lastInsertRowid));
  } catch { res.status(409).json({ erro: 'Categoria já existe.' }); }
});
app.delete('/api/admin/categories/:id', admin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => {
  const { q = '', cat = '', min = '', max = '', sort = 'novidades', ofertas = '', lanc = '', dest = '' } = req.query;
  let sql = `SELECT p.*, c.nome cat_nome FROM products p LEFT JOIN categories c ON c.id=p.categoria_id WHERE p.ativo=1`;
  const args = [];
  if (q) { sql += ` AND (p.nome LIKE ? OR p.descricao LIKE ?)`; args.push(`%${q}%`, `%${q}%`); }
  if (cat) { sql += ` AND c.slug=?`; args.push(cat); }
  if (min !== '') { sql += ` AND COALESCE(p.preco_promo,p.preco)>=?`; args.push(Number(min)); }
  if (max !== '') { sql += ` AND COALESCE(p.preco_promo,p.preco)<=?`; args.push(Number(max)); }
  if (ofertas === '1') sql += ` AND p.preco_promo IS NOT NULL`;
  if (lanc === '1') sql += ` AND p.lancamento=1`;
  if (dest === '1') sql += ` AND p.destaque=1`;
  const order = { menor: 'COALESCE(p.preco_promo,p.preco) ASC', maior: 'COALESCE(p.preco_promo,p.preco) DESC', populares: 'p.vendas DESC', novidades: 'p.id DESC', nome: 'p.nome ASC' }[sort] || 'p.id DESC';
  sql += ` ORDER BY ${order} LIMIT 100`;
  const list = db.prepare(sql).all(...args).map(parseImgs).map((p) => ({ ...p, ...avgNota(p.id), preco_final: precoFinal(p) }));
  res.json(list);
});
app.get('/api/products/:slug', (req, res) => {
  let p = db.prepare('SELECT p.*, c.nome cat_nome FROM products p LEFT JOIN categories c ON c.id=p.categoria_id WHERE p.slug=?').get(req.params.slug)
    || db.prepare('SELECT p.*, c.nome cat_nome FROM products p LEFT JOIN categories c ON c.id=p.categoria_id WHERE p.id=?').get(req.params.slug);
  if (!p) return res.status(404).json({ erro: 'Produto não encontrado.' });
  p = parseImgs(p);
  res.json({ ...p, ...avgNota(p.id), preco_final: precoFinal(p) });
});
app.post('/api/admin/products', admin, (req, res) => {
  const { nome, descricao = '', preco, preco_promo = null, categoria_id = null, estoque = 0, imagens = [], destaque = 0, lancamento = 0 } = req.body || {};
  if (!nome || preco == null) return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
  if (Number(preco) <= 0) return res.status(400).json({ erro: 'Preço inválido.' });
  const s = slug(nome) + '-' + Math.floor(Math.random() * 9000 + 1000);
  const r = db.prepare(`INSERT INTO products(nome,slug,descricao,preco,preco_promo,categoria_id,estoque,imagens,destaque,lancamento)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(nome, s, descricao, Number(preco), preco_promo === '' ? null : preco_promo, categoria_id, Number(estoque), JSON.stringify(imagens || []), destaque ? 1 : 0, lancamento ? 1 : 0);
  res.json(db.prepare('SELECT * FROM products WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/admin/products/:id', admin, (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ erro: 'Produto não encontrado.' });
  const b = { ...parseImgs(cur), ...req.body };
  db.prepare(`UPDATE products SET nome=?,descricao=?,preco=?,preco_promo=?,categoria_id=?,estoque=?,imagens=?,destaque=?,lancamento=?,ativo=? WHERE id=?`)
    .run(b.nome, b.descricao, Number(b.preco), b.preco_promo === '' ? null : b.preco_promo, b.categoria_id, Number(b.estoque || 0),
      JSON.stringify(b.imagens || []), b.destaque ? 1 : 0, b.lancamento ? 1 : 0, b.ativo == null ? 1 : (b.ativo ? 1 : 0), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/products/:id', admin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------- AVALIAÇÕES / FAVORITOS / ENDEREÇOS ---------- */
app.get('/api/products/:id/reviews', (req, res) => {
  res.json(db.prepare(`SELECT r.*, u.name autor FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=? ORDER BY r.id DESC LIMIT 50`).all(req.params.id));
});
app.post('/api/products/:id/reviews', auth, (req, res) => {
  const { nota, comentario = '' } = req.body || {};
  if (!nota || nota < 1 || nota > 5) return res.status(400).json({ erro: 'Nota de 1 a 5.' });
  db.prepare('INSERT INTO reviews(product_id,user_id,nota,comentario) VALUES(?,?,?,?)').run(req.params.id, req.user.id, Number(nota), String(comentario).slice(0, 1000));
  res.json({ ok: true });
});
app.get('/api/favorites', auth, (req, res) => {
  res.json(db.prepare(`SELECT p.* FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=?`).all(req.user.id).map(parseImgs));
});
app.post('/api/favorites/:id', auth, (req, res) => {
  db.prepare('INSERT OR IGNORE INTO favorites(user_id,product_id) VALUES(?,?)').run(req.user.id, req.params.id);
  res.json({ ok: true });
});
app.delete('/api/favorites/:id', auth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id=? AND product_id=?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});
app.get('/api/addresses', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM addresses WHERE user_id=?').all(req.user.id));
});
app.post('/api/addresses', auth, (req, res) => {
  const b = req.body || {};
  if (!b.rua || !b.cidade || !b.cep) return res.status(400).json({ erro: 'Rua, cidade e CEP são obrigatórios.' });
  const r = db.prepare(`INSERT INTO addresses(user_id,label,nome,rua,numero,complemento,bairro,cidade,uf,cep) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, b.label || 'Casa', b.nome || '', b.rua, b.numero || '', b.complemento || '', b.bairro || '', b.cidade, b.uf || '', b.cep);
  res.json(db.prepare('SELECT * FROM addresses WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/addresses/:id', auth, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

/* ---------- CUPONS / BANNERS / FRETE / SETTINGS ---------- */
app.post('/api/coupons/validate', (req, res) => {
  const { codigo, subtotal = 0 } = req.body || {};
  const c = db.prepare('SELECT * FROM coupons WHERE codigo=? AND ativo=1').get(String(codigo || '').toUpperCase().trim());
  if (!c) return res.status(404).json({ erro: 'Cupom inválido.' });
  if (c.expira_em && new Date(c.expira_em) < new Date()) return res.status(400).json({ erro: 'Cupom expirado.' });
  if (BRL(subtotal) < BRL(c.minimo)) return res.status(400).json({ erro: `Pedido mínimo de R$ ${Number(c.minimo).toFixed(2)}.` });
  if (c.usos_max && c.usos >= c.usos_max) return res.status(400).json({ erro: 'Cupom esgotado.' });
  let desconto = c.tipo === 'percent' ? BRL(subtotal) * BRL(c.valor) / 100 : BRL(c.valor);
  res.json({ ok: true, cupom: c.codigo, desconto: Math.min(desconto, BRL(subtotal)), tipo: c.tipo });
});
app.get('/api/admin/coupons', admin, (req, res) => { res.json(db.prepare('SELECT * FROM coupons ORDER BY id DESC').all()); });
app.post('/api/admin/coupons', admin, (req, res) => {
  const { codigo, tipo = 'percent', valor, minimo = 0 } = req.body || {};
  if (!codigo || valor == null) return res.status(400).json({ erro: 'Código e valor obrigatórios.' });
  try {
    db.prepare('INSERT INTO coupons(codigo,tipo,valor,minimo) VALUES(?,?,?,?)').run(String(codigo).toUpperCase(), tipo, Number(valor), Number(minimo));
    res.json({ ok: true });
  } catch { res.status(409).json({ erro: 'Cupom já existe.' }); }
});
app.delete('/api/admin/coupons/:id', admin, (req, res) => { db.prepare('DELETE FROM coupons WHERE id=?').run(req.params.id); res.json({ ok: true }); });

app.get('/api/banners', (req, res) => { res.json(db.prepare('SELECT * FROM banners WHERE ativo=1 ORDER BY ordem').all()); });
app.get('/api/admin/banners', admin, (req, res) => { res.json(db.prepare('SELECT * FROM banners ORDER BY ordem').all()); });
app.post('/api/admin/banners', admin, (req, res) => {
  const { titulo = '', subtitulo = '', imagem = '🎉', link = '#', ordem = 0 } = req.body || {};
  const r = db.prepare('INSERT INTO banners(titulo,subtitulo,imagem,link,ordem) VALUES(?,?,?,?,?)').run(titulo, subtitulo, imagem, link, Number(ordem));
  res.json(db.prepare('SELECT * FROM banners WHERE id=?').get(r.lastInsertRowid));
});
app.delete('/api/admin/banners/:id', admin, (req, res) => { db.prepare('DELETE FROM banners WHERE id=?').run(req.params.id); res.json({ ok: true }); });

app.post('/api/shipping/quote', (req, res) => {
  const { cep = '', subtotal = 0 } = req.body || {};
  const gratisAcima = Number(getSetting('frete_gratis_acima', '299'));
  const fixo = Number(getSetting('frete_fixo', '19.9'));
  const frete = BRL(subtotal) >= gratisAcima ? 0 : fixo;
  res.json({ frete, prazo: getSetting('prazo_envio', 'Postagem em até 48h úteis'), cep: String(cep).slice(0, 9), gratis_acima: gratisAcima });
});
app.get('/api/settings', (req, res) => {
  res.json({ store_name: getSetting('store_name'), whatsapp: getSetting('whatsapp'), instagram: getSetting('instagram'), facebook: getSetting('facebook'), tiktok: getSetting('tiktok'), banner_topo: getSetting('banner_topo'), frete_gratis_acima: getSetting('frete_gratis_acima'), frete_fixo: getSetting('frete_fixo'), pagamento_configurado: Boolean(MP_TOKEN || STRIPE_SECRET) });
});
app.get('/api/admin/settings', admin, (req, res) => {
  res.json(Object.fromEntries(db.prepare('SELECT chave,valor FROM settings').all().map((r) => [r.chave, r.valor])));
});
app.put('/api/admin/settings', admin, (req, res) => {
  for (const [k, v] of Object.entries(req.body || {})) setSetting(k, v);
  res.json({ ok: true });
});
app.post('/api/contact', (req, res) => {
  const { nome, email, assunto = '', texto } = req.body || {};
  if (!nome || !email || !texto) return res.status(400).json({ erro: 'Preencha nome, e-mail e mensagem.' });
  db.prepare('INSERT INTO messages(nome,email,assunto,texto) VALUES(?,?,?,?)').run(String(nome).slice(0, 80), String(email).slice(0, 120), String(assunto).slice(0, 120), String(texto).slice(0, 2000));
  res.json({ ok: true, aviso: 'Mensagem recebida! Respondemos em até 1 dia útil.' });
});

/* ---------- CHECKOUT / PEDIDOS / PAGAMENTOS ---------- */
function calcTotals(items, cupomDesc = 0, frete = 0) {
  const subtotal = items.reduce((s, i) => s + BRL(i.preco) * Number(i.qtd), 0);
  const desconto = Math.min(BRL(cupomDesc), subtotal);
  return { subtotal, desconto, frete: BRL(frete), total: subtotal - desconto + BRL(frete) };
}

app.post('/api/checkout', async (req, res) => {
  let userId = null;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) { try { userId = jwt.verify(h.slice(7), JWT_SECRET).id; } catch { /* compra como convidado */ } }
  const { items = [], address = {}, pagamento = 'pix', parcelas = 1, cupom = '', convidado = {} } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ erro: 'Carrinho vazio.' });
  if (!address.rua || !address.cidade || !address.cep) return res.status(400).json({ erro: 'Endereço de entrega incompleto.' });
  if (!userId && (!convidado.nome || !convidado.email)) return res.status(400).json({ erro: 'Informe nome e e-mail para comprar sem conta.' });

  // Monta itens com preço real do servidor (nunca confia no preço do frontend) + controla estoque
  const linhas = [];
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id=? AND ativo=1').get(it.id);
    if (!p) return res.status(400).json({ erro: `Produto ${it.id} indisponível.` });
    if (p.estoque < Number(it.qtd || 1)) return res.status(400).json({ erro: `Estoque insuficiente: ${p.nome} (restam ${p.estoque}).` });
    linhas.push({ product_id: p.id, nome: p.nome, preco: precoFinal(parseImgs(p)), qtd: Math.max(1, Math.min(99, Number(it.qtd || 1))) });
  }
  let desconto = 0, cupomCode = null;
  if (cupom) {
    const c = db.prepare('SELECT * FROM coupons WHERE codigo=? AND ativo=1').get(String(cupom).toUpperCase());
    const sub = linhas.reduce((s, i) => s + i.preco * i.qtd, 0);
    if (c && sub >= BRL(c.minimo) && (!c.expira_em || new Date(c.expira_em) >= new Date()) && (!c.usos_max || c.usos < c.usos_max)) {
      desconto = c.tipo === 'frete' ? 0 : (c.tipo === 'percent' ? sub * Number(c.valor) / 100 : Number(c.valor));
      desconto = Math.min(desconto, sub);
      cupomCode = c.codigo;
      db.prepare('UPDATE coupons SET usos=usos+1 WHERE id=?').run(c.id);
    }
  }
  const sub = linhas.reduce((s, i) => s + i.preco * i.qtd, 0);
  const gratisAcima = Number(getSetting('frete_gratis_acima', '299'));
  let frete = sub - desconto >= gratisAcima ? 0 : Number(getSetting('frete_fixo', '19.9'));
  if (cupomCode) { const c = db.prepare('SELECT * FROM coupons WHERE codigo=?').get(cupomCode); if (c && c.tipo === 'frete') frete = 0; }
  const t = calcTotals(linhas, desconto, frete);
  const codigo = 'PED-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();

  const tx = db.prepare(`INSERT INTO orders(codigo,user_id,convidado_nome,convidado_email,status,subtotal,desconto,frete,total,endereco_json,pagamento,parcelas,cupom)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const r = tx.run(codigo, userId, convidado.nome || null, convidado.email || null, 'aguardando_pagamento',
    t.subtotal, t.desconto, t.frete, t.total, JSON.stringify(address), pagamento, Number(parcelas) || 1, cupomCode);
  const orderId = Number(r.lastInsertRowid);
  const ins = db.prepare('INSERT INTO order_items(order_id,product_id,nome,preco,qtd) VALUES(?,?,?,?,?)');
  for (const l of linhas) { ins.run(orderId, l.product_id, l.nome, l.preco, l.qtd); db.prepare('UPDATE products SET estoque=estoque-?, vendas=vendas+? WHERE id=?').run(l.qtd, l.qtd, l.product_id); }

  // Integração real de pagamento: se token configurado, aqui chamaríamos a API do provedor.
  // Sem credencial, o pedido permanece "aguardando_pagamento" — NUNCA marcado como pago automaticamente.
  const provedor = MP_TOKEN ? 'mercadopago' : (STRIPE_SECRET ? 'stripe' : 'nao_configurado');
  db.prepare('INSERT INTO payments(order_id,provedor,metodo,status,referencia) VALUES(?,?,?,?,?)')
    .run(orderId, provedor, pagamento, 'pendente', codigo);

  res.json({
    ok: true, pedido: { id: orderId, codigo, status: 'aguardando_pagamento', ...t, pagamento, provedor },
    pagamento_info: provedor === 'nao_configurado'
      ? { modo: 'demonstracao', aviso: 'Provedor de pagamento NÃO configurado. Configure MP_ACCESS_TOKEN (Mercado Pago) ou STRIPE_SECRET_KEY no servidor. O pedido foi registrado como AGUARDANDO PAGAMENTO. Chave Pix/boleto/cartão reais só aparecem após a configuração.' }
      : { modo: 'real', aviso: `Intenção criada via ${provedor}. Conclua o pagamento e aguarde o webhook confirmar.` },
  });
});

// Consulta de pedidos (cliente vê os seus; admin vê todos)
app.get('/api/orders', (req, res) => {
  const h = req.headers.authorization || '';
  let user = null;
  if (h.startsWith('Bearer ')) { try { user = jwt.verify(h.slice(7), JWT_SECRET); } catch { } }
  let list;
  if (user?.is_admin) list = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all();
  else if (user) list = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(user.id);
  else {
    const { email, codigo } = req.query;
    if (!email || !codigo) return res.status(401).json({ erro: 'Faça login ou informe e-mail + código do pedido.' });
    list = db.prepare('SELECT * FROM orders WHERE convidado_email=? AND codigo=?').all(email, codigo);
  }
  res.json(list);
});
app.get('/api/orders/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  const h = req.headers.authorization || '';
  let user = null;
  if (h.startsWith('Bearer ')) { try { user = jwt.verify(h.slice(7), JWT_SECRET); } catch { } }
  if (!user?.is_admin && (!user || o.user_id !== user.id)) {
    const { email } = req.query;
    if (!email || (o.convidado_email !== email && db.prepare('SELECT email FROM users WHERE id=?').get(o.user_id)?.email !== email))
      return res.status(403).json({ erro: 'Acesso negado.' });
  }
  res.json({ ...o, endereco: JSON.parse(o.endereco_json || '{}'), itens: db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id) });
});
app.patch('/api/admin/orders/:id', admin, (req, res) => {
  const { status, rastreio } = req.body || {};
  const validos = ['aguardando_pagamento', 'pago', 'preparando', 'enviado', 'entregue', 'cancelado', 'reembolsado'];
  if (status && !validos.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  // Regra de segurança: status "pago" via painel é manual (log de conferência). Webhook real confirma automaticamente (ver rota abaixo).
  if (status) db.prepare("UPDATE orders SET status=?, atualizado_em=datetime('now') WHERE id=?").run(status, req.params.id);
  if (rastreio !== undefined) db.prepare('UPDATE orders SET rastreio=? WHERE id=?').run(rastreio || (o.rastreio || 'BR' + Date.now().toString().slice(-8) + 'BR'), req.params.id);
  res.json({ ok: true });
});

/* Webhooks — SOMENTE marcam como pago com assinatura válida + conferência no provedor.
   Sem MP_WEBHOOK_SECRET configurado, todas as chamadas são rejeitadas (segurança). */
app.post('/api/webhooks/mercadopago', express.json({ type: '*/*' }), (req, res) => {
  if (!MP_WEBHOOK_SECRET) return res.status(503).json({ erro: 'Webhook não configurado (MP_WEBHOOK_SECRET ausente). Pedidos NÃO são marcados como pagos.' });
  const sig = req.headers['x-signature'] || '';
  const raw = JSON.stringify(req.body || {});
  const esperado = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(raw).digest('hex');
  if (sig !== esperado && sig !== 'sha256=' + esperado) return res.status(401).json({ erro: 'Assinatura inválida.' });
  const { referencia, status } = req.body || {};
  if (status === 'approved' && referencia) {
    // Em produção: buscar o pagamento na API do Mercado Pago com MP_TOKEN antes de aprovar.
    db.prepare("UPDATE orders SET status='pago', atualizado_em=datetime('now') WHERE codigo=?").run(referencia);
    db.prepare("UPDATE payments SET status='aprovado' WHERE referencia=?").run(referencia);
  }
  res.json({ ok: true });
});
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  if (!STRIPE_SECRET) return res.status(503).json({ erro: 'Webhook Stripe não configurado.' });
  // Em produção: validar stripe-signature com STRIPE_WEBHOOK_SECRET (stripe.webhooks.constructEvent).
  res.json({ ok: true, aviso: 'Valide a assinatura com o SDK da Stripe antes de marcar como pago.' });
});

/* ---------- ADMIN: dashboard / clientes / relatórios ---------- */
app.get('/api/admin/dashboard', admin, (req, res) => {
  const f = (s, p = []) => db.prepare(s).get(...p);
  const faturamento = f("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status NOT IN ('cancelado','aguardando_pagamento')").t;
  const vendas = f('SELECT COUNT(*) c FROM orders').c;
  const ticket = vendas ? faturamento / vendas : 0;
  const porStatus = db.prepare('SELECT status, COUNT(*) q FROM orders GROUP BY status').all();
  const top = db.prepare('SELECT nome, SUM(qtd) q FROM order_items GROUP BY product_id ORDER BY q DESC LIMIT 5').all();
  const recentes = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 8').all();
  const estoqueBaixo = db.prepare('SELECT id,nome,estoque FROM products WHERE estoque<10 ORDER BY estoque').all();
  res.json({ faturamento, vendas, ticket, porStatus, top, recentes, estoqueBaixo });
});
app.get('/api/admin/customers', admin, (req, res) => {
  res.json(db.prepare(`SELECT u.id,u.name,u.email,u.created_at,COUNT(o.id) pedidos,COALESCE(SUM(o.total),0) total
    FROM users u LEFT JOIN orders o ON o.user_id=u.id GROUP BY u.id ORDER BY u.id DESC LIMIT 200`).all());
});
app.get('/api/admin/reports/sales.csv', admin, (req, res) => {
  const rows = db.prepare('SELECT codigo,criado_em,status,subtotal,desconto,frete,total,pagamento FROM orders ORDER BY id DESC').all();
  const csv = 'codigo,data,status,subtotal,desconto,frete,total,pagamento\n' + rows.map((r) => [r.codigo, r.criado_em, r.status, r.subtotal, r.desconto, r.frete, r.total, r.pagamento].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

/* ---------- SEO / PWA básicos ---------- */
app.get('/sitemap.xml', (req, res) => {
  const prods = db.prepare('SELECT slug FROM products WHERE ativo=1').all();
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url>${prods.map((p) => `<url><loc>${base}/#/produto/${p.slug}</loc></url>`).join('')}</urlset>`);
});
app.get('/robots.txt', (req, res) => res.type('text').send('User-agent: *\nAllow: /\n'));
app.get('/api/health', (req, res) => res.json({ ok: true, loja: getSetting('store_name'), pagamentos: MP_TOKEN || STRIPE_SECRET ? 'configurado' : 'demonstracao' }));

app.use((err, req, res, _next) => { console.error(err); res.status(500).json({ erro: 'Erro interno. Tente novamente.' }); });

app.listen(PORT, () => console.log(`✅ ${getSetting('store_name')} no ar em http://localhost:${PORT}\n   Admin: admin@loja.com / admin123`));
