// ===== ADMIN JS =====
const U = "ADMIN", P = "CLIENTE";
function load(k,fb){ try{ const v=JSON.parse(localStorage.getItem(k)); return v??fb;}catch{return fb;} }
function save(k,v){ localStorage.setItem(k,JSON.stringify(v)); }

function doLogin(){
  const u=document.getElementById('adm-user').value.trim().toUpperCase();
  const p=document.getElementById('adm-pass').value.trim().toUpperCase();
  if(u===U && p===P){
    sessionStorage.setItem('iatube_admin','1');
    showDash();
  } else {
    document.getElementById('login-err').textContent='❌ Usuário ou senha incorretos. Use ADMIN / CLIENTE';
  }
}
function doLogout(){ sessionStorage.removeItem('iatube_admin'); location.reload(); }
function showDash(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('dash-screen').style.display='block';
  loadConfigForm(); renderAll();
}
function tab(id,btn){
  document.querySelectorAll('.tabs-admin button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
}
function renderAll(){ renderKPIs(); renderAdminModules(); renderSales(); renderLeads(); }
function renderKPIs(){
  const sales=load('iatube_sales',[]), leads=load('iatube_leads',[]), mods=load('iatube_modules',[]);
  const fat=sales.reduce((s,v)=>s+(+v.value||0),0);
  document.getElementById('k-fatur').textContent='R$ '+fat.toLocaleString('pt-BR');
  document.getElementById('k-vendas').textContent=sales.length;
  document.getElementById('k-leads').textContent=leads.length;
  document.getElementById('k-aulas').textContent=mods.reduce((s,m)=>s+(m.lessons||[]).length,0);
}
function renderAdminModules(){
  const mods=load('iatube_modules',[]);
  const box=document.getElementById('admin-modules'); box.innerHTML='';
  mods.forEach((m,mi)=>{
    let h=`<div class="card" style="margin-bottom:12px"><h3>${mi+1}. ${m.title} <button class="btn-del" onclick="delModule(${mi})">Excluir módulo</button></h3><p class="muted small">${m.desc||''}</p>`;
    (m.lessons||[]).forEach((l,li)=>{
      h+=`<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #2a2a45;font-size:14px"><span>▶ ${l.t} <small class="muted">• ${l.d||''}</small> ${l.free?'<b style="color:#22c55e">[GRÁTIS]</b>':'<span class="muted">[pago]</span>'}</span><span><button class="btn-ok" onclick="toggleFree(${mi},${li})">${l.free?'Bloquear':'Liberar'}</button> <button class="btn-del" onclick="delLesson(${mi},${li})">✕</button></span></div>`;
    });
    h+='</div>'; box.innerHTML+=h;
  });
}
function addLesson(){
  const mod=document.getElementById('f-mod').value.trim();
  const moddesc=document.getElementById('f-moddesc').value.trim();
  const t=document.getElementById('f-title').value.trim();
  const d=document.getElementById('f-dur').value.trim()||'--';
  const v=document.getElementById('f-video').value.trim();
  const free=document.getElementById('f-free').checked;
  if(!mod||!t){ alert('Preencha ao menos o módulo e o título da aula.'); return; }
  let mods=load('iatube_modules',[]);
  let m=mods.find(x=>x.title.toLowerCase()===mod.toLowerCase());
  if(!m){ m={id:Date.now(), title:mod, desc:moddesc, lessons:[]}; mods.push(m); }
  else if(moddesc) m.desc=moddesc;
  m.lessons.push({t, d, v, free});
  save('iatube_modules',mods); renderAll();
  document.getElementById('f-title').value=''; document.getElementById('f-video').value='';
  alert('✅ Aula salva! Já aparece no site.');
}
function delModule(i){ if(!confirm('Excluir módulo inteiro?'))return; let m=load('iatube_modules',[]); m.splice(i,1); save('iatube_modules',m); renderAll(); }
function delLesson(mi,li){ let m=load('iatube_modules',[]); m[mi].lessons.splice(li,1); save('iatube_modules',m); renderAll(); }
function toggleFree(mi,li){ let m=load('iatube_modules',[]); m[mi].lessons[li].free=!m[mi].lessons[li].free; save('iatube_modules',m); renderAll(); }

function renderSales(){
  const s=load('iatube_sales',[]);
  document.getElementById('sales-body').innerHTML = s.map((v,i)=>`<tr><td>${v.date}</td><td><b>${v.name}</b></td><td>${v.email}<br><small>${v.whats||''}</small></td><td>R$ ${v.value}</td><td>${v.method}</td><td>${v.status}</td><td><button class="btn-del" onclick="delSale(${i})">✕</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Nenhuma venda ainda. Faça um teste no site.</td></tr>';
}
function delSale(i){ let s=load('iatube_sales',[]); s.splice(i,1); save('iatube_sales',s); renderAll(); }
function clearSales(){ if(confirm('Limpar todas as vendas?')){ save('iatube_sales',[]); renderAll(); } }
function exportCSV(){
  const s=load('iatube_sales',[]);
  let csv='data;nome;email;whats;valor;metodo;status\n'+s.map(v=>`${v.date};${v.name};${v.email};${v.whats||''};${v.value};${v.method};${v.status}`).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='vendas.csv'; a.click();
}
function renderLeads(){
  const l=load('iatube_leads',[]);
  document.getElementById('leads-body').innerHTML=l.map((v,i)=>`<tr><td>${v.date}</td><td>${v.name}</td><td>${v.email}</td><td><button class="btn-del" onclick="delLead(${i})">✕</button></td></tr>`).join('')||'<tr><td colspan="4" class="muted">Nenhum lead ainda.</td></tr>';
}
function delLead(i){ let l=load('iatube_leads',[]); l.splice(i,1); save('iatube_leads',l); renderAll(); }
function clearLeads(){ if(confirm('Limpar leads?')){ save('iatube_leads',[]); renderAll(); } }

function loadConfigForm(){
  const c=load('iatube_config',{price:47,oldPrice:497,discount:'90% OFF',whatsapp:'5511999999999',pix:'contato@iatubemaster.com',vagas:17});
  document.getElementById('c-price').value=c.price;
  document.getElementById('c-old').value=c.oldPrice;
  document.getElementById('c-desc').value=c.discount;
  document.getElementById('c-vagas').value=c.vagas;
  document.getElementById('c-whats').value=c.whatsapp;
  document.getElementById('c-pix').value=c.pix;
}
function saveConfig(){
  const c={price:+document.getElementById('c-price').value||47, oldPrice:+document.getElementById('c-old').value||497, discount:document.getElementById('c-desc').value||'90% OFF', vagas:+document.getElementById('c-vagas').value||17, whatsapp:document.getElementById('c-whats').value||'', pix:document.getElementById('c-pix').value||''};
  save('iatube_config',c); document.getElementById('config-msg').textContent='✅ Salvo! Preço e checkout do site atualizados.';
}
function resetDemo(){ if(confirm('Restaurar aulas demo? Suas edições serão perdidas.')){ localStorage.removeItem('iatube_modules'); location.reload(); } }

// auto-login se sessão ativa + Enter
if(sessionStorage.getItem('iatube_admin')==='1') showDash();
document.addEventListener('keydown',e=>{ if(e.key==='Enter' && document.getElementById('login-screen').style.display!=='none') doLogin(); });
