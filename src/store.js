// Store — persiste tudo em localStorage (pronto p/ trocar por Supabase)
const K = { projects:'sg_projects_v1', user:'sg_user_v1', plan:'sg_plan_v1', settings:'sg_settings_v1', clients:'sg_admin_clients_v1' };
export const store = {
  get(k, fb){ try{ const v = localStorage.getItem(K[k]||k); return v?JSON.parse(v):fb }catch{ return fb } },
  set(k,v){ localStorage.setItem(K[k]||k, JSON.stringify(v)) },
};
export function uid(){ return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4) }
export function getUser(){
  let u = store.get('user', null);
  if(!u){ u = { id:uid(), name:'Visitante Genius', email:'voce@sitegenius.com.br', avatar:'VG', createdAt:Date.now() }; store.set('user',u) }
  return u;
}
export function getPlan(){ return store.get('plan', { name:'free', mrr:0 }) }
export function setPlan(p){ store.set('plan',p) }
export function getProjects(){ return store.get('projects', []) }
export function saveProject(p){
  const all = getProjects();
  const i = all.findIndex(x=>x.id===p.id);
  if(i>=0) all[i]=p; else all.unshift(p);
  store.set('projects', all);
  // seed admin clients revenue on publish
  return p;
}
export function deleteProject(id){ store.set('projects', getProjects().filter(p=>p.id!==id)) }
export function getSettings(){ return store.get('settings', { anthropicKey:'', supabaseUrl:'', supabaseKey:'', unsplashKey:'' }) }
export function toast(msg, type='ok'){
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast glass rounded-xl px-4 py-3 text-sm max-w-xs shadow-2xl border-l-4 '+(type==='ok'?'border-l-emerald-400':type==='err'?'border-l-rose-500':'border-l-cyan-400');
  el.innerHTML = `<div class="font-semibold">${type==='err'?'Erro':'Sucesso'}</div><div class="opacity-80">${msg}</div>`;
  box.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='.4s'; setTimeout(()=>el.remove(),400) }, 3400);
}
export function fmtDate(ts){ return new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) }
