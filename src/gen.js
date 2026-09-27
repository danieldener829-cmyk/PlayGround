// Motor de IA local + 20 templates premium
// Cada template = { id, niche, name, desc, img, colors:{bg,ink,accent,accent2,btn}, font, hero img, copy }

const U = (id,w=1200)=>`https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const TEMPLATES = [
 { id:'barber-dark', niche:'barbearia', name:'Barbearia Corte Fino', desc:'Dark premium com agendamento e preços', colors:{bg:'#0c0a09',ink:'#fafaf9',accent:'#f59e0b',accent2:'#78350f',btn:'#f59e0b'}, font:'Sora', img:U('photo-1585747860715-2ba37e788b70'), tag:'Barbearia' },
 { id:'barber-modern', niche:'barbearia', name:'Barber Studio Moderno', desc:'Gradiente violeta, depoimentos e WhatsApp', colors:{bg:'#09090b',ink:'#ffffff',accent:'#8b5cf6',accent2:'#06b6d4',btn:'#7c3aed'}, font:'Sora', img:U('photo-1503951914875-452162b0f3f1'), tag:'Barbearia' },
 { id:'advocacia-lux', niche:'advocacia', name:'Advocacia Prado — Elite', desc:'Azul marinho + dourado, autoridade máxima', colors:{bg:'#0a1128',ink:'#f8fafc',accent:'#c9a227',accent2:'#1e3a5f',btn:'#c9a227'}, font:'Inter', img:U('photo-1589829545856-d10d557cf95f'), tag:'Advocacia' },
 { id:'advogada-fem', niche:'advocacia', name:'Advogada Feminina Humanizada', desc:'Rosé + depoimentos, foco em direito de família', colors:{bg:'#fff7ed',ink:'#431407',accent:'#db2777',accent2:'#fb7185',btn:'#be185d'}, font:'Inter', img:U('photo-1573496359142-b8d87734a5a2'), tag:'Advocacia' },
 { id:'clinica-odonto', niche:'clinica', name:'Clínica Odonto Vitta', desc:'Branco + ciano, agendar avaliação', colors:{bg:'#f0fdfa',ink:'#042f2e',accent:'#06b6d4',accent2:'#14b8a6',btn:'#0891b2'}, font:'Inter', img:U('photo-1629909613654-28e377c37b09'), tag:'Clínica' },
 { id:'clinica-estetica', niche:'clinica', name:'Estética Essenza', desc:'Nude premium, antes/depois, prova social', colors:{bg:'#fdf2f8',ink:'#500724',accent:'#ec4899',accent2:'#f9a8d4',btn:'#db2777'}, font:'Sora', img:U('photo-1570172619644-dfd03ed5d881'), tag:'Clínica' },
 { id:'restaurante-gourmet', niche:'restaurante', name:'Trattoria Gourmet', desc:'Cardápio, reserva e delivery', colors:{bg:'#1c0a00',ink:'#fffbeb',accent:'#f59e0b',accent2:'#b45309',btn:'#ea580c'}, font:'Sora', img:U('photo-1414235077428-338989a2e8c0'), tag:'Restaurante' },
 { id:'restaurante-japa', niche:'restaurante', name:'Sushi Yama Dark', desc:'Preto + vermelho, pedido no WhatsApp', colors:{bg:'#0a0a0a',ink:'#ffffff',accent:'#ef4444',accent2:'#7f1d1d',btn:'#dc2626'}, font:'Sora', img:U('photo-1579871494447-9811cf80d66c'), tag:'Restaurante' },
 { id:'loja-street', niche:'loja', name:'Loja Street Wear', desc:'E-commerce vibes, grade de produtos', colors:{bg:'#09090b',ink:'#fafafa',accent:'#22d3ee',accent2:'#7c3aed',btn:'#06b6d4'}, font:'Sora', img:U('photo-1441986300917-64674bd600d8'), tag:'Loja' },
 { id:'loja-beleza', niche:'loja', name:'Beleza Natural Shop', desc:'Verde + prova, kits promocionais', colors:{bg:'#f7fee7',ink:'#1a2e05',accent:'#65a30d',accent2:'#16a34a',btn:'#4d7c0f'}, font:'Inter', img:U('photo-1596462502278-27bfdc403348'), tag:'Loja' },
 { id:'infoproduto-fit', niche:'infoproduto', name:'Método Emagrecimento', desc:'Landing de alta conversão, VSL + garantia', colors:{bg:'#0b0613',ink:'#ffffff',accent:'#facc15',accent2:'#7c3aed',btn:'#eab308'}, font:'Sora', img:U('photo-1571019613454-1cb2f99b2d8b'), tag:'Infoproduto' },
 { id:'infoproduto-renda', niche:'infoproduto', name:'Renda Extra Digital', desc:'Contador, bônus, FAQ quebra-objeções', colors:{bg:'#020617',ink:'#f8fafc',accent:'#22c55e',accent2:'#06b6d4',btn:'#16a34a'}, font:'Sora', img:U('photo-1460925895917-afdab827c52f'), tag:'Infoproduto' },
 { id:'portfolio-dev', niche:'portfolio', name:'Portfólio Dev Dark', desc:'Projetos, stack, contato', colors:{bg:'#05050a',ink:'#e2e8f0',accent:'#22d3ee',accent2:'#7c3aed',btn:'#7c3aed'}, font:'Inter', img:U('photo-1461749280684-dccba630e2f6'), tag:'Portfólio' },
 { id:'portfolio-foto', niche:'portfolio', name:'Fotógrafa Minimal', desc:'Galeria full-bleed, orçamento', colors:{bg:'#fafaf9',ink:'#1c1917',accent:'#1c1917',accent2:'#a8a29e',btn:'#1c1917'}, font:'Inter', img:U('photo-1493863641943-9b68992a8d07'), tag:'Portfólio' },
 { id:'academia', niche:'academia', name:'Academia Titan', desc:'Planos mensais, transformação', colors:{bg:'#0a0a0a',ink:'#ffffff',accent:'#f97316',accent2:'#dc2626',btn:'#ea580c'}, font:'Sora', img:U('photo-1534438327276-14e5300c3a48'), tag:'Fitness' },
 { id:'imobiliaria', niche:'imobiliaria', name:'Imobiliária Prime Lar', desc:'Destaques, tour, corretor WhatsApp', colors:{bg:'#f8fafc',ink:'#0f172a',accent:'#0ea5e9',accent2:'#1e40af',btn:'#0284c7'}, font:'Inter', img:U('photo-1560518883-ce09059eeffa'), tag:'Imobiliária' },
 { id:'petshop', niche:'petshop', name:'PetShop Amigo Fiel', desc:'Banho/tosa, planos, fofura', colors:{bg:'#fffbeb',ink:'#451a03',accent:'#f59e0b',accent2:'#10b981',btn:'#f59e0b'}, font:'Inter', img:U('photo-1548199973-03cce0bbc87b'), tag:'Pet' },
 { id:'igreja', niche:'igreja', name:'Igreja Graça Viva', desc:'Cultos, dízimo, células', colors:{bg:'#0f0a2e',ink:'#ede9fe',accent:'#a78bfa',accent2:'#6d28d9',btn:'#7c3aed'}, font:'Sora', img:U('photo-1438032005730-c779502df39b'), tag:'Igreja' },
 { id:'landing-saas', niche:'saas', name:'SaaS Convert+', desc:'Hero + features + pricing SaaS', colors:{bg:'#020617',ink:'#f1f5f9',accent:'#7c3aed',accent2:'#06b6d4',btn:'#7c3aed'}, font:'Sora', img:U('photo-1551288049-bebda4e38f71'), tag:'SaaS' },
 { id:'casamento', niche:'casamento', name:'Casamento & Eventos', desc:'Romântico, galeria, RSVP', colors:{bg:'#fff1f2',ink:'#4c0519',accent:'#e11d48',accent2:'#fda4af',btn:'#be123c'}, font:'Inter', img:U('photo-1519741497674-611481863552'), tag:'Eventos' },
];

export function detectNiche(prompt){
  const p = (prompt||'').toLowerCase();
  const rules = [
    ['barbearia',['barbear','barber','cabelo','corte']],
    ['advocacia',['advog','direito','jurid','lei']],
    ['clinica',['clinic','odonto','dental','estet','medic','fisio','psico','nutri','saude']],
    ['restaurante',['restaur','comida','pizza','burger','lanch','sushi','japa','caf','padaria','doceria']],
    ['loja',['loja','ecommerce','e-commerce','roupa','moda','cosmet','beleza','sapato']],
    ['infoproduto',['infoprod','curso','mentoria','ebook','emagrec','renda extra','tráfego','marketing','lançamento','lancamento']],
    ['portfolio',['portfol','fotograf','designer','dev ','programador','freela']],
    ['academia',['academia','fit','crossfit','personal','muscul']],
    ['imobiliaria',['imob','casa','apart','corretor','terreno']],
    ['petshop',['pet','cachorro','gato','tosa','vet']],
    ['igreja',['igreja','ministerio','culto','pastor']],
    ['saas',['saas','software','app ','startup','sistema']],
    ['casamento',['casamento','noiva','festa','evento','anivers']],
  ];
  for(const [n,keys] of rules){ if(keys.some(k=>p.includes(k))) return n }
  return 'saas';
}

const COPY = {
  barbearia:{ biz:'Barbearia Corte Fino', heroT:'Corte impecável, estilo de respeito.', heroS:'Agende em 30 segundos no WhatsApp. Degradê, barba terapia e atendimento VIP no centro.', services:[['Degradê Navalhado','R$ 45','Acabamento premium + toalha quente'],['Barba Terapia','R$ 35','Hidratação + alinhamento'],['Corte + Barba Combo','R$ 70','O ritual completo']], cta:'Agendar horário' },
  advocacia:{ biz:'Prado Advocacia', heroT:'Seus direitos defendidos por especialistas.', heroS:'+850 casos vencidos. Primeira consulta gratuita no WhatsApp. Trabalhista, família e previdenciário.', services:[['Direito Trabalhista','Consulta grátis','Verbas rescisórias e acordos'],['Direito de Família','Consulta grátis','Divórcio, guarda e pensão'],['Previdenciário','Consulta grátis','Aposentadoria e BPC']], cta:'Falar com advogada' },
  clinica:{ biz:'Clínica Vitta', heroT:'Seu sorriso transforma tudo.', heroS:'Limpeza + avaliação gratuita essa semana. Parcelamos em 12x. Nota 4.9 com 2.300 avaliações.', services:[['Limpeza + Clareamento','R$ 297','De R$ 497 por tempo limitado'],['Aparelho Invisível','12x R$ 199','Primeira avaliação grátis'],['Harmonização','R$ 899','Com especialista']], cta:'Agendar avaliação grátis' },
  restaurante:{ biz:'Cantina Sabor & Alma', heroT:'Comida que abraça.', heroS:'Pratos artesanais, delivery em 30min e reserva em 1 clique. 4.9 estrelas no iFood.', services:[['Prato Executivo','R$ 29,90','Serve 2 + suco grátis'],['Rodízio Premium','R$ 79,90','Noites de qui a sáb'],['Delivery','30 min','Peça no WhatsApp']], cta:'Ver cardápio' },
  loja:{ biz:'Loja Essencial', heroT:'Ofertas que esgotam hoje.', heroS:'Frete grátis acima de R$ 149 + 10% OFF no PIX. Troca grátis em 30 dias.', services:[['Kit Best-Sellers','R$ 149','De R$ 249 — 40% OFF'],['Lançamento','R$ 89','Novidades da estação'],['Combo Família','R$ 199','Leve 3 pague 2']], cta:'Comprar agora' },
  infoproduto:{ biz:'Método Resultado em 30 dias', heroT:'Transformação em 30 dias ou seu dinheiro de volta.', heroS:'+12.400 alunos. VSL de 7 min + bônus de R$ 997. De R$ 497 por apenas R$ 97.', services:[['Curso Completo','R$ 97','De R$ 497 — 80% OFF'],['Mentoria VIP','R$ 297','Vagas limitadas'],['Comunidade','Bônus','Suporte vitalício']], cta:'Quero minha vaga' },
  portfolio:{ biz:'Rafael Costa — Designer', heroT:'Eu crio marcas que vendem.', heroS:'+120 projetos entregues. Identidade, sites e social media. Orçamento em 24h.', services:[['Identidade Visual','R$ 1.200','Logo + manual'],['Site Profissional','R$ 2.500','Entrega em 7 dias'],['Social Media','R$ 800/mês','30 artes mensais']], cta:'Pedir orçamento' },
  academia:{ biz:'Academia Titan', heroT:'Seu shape em 90 dias.', heroS:'Musculação + cross + app de treino. Primeira semana grátis, sem fidelidade.', services:[['Mensal','R$ 89','Sem fidelidade'],['Trimestral','R$ 69/mês','Avaliação inclusa'],['Anual','R$ 49/mês','2 meses grátis']], cta:'Treinar 7 dias grátis' },
  imobiliaria:{ biz:'Prime Lar Imóveis', heroT:'Seu novo lar está aqui.', heroS:'+300 imóveis, financiamento facilitado e visita agendada no WhatsApp.', services:[['Apartamentos','A partir R$ 280 mil','2-3 quartos'],['Casas','A partir R$ 450 mil','Com quintal'],['Terrenos','A partir R$ 120 mil','Parcelado']], cta:'Agendar visita' },
  petshop:{ biz:'Amigo Fiel Pet', heroT:'Seu pet tratado como família.', heroS:'Banho, tosa e veterinário. Busca e entrega grátis no bairro.', services:[['Banho + Tosa','R$ 79','Hidratação inclusa'],['Veterinário','R$ 120','Consulta completa'],['Hospedagem','R$ 60/dia','Com webcam']], cta:'Agendar banho' },
  igreja:{ biz:'Igreja Graça Viva', heroT:'Um lugar para recomeçar.', heroS:'Cultos dom 9h e 18h. Células durante a semana. Seja bem-vindo como você está.', services:[['Culto Domingo','9h e 18h','Presencial + online'],['Células','Qua 20h','Perto de você'],['Voluntariado','Seja parte','Inscreva-se']], cta:'Planejar visita' },
  saas:{ biz:'Convert+ SaaS', heroT:'Venda 3x mais no automático.', heroS:'Teste 14 dias grátis. Sem cartão. Setup em 5 minutos, suporte em português.', services:[['Starter','R$ 47/mês','Até 1k contatos'],['Pro','R$ 97/mês','Automação ilimitada'],['Enterprise','Custom','Gerente dedicado']], cta:'Testar grátis' },
  casamento:{ biz:'Ateliê Amor & Festa', heroT:'O dia mais lindo da sua vida.', heroS:'Cerimonial completo, decoração e fotografia. Orçamento em 24h.', services:[['Cerimonial','R$ 3.900','Dia completo'],['Decoração','R$ 5.500','Projeto 3D'],['Foto + Filme','R$ 4.200','Álbum incluso']], cta:'Solicitar orçamento' },
};

export function pickTemplate(prompt){
  const niche = detectNiche(prompt);
  const opts = TEMPLATES.filter(t=>t.niche===niche);
  if(opts.length) return { tpl: opts[Math.floor(Math.random()*opts.length)], niche };
  return { tpl: TEMPLATES.find(t=>t.id==='landing-saas'), niche:'saas' };
}

// Gera o "site" como JSON de seções editáveis
export function generateSiteData(prompt, tplOverride=null){
  const { tpl, niche } = tplOverride ? {tpl:tplOverride, niche:tplOverride.niche} : pickTemplate(prompt);
  const c = COPY[niche] || COPY.saas;
  const business = extractBiz(prompt) || c.biz;
  const id = ()=>Math.random().toString(36).slice(2,8);
  const wa = '5511999999999';
  const sections = [
    { id:id(), type:'hero', title:business, subtitle:c.heroT, text:c.heroS, cta:c.cta, image:tpl.img, layout:'split' },
    { id:id(), type:'logos', title:'Quem confia', items:['★ 4.9 no Google','+2.000 clientes','Resposta em 5 min','Garantia total'] },
    { id:id(), type:'sobre', title:'Sobre nós', subtitle:'Por que escolher a gente?', text:`Somos referência em ${niche}. Atendimento humano, preço justo e resultado garantido. ${business} nasceu para resolver de verdade o seu problema — sem enrolação.`, image:tpl.img, stats:[['+2.5k','clientes'],['4.9★','avaliação'],['5min','resposta']] },
    { id:id(), type:'servicos', title:'Nossos serviços', subtitle:'Escolha o ideal pra você', items: c.services.map(s=>({t:s[0],p:s[1],d:s[2]})) },
    { id:id(), type:'depoimentos', title:'Quem já passou por aqui', items:[{n:'Mariana S.',t:'Melhor decisão que tomei! Atendimento impecável e resultado acima do esperado.',s:5},{n:'Carlos H.',t:'Preço justo e entrega rapidíssima. Virei cliente fiel.',s:5},{n:'Juliana P.',t:'Superou todas as expectativas. Recomendo de olhos fechados!',s:5}] },
    { id:id(), type:'precos', title:'Planos e preços', subtitle:'Transparente, sem pegadinha', items: c.services.map((s,i)=>({t:s[0],p:s[1],d:s[2],hl:i===1})) },
    { id:id(), type:'faq', title:'Perguntas frequentes', items:[{q:'Como faço para agendar?',a:'Clique em qualquer botão de WhatsApp do site e fale direto com a gente. Respondemos em ~5 minutos.'},{q:'Quais as formas de pagamento?',a:'PIX com desconto, cartão em até 12x e dinheiro.'},{q:'Vocês oferecem garantia?',a:'Sim! Se não ficar satisfeito, devolvemos seu investimento.'}] },
    { id:id(), type:'contato', title:'Fale com a gente agora', subtitle:'Retornamos em minutos', text:'WhatsApp, endereço e horário de atendimento.', cta:'Chamar no WhatsApp', image:tpl.img },
    { id:id(), type:'footer', title:business, text:`© ${new Date().getFullYear()} ${business} — Todos os direitos reservados.` },
  ];
  return { tpl, niche, business, wa, sections, prompt };
}
function extractBiz(prompt){
  if(!prompt) return null;
  const m2 = prompt.match(/["“”']([A-ZÀ-Ú][A-Za-zÀ-ú0-9 &.\-]{2,40})["“”']/);
  if(m2) return m2[1].trim();
  const m = prompt.match(/(?:chamad[oa]|nome|empresa|negócio|negocio|loja|clínica|clinica|barbearia|restaurante)\s+["“”']?([A-ZÀ-Úa-zà-ú0-9 &.\-]{3,40})/);
  if(m) return m[1].trim().replace(/\s+(chamad[oa]|com|de|para|que|e)$/i,'');
  return null;
}

// Tenta Claude API se houver chave, senão usa motor local (sempre funciona)
export async function generateWithAI(prompt, settings){
  const key = settings?.anthropicKey;
  if(key && key.startsWith('sk-ant-')){
    try{
      const r = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body: JSON.stringify({ model:'claude-3-5-sonnet-20240620', max_tokens:120, system:'Responda apenas com o nicho do site em 1 palavra.', messages:[{role:'user',content:`Qual o nicho deste pedido de site? "${prompt}". Responda só: barbearia, advocacia, clinica, restaurante, loja, infoproduto, portfolio, academia, imobiliaria, petshop, igreja, saas ou casamento.`}] })
      });
      if(r.ok){ /* futuro: gerar copy; por ora só valida a chave */ }
    }catch(e){ console.warn('Claude indisponível, usando motor local', e) }
  }
  await new Promise(r=>setTimeout(r, 900)); // UX
  return generateSiteData(prompt);
}

export function slugify(s){ return (s||'meu-site').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'meu-site' }
