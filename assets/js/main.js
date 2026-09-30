// Animações + helpers globais
const io=new IntersectionObserver(e=>e.forEach(x=>x.isIntersecting&&x.target.classList.add('in')),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Sessão demo (localStorage) — substituir por backend real (JWT/OAuth)
const Session={
  get(){try{return JSON.parse(localStorage.getItem('nimbus_session')||'null')}catch{return null}},
  set(s){localStorage.setItem('nimbus_session',JSON.stringify(s))},
  clear(){localStorage.removeItem('nimbus_session')},
  require(role){
    const s=this.get();
    if(!s){location.href='login.html?next='+encodeURIComponent(location.pathname.split('/').pop());return null}
    if(role==='admin'&&s.role!=='admin'){alert('Acesso restrito a administradores.');location.href='painel.html';return null}
    return s;
  }
};
window.Session=Session;
function logout(){Session.clear();location.href='index.html'}
