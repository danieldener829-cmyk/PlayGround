# ✨ LUMIÈRE Store — Loja Virtual Completa

Loja virtual funcional com frontend premium + backend + banco SQLite. Pronta para vender.

## 🚀 Instalação (2 minutos)

```bash
npm install
cp .env.example .env   # edite JWT_SECRET e nome da loja
npm start
```

Abra **http://localhost:3000**

**Logins de demonstração:**
| Perfil | E-mail | Senha |
|---|---|---|
| Admin | `admin@loja.com` | `admin123` |
| Cliente | `cliente@loja.com` | `cliente123` |

> ⚠️ Troque as senhas e defina `JWT_SECRET` antes de publicar.

## ✅ O que já funciona de verdade

- **Vitrine:** banners, destaques, ofertas, lançamentos, busca, filtros, ordenação
- **Produto:** página individual, estoque, avaliações, favoritos
- **Carrinho + checkout:** guest ou logado, endereço, cupom (`BEMVINDO10`), frete com regra de grátis acima de R$ 299
- **Pedidos:** status (aguardando → pago → preparando → enviado → entregue), rastreio, histórico, acompanhamento por e-mail+código
- **Conta:** cadastro, login JWT + bcrypt, recuperação de senha, endereços, favoritos
- **Admin (`#/admin`):** dashboard (faturamento, ticket, top produtos, estoque baixo), CRUD produtos/categorias/cupons/banners, pedidos, clientes, CSV de vendas, configurações de frete
- **Extras:** WhatsApp flutuante, SEO (sitemap/robots/meta/JSON-LD), LGPD/privacidade/termos/trocas/FAQ/contato, responsivo, acessível (skip-link, aria)

## ⚠️ O que FALTA configurar (integrações reais — nada simulado como pago)

O checkout **NUNCA marca pedido como pago sem confirmação do provedor**. Hoje, sem credencial, pedidos ficam `aguardando_pagamento` (modo demonstração, avisado na tela).

Para ativar pagamentos reais (Pix + cartão em até 12x + boleto):

1. Crie conta no **Mercado Pago** → credenciais de produção → `MP_ACCESS_TOKEN`
2. Configure o webhook `https://SEU-DOMINIO/api/webhooks/mercadopago` + `MP_WEBHOOK_SECRET`
3. Reinicie: `MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... npm start`
4. Teste com chave Pix/boleto de homologação antes de vender

Alternativa: `STRIPE_SECRET_KEY` (webhook `/api/webhooks/stripe`).

Também pendente p/ produção: SMTP real p/ e-mails, transportadora real (hoje frete por regra configurável no admin), HTTPS + backup do `data/loja.db`.

## 🌍 Publicar em domínio próprio

Qualquer VPS/PaaS com Node 20+: `npm install && npm start` (porta via `PORT`). Aponte o DNS ao servidor e ative HTTPS (ex.: Caddy/Nginx + Let's Encrypt). Banco: arquivo `data/loja.db` (backup diário recomendado).

## 🗂️ Estrutura

```
server.js          # API + auth + checkout + webhooks + SQLite
public/index.html  # vitrine SPA
public/styles.css  # design premium responsivo
public/app.js      # carrinho, checkout, conta, admin
data/loja.db       # criado automaticamente (seed incluso)
```
