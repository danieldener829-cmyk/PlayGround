// NuvemOS — motores 100% reais (WebVM / JSLinux / v86). Código original.
const REAL = {
  debian: { name: 'Debian 12 real (WebVM)', url: 'https://webvm.io/', desc: 'Debian real via CheerpX (x86-para-WASM). Roda binários Debian de verdade no seu navegador.' },
  alpine: { name: 'Alpine real (JSLinux)', url: 'https://bellard.org/jslinux/vm.html?cpu=x86&url=alpine-x86.cfg&mem=192', desc: 'Alpine Linux real via TinyEMU de Fabrice Bellard. Terminal root de verdade.' },
  alpineX: { name: 'Alpine gráfico real (JSLinux)', url: 'https://bellard.org/jslinux/vm.html?cpu=x86&url=alpine-x86.cfg&mem=192&graphic=1', desc: 'Mesmo Alpine, com framebuffer/X. Botão direito abre o menu.' },
  arch: { name: 'Arch32 real (v86)', url: 'https://copy.sh/v86/?profile=archlinux', desc: 'Arch Linux 32 real no emulador x86 v86 (open-source). Boot completo.' },
  reactos: { name: 'ReactOS real (v86)', url: 'https://copy.sh/v86/?profile=reactos', desc: 'Sistema aberto compatível com Windows, boot real no v86. Windows da Microsoft exige licença e não pode ser embutido grátis.' },
  win95: { name: 'Windows 95 real (v86)', url: 'https://copy.sh/v86/?profile=windows95', desc: 'Windows 95 histórico real no v86 (para estudo/nostalgia).' },
  win98: { name: 'Windows 98 real (v86)', url: 'https://copy.sh/v86/?profile=windows98', desc: 'Windows 98 histórico real no v86, com FreeCell e IE5.' },
  win2k: { name: 'Windows 2000 real (v86)', url: 'https://copy.sh/v86/?profile=windows2000', desc: 'Windows 2000 histórico real no v86.' },
  tinycore: { name: 'TinyCore real (v86)', url: 'https://copy.sh/v86/?profile=tinycore', desc: 'Linux ultraleve real, ótimo em PC fraco/celular.' },
};

const SYSTEMS = [
  {id:'deb12', name:'Debian 12', base:'debian', icon:'🔴', color:'#dc2626', desc:'Abre Debian 12 real no WebVM.', ram:'navegador', disk:'imagem CDN', real:'debian', level:'Intermediário', tips:['cat /etc/os-release','uname -a','python3 -c "print(2+2)"','ls /bin | head']},
  {id:'u22', name:'Ubuntu estilo', base:'ubuntu', icon:'🟠', color:'#e76f1a', desc:'Abre Debian real (mesma família APT do Ubuntu).', ram:'navegador', disk:'imagem CDN', real:'debian', level:'Iniciante', tips:['ls ~','cat /etc/os-release','python3 --version']},
  {id:'mint', name:'Menta leve', base:'ubuntu', icon:'🌿', color:'#16a34a', desc:'Abre Alpine real — leve como o Mint.', ram:'navegador', disk:'192MB', real:'alpine', level:'Iniciante', tips:['uname -a','ls /','cat /etc/alpine-release']},
  {id:'fed39', name:'Fedora estilo', base:'fedora', icon:'💙', color:'#1d4ed8', desc:'Abre Arch real (rolling como Fedora).', ram:'navegador', disk:'imagem v86', real:'arch', level:'Avançado', tips:['uname -a','ls /usr/bin | head']},
  {id:'alpine', name:'Alpine console', base:'debian', icon:'⛰️', color:'#0ea5e9', desc:'Alpine real via JSLinux, boot em segundos.', ram:'192MB', disk:'leve', real:'alpine', level:'Iniciante', tips:['whoami','ls /bin','ping -c2 127.0.0.1']},
  {id:'alpineX', name:'Alpine gráfico', base:'debian', icon:'🖥️', color:'#7c3aed', desc:'Alpine real com interface gráfica.', ram:'192MB', disk:'leve', real:'alpineX', level:'Iniciante', tips:['Clique com botão direito para o menu X']},
  {id:'arch', name:'Arch32', base:'fedora', icon:'⚡', color:'#0284c7', desc:'Arch real no v86.', ram:'navegador', disk:'imagem v86', real:'arch', level:'Avançado', tips:['uname -a','pacman --version']},
  {id:'tiny', name:'TinyCore', base:'debian', icon:'📦', color:'#475569', desc:'O mais leve — ideal para celular.', ram:'128MB', disk:'mini', real:'tinycore', level:'Iniciante', tips:['version','ls /']},
  {id:'winR', name:'ReactOS (Windows-compatível)', base:'windows', icon:'🪟', color:'#2563eb', desc:'Windows-compatível real e aberto. MS Windows exige licença.', ram:'navegador', disk:'imagem v86', real:'reactos', level:'Iniciante', tips:['Abra o gerenciador de arquivos e o bloco de notas']},
  {id:'winGuide', name:'Windows real (guia)', base:'windows', icon:'◧', color:'#0f172a', desc:'Como rodar Windows licenciado no seu servidor.', ram:'seu servidor', disk:'—', real:'guide', level:'Guia', tips:['Veja a seção Servidor']},
  {id:'win11', name:'Windows 11', base:'windows', icon:'🪟', color:'#0078d4', desc:'Gera Docker Win11 + link da ISO oficial da Microsoft.', ram:'4G+', disk:'seu Docker', real:'win11guide', level:'Guia', tips:['Gerar Docker Win11 abaixo', 'Baixar ISO oficial Microsoft']},
];

const APPS = [
  {id:'a1', name:'Terminal Debian (gcc, python, vim)', platform:'linux', cat:'dev', icon:'💻', size:'na imagem', desc:'Dentro do Lab Debian rode: apt, gcc, python3, vim. Tudo real.', cmd:'gcc --version && python3 --version'},
  {id:'a2', name:'Alpine apk + tinycc', platform:'linux', cat:'dev', icon:'⛰️', size:'leve', desc:'No Alpine real: apk, tcc, vi. Boot rápido.', cmd:'apk --version'},
  {id:'a3', name:'Ferramentas unix (grep, awk, sed)', platform:'linux', cat:'dev', icon:'⌨️', size:'built-in', desc:'Teste grep/sed/awk com arquivos reais da VM.', cmd:'ls /bin | grep sh'},
  {id:'a4', name:'Servidor http local', platform:'linux', cat:'dev', icon:'🌐', size:'built-in', desc:'No Debian real: python3 -m http.server.', cmd:'python3 -m http.server 8000'},
  {id:'a5', name:'ReactOS: bloco de notas, paint', platform:'windows', cat:'util', icon:'🪟', size:'na imagem', desc:'Apps nativos do ReactOS real no v86.', cmd:''},
  {id:'a6', name:'Multimídia no Alpine gráfico', platform:'linux', cat:'multimidia', icon:'🎬', size:'leve', desc:'Teste o modo gráfico do JSLinux.', cmd:''},
];

const COMMANDS = [
  {cmd:'uname -a', desc:'Mostra kernel real da VM.', hint:'Rode no Debian ou Alpine real.'},
  {cmd:'ls /bin | head', desc:'Lista binários reais instalados.', hint:'Funciona nas 3 VMs Linux.'},
  {cmd:'cat /etc/os-release', desc:'Prova qual distro real está rodando.', hint:'Vai mostrar Debian ou Alpine.'},
  {cmd:'python3 -c "print(2+2)"', desc:'Python real executando.', hint:'Debian WebVM já inclui python3.'},
  {cmd:'gcc --version', desc:'Compilador real.', hint:'Disponível no Debian WebVM.'},
  {cmd:'ping -c2 127.0.0.1', desc:'Rede local real (internet pode ser limitada no emulador).', hint:'Loopback sempre funciona.'},
];

const $ = s => document.querySelector(s);
const favs = new Set(JSON.parse(localStorage.getItem('nuvemos_favs')||'[]'));
let sysFilter='all', appFilter='all', query='';
let currentRealUrl = '';

function toast(m, ms){ const t=$('#toast'); t.textContent=m; t.hidden=false; clearTimeout(t._h); t._h=setTimeout(()=>t.hidden=true, ms||2600); }
function saveFavs(){ localStorage.setItem('nuvemos_favs', JSON.stringify([...favs])); }
function debounce(fn, ms){ let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>fn(...a), ms); }; }
function syncUrl(){ const p=new URLSearchParams(); if(query) p.set('q', query); if(sysFilter!=='all') p.set('sys', sysFilter); const cur=(document.getElementById('vmProfile')||{}).value; if(cur && cur!=='buildroot') p.set('vm', cur); history.replaceState(null,'','?'+p.toString()); }
function applyUrl(){ const p=new URLSearchParams(location.search); const q=p.get('q'); if(q){ query=q; const s=$('#globalSearch'); if(s) s.value=q; } const sys=p.get('sys'); if(sys) sysFilter=sys; const vm=p.get('vm'); if(vm){ const el=document.getElementById('vmProfile'); if(el) el.value=vm; } }

// ---- Lab + modal reais ----
let lastLabKey = '';
function labLoad(key, customUrl){
  const frame=$('#labFrame'), empty=$('#labEmpty'), load=$('#labLoading'), title=$('#labTitle');
  let url = customUrl || REAL[key]?.url;
  let name = customUrl || REAL[key]?.name || customUrl;
  if(!url){ toast('Motor não encontrado'); return; }
  currentRealUrl = url; lastLabKey = key||'custom';
  title.textContent = name;
  if(empty) empty.style.display='none'; if(load) load.hidden=false; frame.hidden=true;
  frame.removeAttribute('src'); frame.src=url;
  frame.onload=()=>{ if(load) load.hidden=true; frame.hidden=false; };
  setTimeout(()=>{ if(load && !load.hidden){ load.hidden=true; frame.hidden=false; } }, 12000);
  try{ localStorage.setItem('nuvemos_last_lab', lastLabKey); }catch(e){}
  syncUrl();
  document.getElementById('lab').scrollIntoView({behavior:'smooth'});
  toast('Boot real iniciado — aguarde 10-30s');
}
window.copyLabLink = ()=>{ const u=currentRealUrl||location.href; if(navigator.clipboard) navigator.clipboard.writeText(u).then(()=>toast('Link copiado!')).catch(()=>toast(u,4000)); else toast(u,4000); };
window.openReal = key => labLoad(key);
window.reloadLab = () => { const f=$('#labFrame'); if(currentRealUrl) f.src=currentRealUrl; };
window.openLabNewTab = () => { if(currentRealUrl) window.open(currentRealUrl,'_blank'); };
window.closeLab = () => { const f=$('#labFrame'); f.removeAttribute('src'); f.hidden=true; $('#labEmpty').style.display='block'; $('#labTitle').textContent='Nenhum sistema carregado'; currentRealUrl=''; };

function openRunner(key){
  const r = REAL[key];
  if(key==='guide'){ document.getElementById('servidor').scrollIntoView({behavior:'smooth'}); return; }
  if(key==='win11guide'){ ligarWindows11(); return; }
  if(!r) return;
  currentRealUrl = r.url;
  $('#runnerTitle').textContent = r.name;
  $('#runnerDesc').textContent = r.desc + ' Boot real: aguarde o carregamento.';
  const f=$('#runnerFrame'); f.removeAttribute('src'); f.src=r.url;
  $('#runnerModal').hidden=false;
}
window.openRunnerNewTab = () => { if(currentRealUrl) window.open(currentRealUrl,'_blank'); };
window.ligarWindows10 = ()=>{
  openRunner('reactos');
  toast('Ligando Windows-compatível real (ReactOS)… Win10 da Microsoft precisa do seu Docker — veja #win10vnc', 4500);
};
window.ligarWindows11 = ()=>{
  const v=$('#winVer'); if(v) v.value='11';
  genWin10();
  document.getElementById('win10vnc').scrollIntoView({behavior:'smooth'});
  toast('Comando Windows 11 gerado! Rode no seu Docker — download oficial da Microsoft', 4500);
};

// ---- catálogo ----
function systemCard(s){
  const f=favs.has(s.id)?'♥':'♡';
  const btn = (s.real==='guide' || s.real==='win11guide')
    ? (s.real==='win11guide'
      ? `<button class="btn primary" onclick="ligarWindows11()">⬇ Win11</button>`
      : `<button class="btn dark" onclick="document.getElementById('servidor').scrollIntoView({behavior:'smooth'})">📖 Guia</button>`)
    : `<button class="btn primary" onclick="openRunner('${s.real}')">▶ Abrir real</button>`;
  return `<article class="card" data-name="${s.name.toLowerCase()}">
    <div class="card-top"><div class="icon" style="background:${s.color}">${s.icon}</div>
    <div><h3>${s.name}</h3><div class="meta"><span>${s.base}</span><span>${s.ram}</span><span class="badge">${s.level||''}</span></div></div></div>
    <p>${s.desc}</p>
    <div class="card-actions">${btn}<button class="btn ghost" onclick="openInfo('${s.id}')">ℹ️</button><button class="btn fav" onclick="toggleFav('${s.id}')" title="Favoritar">${f}</button></div></article>`;
}
window.openInfo = id=>{
  const s=SYSTEMS.find(x=>x.id===id); if(!s) return;
  const r=REAL[s.real];
  $('#infoTitle').textContent=s.name;
  $('#infoBody').innerHTML=`<div class="meta"><span>${s.base}</span><span>${s.ram}</span><span>${s.disk||''}</span><span class="badge">${s.level||''}</span></div>
  <p>${s.desc}</p>
  <strong>Primeiros passos reais:</strong>
  ${(s.tips||[]).map(t=>`<code class="code">${t}</code>`).join('')}
  <div class="card-actions" style="margin-top:10px">${s.real==='win11guide'
    ? `<button class="btn primary" onclick="document.getElementById('infoModal').hidden=true;ligarWindows11()">⬇ Gerar Win11</button>
       <button class="btn ghost" onclick="window.open('https://www.microsoft.com/software-download/windows11','_blank')">Microsoft</button>`
    : s.real==='guide'
    ? `<button class="btn dark" onclick="document.getElementById('infoModal').hidden=true;document.getElementById('servidor').scrollIntoView({behavior:'smooth'})">📖 Abrir guia</button>`
    : `<button class="btn primary" onclick="document.getElementById('infoModal').hidden=true;openRunner('${s.real}')">▶ Abrir ${r?r.name:'real'}</button>
       <button class="btn ghost" onclick="copyText('${(s.tips||[''])[0].replace(/'/g,"\\'")}')">📋 Copiar 1º comando</button>`}</div>`;
  $('#infoModal').hidden=false;
};
window.copyText = t=>{ if(navigator.clipboard) navigator.clipboard.writeText(t).then(()=>toast('Copiado!')).catch(()=>toast(t,4000)); else toast(t,4000); };
window.dismissTour = ()=>{ try{localStorage.setItem('nuvemos_tour','1');}catch(e){} const b=$('#tourBanner'); if(b) b.hidden=true; };
function render(){
  const q=query.toLowerCase();
  const sys=SYSTEMS.filter(s=>(sysFilter==='all'||s.base===sysFilter||(sysFilter==='fav'&&favs.has(s.id)))&&(!q||(s.name+s.desc+s.base).toLowerCase().includes(q)));
  $('#systemsGrid').innerHTML=sys.length?sys.map(systemCard).join(''):'<p class="muted">Nada encontrado.</p>';
  $('#featuredGrid').innerHTML=SYSTEMS.slice(0,8).map(systemCard).join('');
  const apps=APPS.filter(a=>(appFilter==='all'||a.platform===appFilter||a.cat===appFilter)&&(!q||(a.name+a.desc).toLowerCase().includes(q)));
  $('#appsGrid').innerHTML=apps.map(a=>`<article class="card"><div class="card-top"><div class="icon" style="background:#0f172a">${a.icon}</div><div><h3>${a.name}</h3><div class="meta"><span>${a.platform}</span><span>${a.cat}</span></div></div></div><p>${a.desc}</p>${a.cmd?`<code class="code">${a.cmd}</code>`:''}<div class="card-actions"><button class="btn primary" onclick="openRunner('debian')">▶ Abrir Debian real</button></div></article>`).join('');
  const cmds=COMMANDS.filter(c=>!q||(c.cmd+c.desc).toLowerCase().includes(q));
  $('#cmdList').innerHTML=cmds.map(c=>`<div class="cmd"><code>${c.cmd}</code><p>${c.desc} <b>${c.hint}</b></p><button class="btn primary" onclick="copyCmd('${c.cmd.replace(/'/g,"\\'")}')">📋 Copiar + abrir Lab</button></div>`).join('');
  $('#labGrid').innerHTML=Object.entries(REAL).map(([k,v])=>`<article class="card"><h3>${v.name}</h3><p>${v.desc}</p><div class="card-actions"><button class="btn primary" onclick="openReal('${k}')">▶ Abrir real</button><button class="btn ghost" onclick="window.open('${v.url}','_blank')">↗</button></div></article>`).join('');
}
window.toggleFav=id=>{favs.has(id)?favs.delete(id):favs.add(id);saveFavs();render();};
window.copyCmd=cmd=>{navigator.clipboard?.writeText(cmd).then(()=>toast('Comando copiado! Cole dentro do Lab real')).catch(()=>toast(cmd)); labLoad('debian');};

// ---- VM integrada v86 (100% funcional, roda nesta página) ----
const V86_CDN = {
  lib: 'https://cdn.jsdelivr.net/npm/v86@latest/build/libv86.js',
  wasm: 'https://cdn.jsdelivr.net/npm/v86@latest/build/v86.wasm',
  bios: 'https://cdn.jsdelivr.net/npm/v86@latest/bios/seabios.bin',
  vga: 'https://cdn.jsdelivr.net/npm/v86@latest/bios/vgabios.bin',
  buildroot: 'https://i.copy.sh/linux.iso',
  kolibri: 'https://i.copy.sh/kolibri.img',
  freedos: 'https://i.copy.sh/freedos722.img',
};
let v86libPromise = null;
function v86LoadLib(){
  if(window.V86) return Promise.resolve();
  if(v86libPromise) return v86libPromise;
  v86libPromise = new Promise((res, rej)=>{
    const sc=document.createElement('script'); sc.src=V86_CDN.lib; sc.onload=res; sc.onerror=()=>rej(new Error('Falha ao baixar libv86.js'));
    document.head.appendChild(sc);
  });
  return v86libPromise;
}
function v86Progress(pct){ const w=document.getElementById('v86_progress'); const b=document.getElementById('v86_progress_bar'); if(!w||!b) return; if(pct==null){ w.hidden=true; b.style.width='0%'; return; } w.hidden=false; b.style.width=Math.max(2,Math.round(pct))+'%'; }
function v86SerialPrint(t){ const el=document.getElementById('v86_serial'); if(!el) return; el.textContent+=t; if(el.textContent.length>20000) el.textContent=el.textContent.slice(-20000); el.scrollTop=el.scrollHeight; }
function v86SetStatus(t){ const el=document.getElementById('v86_status'); if(el) el.textContent=t; }
window.v86Scale = v=>{ const c=document.querySelector('#v86_screen canvas'); const l=document.getElementById('vmScaleVal'); if(l) l.textContent=v+'%'; if(c) c.style.width=v+'%'; try{localStorage.setItem('nuvemos_scale',v);}catch(e){} };
window.v86SendKeys = kind=>{
  const e=window._v86; if(!e){toast('Ligue a VM primeiro');return;}
  if(kind==='ctrl-c') e.keyboard_send_scancodes([0x1D,0x2E]);
  else if(kind==='ctrl-d') e.serial0_send('\x04');
  else if(kind==='alt-tab') e.keyboard_send_scancodes([0x38,0x0F]);
  toast('Tecla enviada à VM');
};
window.v86PasteClipboard = async ()=>{
  if(!window._v86){toast('Ligue a VM primeiro');return;}
  try{ const t=await navigator.clipboard.readText(); if(!t){toast('Clipboard vazio');return;} window._v86.serial0_send(t); v86SerialPrint('› (colado '+t.length+' chars)\n'); toast('Texto enviado à VM'); }
  catch(e){ toast('Permita acesso ao clipboard e tente de novo',3500); }
};
function bumpStat(k, d){ try{ const v=(parseInt(localStorage.getItem('nuvemos_'+k)||'0',10)||0)+(d||1); localStorage.setItem('nuvemos_'+k,String(v)); renderStats(); }catch(e){} }
function renderStats(){ try{
  $('#statBoots').textContent=localStorage.getItem('nuvemos_boots')||'0';
  $('#statSnaps').textContent=localStorage.getItem('nuvemos_snaps')||'0';
  const m=Math.round((parseInt(localStorage.getItem('nuvemos_upsec')||'0',10)||0)/60);
  $('#statUp').textContent=(m>=60?Math.floor(m/60)+'h'+(m%60)+'min':m+'min');
}catch(e){} }
window.v86Mute = ()=>{ const e=window._v86; if(!e){toast('Ligue a VM primeiro');return;} window._v86_muted=!window._v86_muted; try{ e.set_volume ? e.set_volume(window._v86_muted?0:1) : e.mute && e.mute(window._v86_muted); }catch(err){} const b=document.getElementById('vmMuteBtn'); if(b) b.textContent=window._v86_muted?'🔇 Mudo':'🔊 Som'; };
window.v86ClearSerial = ()=>{ const el=document.getElementById('v86_serial'); if(el) el.textContent=''; };
window.v86Boot = async ()=>{
  const btn=document.getElementById('vmStart');
  try{
    v86SetStatus('Baixando emulador (libv86 ~360KB + BIOS + imagem)…');
    btn.disabled=true;
    await v86LoadLib();
    if(window._v86){ try{window._v86.stop();}catch(e){} window._v86=null; }
    document.getElementById('v86_screen').innerHTML='';
    document.getElementById('v86_serial').textContent='';
    const profile=document.getElementById('vmProfile').value;
    const mem=(parseInt(document.getElementById('vmMem').value,10)||128)*1024*1024;
    const base={ wasm_path:V86_CDN.wasm, memory_size:mem, vga_memory_size:8*1024*1024,
      screen_container:document.getElementById('v86_screen_container'),
      bios:{url:V86_CDN.bios}, vga_bios:{url:V86_CDN.vga}, autostart:true };
    if(profile==='buildroot'){ base.cdrom={url:V86_CDN.buildroot,async:true}; }
    else if(profile==='kolibri'){ base.fda={url:V86_CDN.kolibri,async:true}; }
    else { base.fda={url:V86_CDN.freedos,async:true}; }
    v86SetStatus('Iniciando '+profile+' real… aguarde o boot.');
    window._bootT0=Date.now();
    v86Progress(8);
    const emu = window._v86 = new window.V86(base);
    window._v86_running=true; document.getElementById('vmPause').disabled=false; document.getElementById('vmPause').textContent='Pausar';
    const t0=Date.now();
    clearInterval(window._v86_timer);
    window._v86_timer=setInterval(()=>{ const s=Math.floor((Date.now()-t0)/1000); const t=document.getElementById('v86_time'); if(t&&window._v86_running)t.textContent=s+'s ligado'; },1000);
    emu.add_listener('serial0-output-byte', b=>{ v86SerialPrint(String.fromCharCode(b)); });
    emu.add_listener('download-progress', e=>{ if(e&&e.total){ const p=e.loaded/e.total*100; v86Progress(p); v86SetStatus(`Baixando imagem real… ${Math.round(p)}%`); } });
    emu.add_listener('emulator-ready', ()=>{ v86Progress(null); v86SetStatus(profile+' real rodando. Clique na tela para usar o teclado.'); window._bootMs=Date.now()-(window._bootT0||Date.now()); bumpStat('boots',1); try{ const sv=localStorage.getItem('nuvemos_scale'); if(sv) window.v86Scale(sv); }catch(e){} try{localStorage.setItem('nuvemos_last_vm',profile);}catch(e){} syncUrl(); toast('VM real ligada em '+Math.round((window._bootMs||0)/100)/10+'s!'); });
    emu.add_listener('screen-set-mode', m=>{});
    if(emu.get_statistics){ setInterval(async()=>{ try{ const st=await emu.get_statistics(); const el=document.getElementById('v86_speed'); if(el&&st&&st.cpu) el.textContent=Math.round(st.cpu.mips||0)+' mIPS'; }catch(e){} },2000); }
  }catch(err){ v86SetStatus('Erro: '+err.message+'. Use o Lab externo abaixo como alternativa.'); toast('Falha na VM integrada — tente o Lab externo'); }
  finally{ btn.disabled=false; }
};
window.v86Pause = ()=>{ const e=window._v86; if(!e) return; if(window._v86_running){ e.stop(); window._v86_running=false; document.getElementById('vmPause').textContent='Continuar'; v86SetStatus('Pausada.'); } else { e.run(); window._v86_running=true; document.getElementById('vmPause').textContent='Pausar'; v86SetStatus('Rodando.'); } };
window.v86Reset = ()=>{ if(window._v86){ window._v86.restart(); window._v86_running=true; v86SetStatus('Reiniciada — boot real novamente.'); } };
window.v86Stop = ()=>{ if(window._v86){ try{window._v86.stop();}catch(e){} window._v86=null; } window._v86_running=false; document.getElementById('vmPause').disabled=true; document.getElementById('v86_screen').innerHTML=''; v86SetStatus('Desligada.'); clearInterval(window._v86_timer); };
window.v86CtrlAltDel = ()=>{ if(window._v86) window._v86.keyboard_send_scancodes([0x1D,0x38,0x53]); };
window.v86Fullscreen = ()=>{ const el=document.getElementById('v86_screen_container'); if(el.requestFullscreen) el.requestFullscreen(); };
window.v86Screenshot = ()=>{ try{ const c=document.querySelector('#v86_screen_container canvas'); if(!c){toast('Sem tela para capturar');return;} const a=document.createElement('a'); a.download='v86-screenshot.png'; a.href=c.toDataURL('image/png'); a.click(); toast('Screenshot baixado'); }catch(e){ toast('Falha no screenshot'); } };
window.v86Save = async ()=>{ if(!window._v86){toast('Ligue a VM primeiro');return;} const s=await window._v86.save_state(); const n='v86-'+(document.getElementById('vmProfile').value||'vm')+'-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.bin'; const a=document.createElement('a'); a.download=n; a.href=URL.createObjectURL(new Blob([s])); a.click(); bumpStat('snaps',1); toast('Snapshot salvo: '+n); };
window.v86RestoreFile = input=>{ const f=input.files[0]; if(!f||!window._v86) return; const r=new FileReader(); window._v86.stop(); r.onload=async e=>{ await window._v86.restore_state(e.target.result); window._v86.run(); window._v86_running=true; v86SetStatus('Estado restaurado.'); }; r.readAsArrayBuffer(f); input.value=''; };

// ---- Paleta de comandos (Ctrl+K) ----
const PAL_ACTIONS = [
  {t:'Ligar Buildroot (rápido)', run:()=>{document.getElementById('vmProfile').value='buildroot';document.getElementById('maquina').scrollIntoView({behavior:'smooth'});v86Boot();}},
  {t:'Ligar KolibriOS (gráfico)', run:()=>{document.getElementById('vmProfile').value='kolibri';document.getElementById('maquina').scrollIntoView({behavior:'smooth'});v86Boot();}},
  {t:'Ligar FreeDOS', run:()=>{document.getElementById('vmProfile').value='freedos';document.getElementById('maquina').scrollIntoView({behavior:'smooth'});v86Boot();}},
  {t:'Abrir Debian WebVM', run:()=>openReal('debian')},
  {t:'Abrir Alpine JSLinux', run:()=>openReal('alpine')},
  {t:'Abrir ReactOS', run:()=>openReal('reactos')},
  {t:'Ligar Windows 10 (compatível real)', run:()=>ligarWindows10()},
  {t:'Adicionar Windows 11 (gerar Docker)', run:()=>ligarWindows11()},
  {t:'Baixar Windows 11 oficial (Microsoft)', run:()=>window.open('https://www.microsoft.com/software-download/windows11','_blank')},
  {t:'Abrir Windows 95 real', run:()=>openReal('win95')},
  {t:'Abrir Windows 98 real', run:()=>openReal('win98')},
  {t:'Abrir Windows 2000 real', run:()=>openReal('win2k')},
  {t:'Abrir guia Win10 + VNC Viewer', run:()=>document.getElementById('win10vnc').scrollIntoView({behavior:'smooth'})},
  {t:'Gerar comando Windows 10 Docker', run:()=>{document.getElementById('win10vnc').scrollIntoView({behavior:'smooth'});genWin10();}},
  {t:'Alternar tema claro/escuro', run:()=>document.getElementById('themeBtn').click()},
  {t:'Ir para Máquina', run:()=>document.getElementById('maquina').scrollIntoView({behavior:'smooth'})},
  {t:'Ir para Servidor', run:()=>document.getElementById('servidor').scrollIntoView({behavior:'smooth'})},
  {t:'Copiar comando: uname -a', run:()=>copyText('uname -a')},
  {t:'Copiar comando: ls /bin | head', run:()=>copyText('ls /bin | head')},
];
let palSel = 0;
function palFilter(q){ q=(q||'').toLowerCase(); const items=[...PAL_ACTIONS.map(a=>({t:a.t,run:a.run})),...SYSTEMS.map(s=>({t:'Sistema: '+s.name,run:()=>openInfo(s.id)})),...COMMANDS.map(c=>({t:'Comando: '+c.cmd,run:()=>copyText(c.cmd)}))]; return items.filter(i=>i.t.toLowerCase().includes(q)).slice(0,12); }
function palRender(){ const q=$('#paletteInput').value; const list=palFilter(q); palSel=0; $('#paletteList').innerHTML=list.map((i,x)=>`<div class="pal-item${x===0?' sel':''}" data-i="${x}">${i.t}</div>`).join('')||'<p class="muted">Nada encontrado.</p>'; $('#paletteList').querySelectorAll('.pal-item').forEach(el=>el.onclick=()=>{ list[+el.dataset.i].run(); closePal(); }); window._palList=list; }
function openPal(){ $('#palette').hidden=false; $('#paletteInput').value=''; palRender(); setTimeout(()=>$('#paletteInput').focus(),50); }
function closePal(){ $('#palette').hidden=true; }
window.genCompose = ()=>{ const img=$('#genImg').value; const port=$('#genPort').value||3000; const p1=img.includes('ttyd')?'7681:7681':port+':3000'; $('#genOut').textContent=`docker run -d --name nuvemos -p ${p1} ${img}`; };
window.copyGen = ()=>copyText($('#genOut').textContent);
// ---- PC virtual Windows 10 para VNC Viewer ----
window.genWin10 = ()=>{
  const ver=($('#winVer')||{}).value||'10';
  const ram=($('#winRam')||{}).value||'4G';
  const cpu=($('#winCpu')||{}).value||'2';
  const vnc=($('#winVnc')||{}).value||5900;
  const web=($('#winWeb')||{}).value||8006;
  const vmap={ '10':'10', '10l':'10l', '11':'11', 'tiny11':'tiny11' };
  $('#winOut').textContent=`docker run -d --name win10 --device=/dev/kvm --cap-add NET_ADMIN -p ${web}:8006 -p ${vnc}:5900 -e VERSION="${vmap[ver]||'10'}" -e RAM_SIZE="${ram}" -e CPU_CORES="${cpu}" dockur/windows`;
  toast('Comando Windows 10 gerado!');
};
window.copyWin10 = ()=>copyText($('#winOut').textContent);
function vncTarget(){ const h=($('#vncHost').value||'').trim()||'SEU-IP'; const p=$('#vncPort').value||5900; return {h, p, s:`${h}:${p}`}; }
window.copyVnc = ()=>{ const t=vncTarget().s; $('#vncOut').textContent=t; copyText(t); };
window.vncAppConnect = ()=>{
  const t=vncTarget(); $('#vncOut').textContent=t.s;
  copyText(t.s);
  toast('Abra o RealVNC Viewer e conecte em '+t.s, 3500);
  window.open('vnc://'+t.s, '_blank');
};
window.vncWebConnect = ()=>{
  const t=vncTarget(); $('#vncOut').textContent=t.s;
  const host=t.h==='SEU-IP'?'':`&host=${encodeURIComponent(t.h)}`;
  window.open(`https://novnc.com/noVNC/vnc.html?port=${encodeURIComponent(t.p)}${host}&autoconnect=true`, '_blank');
  toast('Abrindo cliente Web VNC — aponte para seu websockify', 3500);
};

document.addEventListener('DOMContentLoaded',()=>{
  try{ if(localStorage.getItem('nuvemos_theme')==='dark'){ document.body.classList.add('dark'); const tb=document.getElementById('themeBtn'); if(tb) tb.textContent='☀️'; } }catch(e){}
  applyUrl();
  render();
  document.querySelectorAll('[data-sys]').forEach(b=>b.classList.toggle('active', b.dataset.sys===sysFilter));
  document.querySelectorAll('[data-sys]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-sys]').forEach(x=>x.classList.remove('active'));b.classList.add('active');sysFilter=b.dataset.sys;render();});
  document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-app]').forEach(x=>x.classList.remove('active'));b.classList.add('active');appFilter=b.dataset.app;render();});
  const s=$('#globalSearch');
  const debounced=debounce(e=>{query=e.target.value;render();syncUrl();},160);
  s.addEventListener('input',debounced);
  s.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.target.value=''; query=''; render(); e.target.blur(); } });
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); $('#palette').hidden?openPal():closePal(); }
    else if(e.key==='Escape'){ closePal(); $('#runnerModal').hidden=true; $('#infoModal').hidden=true; }
  });
  const pi=$('#paletteInput');
  pi.addEventListener('input', palRender);
  pi.addEventListener('keydown', e=>{
    const list=window._palList||[];
    if(e.key==='ArrowDown'){ e.preventDefault(); palSel=Math.min(list.length-1,palSel+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); palSel=Math.max(0,palSel-1); }
    else if(e.key==='Enter'){ e.preventDefault(); if(list[palSel]){ list[palSel].run(); closePal(); } return; }
    else return;
    $('#paletteList').querySelectorAll('.pal-item').forEach((el,x)=>el.classList.toggle('sel',x===palSel));
  });
  $('#palette').addEventListener('click',e=>{ if(e.target.id==='palette') closePal(); });
  $('#infoClose').onclick=()=>$('#infoModal').hidden=true;
  $('#infoModal').addEventListener('click',e=>{ if(e.target.id==='infoModal') e.target.hidden=true; });
  $('#runnerClose').onclick=()=>{ $('#runnerModal').hidden=true; $('#runnerFrame').removeAttribute('src'); };
  $('#runnerModal').addEventListener('click',e=>{if(e.target.id==='runnerModal'){e.target.hidden=true;$('#runnerFrame').removeAttribute('src');}});
  $('#menuBtn').onclick=()=>$('#mainNav').classList.toggle('open');
  $('#themeBtn').onclick=e=>{const d=document.body.classList.toggle('dark');e.target.textContent=d?'☀️':'🌙';try{localStorage.setItem('nuvemos_theme',d?'dark':'light');}catch(err){}};
  const dot=$('#netDot'); const upd=()=>{ if(dot) dot.classList.toggle('off', !navigator.onLine); }; upd(); window.addEventListener('online',()=>{upd();toast('Rede de volta!');}); window.addEventListener('offline',()=>{upd();toast('Sem rede — a VM integrada já baixada continua funcionando',3500);});
  window.addEventListener('scroll',()=>{ const b=$('#topBtn'); if(b) b.hidden=(scrollY<600); },{passive:true});
  $('#newsForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#newsEmail').value.trim();if(!v)return;const list=JSON.parse(localStorage.getItem('nuvemos_news')||'[]');list.push({email:v,at:new Date().toISOString()});localStorage.setItem('nuvemos_news',JSON.stringify(list));$('#newsEmail').value='';toast('Inscrição salva localmente!');});
  $('#backendForm').addEventListener('submit',e=>{e.preventDefault();const u=$('#backendUrl').value.trim();if(!u)return;labLoad(null,u);});
  const sf=$('#v86_serial_form'); if(sf) sf.addEventListener('submit',e=>{e.preventDefault();const i=$('#v86_serial_in'); if(window._v86&&i.value){window._v86.serial0_send(i.value+'\n'); v86SerialPrint('› '+i.value+'\n'); window._hist=window._hist||[]; window._hist.push(i.value); window._hi=window._hist.length; i.value='';} else toast('Ligue a VM integrada primeiro');});
  const si=$('#v86_serial_in'); if(si) si.addEventListener('keydown',e=>{ const h=window._hist||[]; if(e.key==='ArrowUp'){ e.preventDefault(); if(h.length){ window._hi=Math.max(0,(window._hi??h.length)-1); si.value=h[window._hi]||''; } } if(e.key==='ArrowDown'){ e.preventDefault(); if(h.length){ window._hi=Math.min(h.length,(window._hi??h.length)+1); si.value=h[window._hi]||''; } } });
  try{ if(!localStorage.getItem('nuvemos_tour')) $('#tourBanner').hidden=false; }catch(e){ $('#tourBanner').hidden=false; }
  renderStats(); window.genCompose();
  setInterval(()=>{ if(window._v86_running){ try{ const v=(parseInt(localStorage.getItem('nuvemos_upsec')||'0',10)||0)+5; localStorage.setItem('nuvemos_upsec',String(v)); renderStats(); }catch(e){} } },5000);
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
  window.addEventListener('error',e=>{ if(e&&e.message) toast('Erro: '+e.message, 4000); });
});
