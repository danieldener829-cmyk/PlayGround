/* SAMP 3D — Grove Street | espelho WebGL do nucleo C++ (src/)
   Mesma logica: World grade 5x5, Player, Vehicle arcade, Wanted 0-5, Traffic.
   Controles: PC WASD+mouse | Celular joystick+touch. */
(function(){
'use strict';
if(!window.THREE){document.getElementById('mission-text').textContent='Erro: Three.js CDN bloqueado. Recarregue com internet.';return;}

// ---------- utils ----------
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const TAU=Math.PI*2;
function angLerp(a,b,t){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return a+d*clamp(t,0,1);}

// ---------- config mundo (igual C++) ----------
const BLOCK=40,ROAD=10,PITCH=BLOCK+ROAD,NB=5;
const TOTAL=PITCH*NB+ROAD, OX=-TOTAL/2, OZ=-TOTAL/2;
const roadX=[],roadZ=[];
for(let i=0;i<=NB;i++){roadX.push(OX+ROAD/2+i*PITCH);roadZ.push(OZ+ROAD/2+i*PITCH);}
const colliders=[]; // {x,z,hw,hd}

// ---------- estado ----------
const S={
  started:false, quality:'high', nick:'CJ_Brasil',
  camYaw:2.4, camPitch:0.32, lastCamDrag:-99, time:0,
  money:250, health:100, armor:0, heat:0, stars:0,
  timeH:12, dead:false, busted:false, mission:{active:false,stage:0,reward:0},
  inVehicle:false, vehIndex:-1, shootCd:0, pickupT:0, chatOpen:false,
  engineOn:false, sirenT:0
};

// ---------- audio (motor + tiro procedurais) ----------
let AC=null, engOsc=null, engGain=null;
function audioInit(){try{if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function engineSound(speed){try{
  if(!AC)return;
  if(!engOsc){engOsc=AC.createOscillator();engGain=AC.createGain();engOsc.type='sawtooth';engOsc.frequency.value=60;engGain.gain.value=0;engOsc.connect(engGain);engGain.connect(AC.destination);engOsc.start();}
  const target=S.inVehicle?0.05+Math.min(0.08,Math.abs(speed)*0.002):0;
  engGain.gain.value=lerp(engGain.gain.value,target,0.1);
  if(engOsc)engOsc.frequency.value=55+Math.abs(speed||0)*4;
}catch(e){}}
function beep(f,dur,type){try{if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.value=f;g.gain.value=0.12;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+dur);o.stop(AC.currentTime+dur);}catch(e){}}
const sfxShoot=()=>beep(900,0.09,'sawtooth');
const sfxPickup=()=>{beep(660,0.12);setTimeout(()=>beep(990,0.15),110);};
const sfxCash=()=>{beep(880,0.1);setTimeout(()=>beep(1320,0.2),100);};
const sfxHit=()=>beep(140,0.2,'sawtooth');

// ---------- three setup ----------
const container=document.getElementById('game-container');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);
scene.fog=new THREE.Fog(0x87ceeb,120,420);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xbfe3ff,0x3a5f3a,0.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,0.95);
sun.position.set(80,120,40);sun.castShadow=true;
sun.shadow.camera.left=-160;sun.shadow.camera.right=160;sun.shadow.camera.top=160;sun.shadow.camera.bottom=-160;
sun.shadow.mapSize.set(1024,1024);scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff,0.15));

// ---------- texturas canvas ----------
function buildingTexture(base,win){
  const c=document.createElement('canvas');c.width=128;c.height=128;
  const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,128,128);
  g.fillStyle=win;
  for(let y=8;y<128;y+=18)for(let x=8;x<128;x+=18)g.fillRect(x,y,10,12);
  const t=new THREE.CanvasTexture(c);return t;
}
function textSprite(text,bg){
  const c=document.createElement('canvas');c.width=256;c.height=64;
  const g=c.getContext('2d');g.fillStyle=bg||'rgba(0,0,0,0.55)';
  g.fillRect(0,8,256,48);g.fillStyle='#fff';g.font='bold 26px Arial';g.textAlign='center';g.fillText(text,128,42);
  const t=new THREE.CanvasTexture(c);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));s.scale.set(4,1,1);return s;
}

// ---------- cidade ----------
const collidersRef=colliders;
(function buildCity(){
  // chao grama
  const groundMat=new THREE.MeshLambertMaterial({color:0x4a8f3c});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(TOTAL+220, TOTAL+260),groundMat);
  ground.rotation.x=-Math.PI/2;ground.position.set(0,0,10);ground.receiveShadow=true;scene.add(ground);
  // asfalto das ruas
  const roadMat=new THREE.MeshLambertMaterial({color:0x2b2b2e});
  const roadMat2=new THREE.MeshLambertMaterial({color:0x3a3a3e});
  for(const rx of roadX){
    const r=new THREE.Mesh(new THREE.PlaneGeometry(ROAD,TOTAL+40),roadMat);
    r.rotation.x=-Math.PI/2;r.position.set(rx,0.02,10);r.receiveShadow=true;scene.add(r);
    // faixas amarelas
    for(let z=OZ-10;z<OZ+TOTAL+10;z+=8){
      const s=new THREE.Mesh(new THREE.PlaneGeometry(0.4,3),new THREE.MeshBasicMaterial({color:0xffd23d}));
      s.rotation.x=-Math.PI/2;s.position.set(rx,0.04,z);scene.add(s);
    }
  }
  for(const rz of roadZ){
    const r=new THREE.Mesh(new THREE.PlaneGeometry(TOTAL+40,ROAD),roadMat2);
    r.rotation.x=-Math.PI/2;r.position.set(0,0.03,rz);r.receiveShadow=true;scene.add(r);
  }
  // calcadas (quarteiroes)
  const sideMat=new THREE.MeshLambertMaterial({color:0x9a9a9a});
  // praca central
  const park=new THREE.Mesh(new THREE.PlaneGeometry(BLOCK,BLOCK),new THREE.MeshLambertMaterial({color:0x3f9e4d}));
  park.rotation.x=-Math.PI/2;park.position.set(OX+ROAD+2*PITCH+BLOCK/2,0.05,OZ+ROAD+2*PITCH+BLOCK/2);park.receiveShadow=true;scene.add(park);
  const fountain=new THREE.Mesh(new THREE.CylinderGeometry(5,6,2,16),new THREE.MeshLambertMaterial({color:0x9fd8ff}));
  fountain.position.set(park.position.x,1,park.position.z);fountain.castShadow=true;scene.add(fountain);

  // predios
  const palette=['#c9a06a','#b0b7c3','#8fa3bf','#d18f8f','#a8b89a','#e0d3a3'];
  let seed=12345;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return (seed%10000)/10000;};
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  for(let bx=0;bx<NB;bx++)for(let bz=0;bz<NB;bz++){
    const qx=OX+ROAD+bx*PITCH, qz=OZ+ROAD+bz*PITCH;
    if(bx===2&&bz===2)continue;
    if(bz===NB-1&&(bx===1||bx===2))continue; // praia
    // base calcada
    const sb=new THREE.Mesh(new THREE.PlaneGeometry(BLOCK,BLOCK),sideMat);
    sb.rotation.x=-Math.PI/2;sb.position.set(qx+BLOCK/2,0.04,qz+BLOCK/2);sb.receiveShadow=true;scene.add(sb);
    for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++){
      const px=qx+BLOCK*(0.25+0.5*ix), pz=qz+BLOCK*(0.25+0.5*iz);
      const h=8+rnd()*26, w=10+rnd()*8, d=10+rnd()*8;
      const ci=Math.floor(rnd()*6);
      const tex=buildingTexture(palette[ci],'#1c2b3a');
      const m=new THREE.Mesh(boxGeo,new THREE.MeshLambertMaterial({map:tex}));
      m.scale.set(w,h,d);m.position.set(px,h/2,pz);m.castShadow=true;m.receiveShadow=true;scene.add(m);
      // topo
      const roof=new THREE.Mesh(boxGeo,new THREE.MeshLambertMaterial({color:0x444444}));
      roof.scale.set(w+0.6,0.6,d+0.6);roof.position.set(px,h+0.3,pz);scene.add(roof);
      colliders.push({x:px,z:pz,hw:w/2,hd:d/2});
    }
  }
  // praia + mar ao sul
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(TOTAL+220,60),new THREE.MeshLambertMaterial({color:0xe8d79a}));
  sand.rotation.x=-Math.PI/2;sand.position.set(0,0.03,OZ+TOTAL+22);sand.receiveShadow=true;scene.add(sand);
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(TOTAL+600,300),new THREE.MeshLambertMaterial({color:0x1e6fbf,transparent:true,opacity:0.92}));
  sea.rotation.x=-Math.PI/2;sea.position.set(0,0.02,OZ+TOTAL+200);sea.name='sea';scene.add(sea);
  // palmeiras
  const trunkMat=new THREE.MeshLambertMaterial({color:0x7a5230});
  const leafMat=new THREE.MeshLambertMaterial({color:0x2e9e44});
  for(let i=0;i<50;i++){
    const x=rand(OX-40,OX+TOTAL+40);
    const z=(i%2===0)?rand(OZ+TOTAL+2,OZ+TOTAL+40):rand(OZ-10,OZ+TOTAL);
    if(Math.abs(x-roadX[0])<8)continue;
    const t=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,7,6),trunkMat);
    trunk.position.y=3.5;trunk.castShadow=true;t.add(trunk);
    for(let k=0;k<5;k++){
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(1.4,3.4,5),leafMat);
      leaf.position.y=7.2;leaf.rotation.z=Math.PI/2.4;leaf.rotation.y=k/5*TAU;leaf.position.x=Math.cos(k/5*TAU)*1.2;leaf.position.z=Math.sin(k/5*TAU)*1.2;leaf.castShadow=true;t.add(leaf);
    }
    t.position.set(x,0,z);scene.add(t);
  }
  // postes
  const poleMat=new THREE.MeshLambertMaterial({color:0x333333});
  const lampMat=new THREE.MeshBasicMaterial({color:0xfff2b0});
  window._lamps=[];
  for(const rx of roadX)for(const rz of roadZ){
    if(Math.random()<0.4)continue;
    if(rx===roadX[2]&&rz===roadZ[2])continue; // sem poste no spawn
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,9,6),poleMat);
    p.position.set(rx+7,4.5,rz+7);p.castShadow=true;scene.add(p);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.5,8,8),lampMat);
    lamp.position.set(p.position.x,9.1,p.position.z);scene.add(lamp);window._lamps.push(lamp);
  }
})();

// ---------- personagem low-poly ----------
function makeHuman(shirt,pants,skin){
  const g=new THREE.Group();
  const mSkin=new THREE.MeshLambertMaterial({color:skin||0x8d5524});
  const mShirt=new THREE.MeshLambertMaterial({color:shirt||0x2e9e44});
  const mPants=new THREE.MeshLambertMaterial({color:pants||0x3b3b6e});
  const legs=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.4),mPants);legs.position.y=0.45;legs.castShadow=true;g.add(legs);g.userData.legs=legs;
  const torso=new THREE.Mesh(new THREE.BoxGeometry(0.85,1.0,0.5),mShirt);torso.position.y=1.4;torso.castShadow=true;g.add(torso);g.userData.torso=torso;
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.55,0.55),mSkin);head.position.y=2.2;head.castShadow=true;g.add(head);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.18,0.6),new THREE.MeshLambertMaterial({color:0x1a1a1a}));cap.position.y=2.52;g.add(cap);
  const armL=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.9,0.25),mShirt);armL.position.set(-0.6,1.4,0);g.add(armL);
  const armR=armL.clone();armR.position.x=0.6;g.add(armR);g.userData.armL=armL;g.userData.armR=armR;
  return g;
}

// ---------- carros ----------
const carColors=[0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0x8e44ad,0xecf0f1,0xe67e22,0x1abc9c];
function makeCar(color,isPolice){
  const g=new THREE.Group();
  const bodyMat=new THREE.MeshLambertMaterial({color:isPolice?0x1a3fa0:color});
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.8,4.4),bodyMat);body.position.y=0.75;body.castShadow=true;g.add(body);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.7,2.2),new THREE.MeshLambertMaterial({color:isPolice?0xdfe9ff:0x222831}));
  cab.position.set(0,1.45,-0.2);cab.castShadow=true;g.add(cab);
  if(isPolice){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.12,0.25,4.42),new THREE.MeshBasicMaterial({color:0xffffff}));
    stripe.position.y=0.85;g.add(stripe);
    const siren=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.25,0.5),new THREE.MeshBasicMaterial({color:0xff0000}));
    siren.position.set(0,1.95,-0.2);siren.name='siren';g.add(siren);g.userData.siren=siren;
  }
  const wg=new THREE.CylinderGeometry(0.42,0.42,0.35,12);
  const wm=new THREE.MeshLambertMaterial({color:0x111111});
  g.userData.wheels=[];
  [[-1.05,1.45],[1.05,1.45],[-1.05,-1.45],[1.05,-1.45]].forEach(p=>{
    const w=new THREE.Mesh(wg,wm);w.rotation.z=Math.PI/2;w.position.set(p[0],0.42,p[1]);g.add(w);g.userData.wheels.push(w);
  });
  // farois
  const hl=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.25,0.1),new THREE.MeshBasicMaterial({color:0xfff6b0}));
  hl.position.set(0,0.85,2.21);g.add(hl);
  return g;
}

// player
const playerMesh=makeHuman(0x2e9e44,0x3b3b6e,0x8d5524);
const nickTag=textSprite(S.nick,'rgba(0,0,0,0.5)');nickTag.position.y=3.1;playerMesh.add(nickTag);
scene.add(playerMesh);
const P={pos:new THREE.Vector3(roadX[2]+4,0,roadZ[2]+4),heading:0,vel:new THREE.Vector3(),vy:0,onGround:true,speed:0};

// veiculos
const vehicles=[];
const carSpots=[[roadX[1]+2,roadZ[1]],[roadX[3]-2,roadZ[2]],[roadX[2]+2,roadZ[3]],[roadX[4]-2,roadZ[1]],[roadX[0]+2,roadZ[4]],[roadX[2]-2,roadZ[0]],[roadX[3]+2,roadZ[4]],[roadX[1]-2,roadZ[3]]];
const carNames=['Sedan','Taxi','Lowrider','SUV',' conversível','Muscle','Van','Hatch'];
carSpots.forEach((s,i)=>{
  const isTaxi=i===1;
  const mesh=makeCar(isTaxi?0xf1c40f:carColors[i%carColors.length],false);
  mesh.position.set(s[0],0,s[1]);mesh.rotation.y=(i%2?0:Math.PI);scene.add(mesh);
  vehicles.push({mesh,pos:mesh.position,heading:mesh.rotation.y,speed:0,maxSpeed:isTaxi?30:26+Math.random()*8,occupied:false,destroyed:false,traffic:false,name:isTaxi?'Taxi':carNames[i%carNames.length],wheels:mesh.userData.wheels});
});
// 2 transito + 2 policia
for(let i=0;i<2;i++){
  const mesh=makeCar(0x777777,false);mesh.position.set(roadX[i],0,roadZ[4-i]);scene.add(mesh);
  vehicles.push({mesh,pos:mesh.position,heading:i?Math.PI:0,speed:0,maxSpeed:20,occupied:false,destroyed:false,traffic:true,name:'Trânsito',wheels:mesh.userData.wheels,axis:0,dir:i? -1:1});
}
const cops=[];
for(let i=0;i<2;i++){
  const mesh=makeCar(0xffffff,true);mesh.position.set(roadX[0]-4,0,roadZ[0]+i*10);scene.add(mesh);
  const v={mesh,pos:mesh.position,heading:0,speed:0,maxSpeed:32,occupied:false,destroyed:false,traffic:false,police:true,name:'Polícia',wheels:mesh.userData.wheels};
  vehicles.push(v);cops.push(v);
}

// pedestres
const peds=[];
const pedNames=['Big_Smoke','Ryder_BK','Sweet_G','Denise_07','Kendl_LS','OG_Loc','Cesar_VP','Pulaski_LSPD','Tenpenny','WuZi_Mu','Helena_BR','Cat_BR'];
for(let i=0;i<12;i++){
  const mesh=makeHuman([0xc0392b,0x2980b9,0xf39c12,0x8e44ad,0xecf0f1][i%5],0x222222,[0x8d5524,0xffdbac,0x5c3a21][i%3]);
  const tag=textSprite(pedNames[i]+' ('+(10+i)+')','rgba(0,60,120,0.55)');tag.position.y=3.0;mesh.add(tag);
  const x=rand(OX+10,OX+TOTAL-10),z=rand(OZ+10,OZ+TOTAL-10);
  mesh.position.set(x,0,z);scene.add(mesh);
  peds.push({mesh,pos:mesh.position,heading:rand(0,TAU),speed:1.5+Math.random(),alive:true,name:pedNames[i],target:new THREE.Vector3(rand(OX,OX+TOTAL),0,rand(OZ,OZ+TOTAL)),isCop:false,retarget:0,walkT:rand(0,9)});
}
// 2 policiais a pe
for(let i=0;i<2;i++){
  const mesh=makeHuman(0x1a3fa0,0x111111,0xffdbac);
  const tag=textSprite('LSPD_'+i,'rgba(150,0,0,0.6)');tag.position.y=3.0;mesh.add(tag);
  mesh.position.set(roadX[0]+i*4,0,roadZ[0]+8);scene.add(mesh);
  peds.push({mesh,pos:mesh.position,heading:0,speed:3.2,alive:true,name:'LSPD',target:new THREE.Vector3(),isCop:true,retarget:0,walkT:0});
}

// pickups + missao
const pickups=[];
function addPickup(type,x,z,color,emoji){
  const grp=new THREE.Group();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,0.25,16),new THREE.MeshLambertMaterial({color,emissive:color,emissiveIntensity:0.35}));
  m.position.y=0.4;grp.add(m);
  const tag=textSprite(emoji,'rgba(0,0,0,0.55)');tag.position.y=2.2;tag.scale.set(2.4,0.6,1);grp.add(tag);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,14,8,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.28,side:THREE.DoubleSide}));
  beam.position.y=7;grp.add(beam);
  grp.position.set(x,0,z);scene.add(grp);
  pickups.push({mesh:grp,type,pos:grp.position,taken:false,respawn:0});
}
addPickup('health',roadX[2]+6,roadZ[1]+4,0xe74c3c,'❤ VIDA');
addPickup('armor',roadX[3]-6,roadZ[3]-4,0x3498db,'🛡 COLETE');
addPickup('bribe',roadX[1]+4,roadZ[4]+2,0xf1c40f,'⭐ SUBORNO');
addPickup('money',roadX[4]+3,roadZ[2]-5,0x2ecc71,'$ GRANA');
addPickup('mission',roadX[2],roadZ[0]+6,0xf1c40f,'$ ENTREGA');
// destino da entrega
const destMarker=new THREE.Group();
const dm=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.3,20),new THREE.MeshBasicMaterial({color:0xf1c40f,transparent:true,opacity:0.8}));
dm.position.y=0.3;destMarker.add(dm);
const beam2=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,30,10,1,true),new THREE.MeshBasicMaterial({color:0xf1c40f,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
beam2.position.y=15;destMarker.add(beam2);
destMarker.position.set(roadX[4],0,roadZ[4]);destMarker.visible=false;scene.add(destMarker);

// ---------- HUD ----------
const $=id=>document.getElementById(id);
const chatLines=$('chat-lines');
function addChat(t,color){const d=document.createElement('div');if(color)d.style.color=color;d.textContent=t;chatLines.appendChild(d);while(chatLines.children.length>7)chatLines.removeChild(chatLines.firstChild);}
function feed(t){const k=$('killfeed');const d=document.createElement('div');d.textContent=t;k.appendChild(d);setTimeout(()=>d.remove(),5000);while(k.children.length>4)k.removeChild(k.firstChild);}
addChat('*** SAMP 3D conectado — Grove Street RP ***','#3dff7a');
addChat('Bem-vindo '+S.nick+'! Digite /ajuda','#ffe27a');
setTimeout(()=>addChat('Big_Smoke entrou no servidor (id 11)'),2500);
setTimeout(()=>addChat('Ryder_BK: vamo fazer entrega, CJ! pega o marcador $'),6000);
function refreshHUD(){
  $('money').textContent='$'+String(Math.max(0,Math.round(S.money))).padStart(8,'0');
  $('health-fill').style.width=clamp(S.health,0,100)+'%';
  $('armor-fill').style.width=clamp(S.armor,0,100)+'%';
  let st='';for(let i=0;i<5;i++)st+=i<S.stars?'★':'☆';
  $('wanted').textContent=st;$('wanted').style.color=S.stars>0?'#ff5b5b':'#ffcf3d';
  const hh=String(Math.floor(S.timeH)).padStart(2,'0'),mm=String(Math.floor((S.timeH%1)*60)).padStart(2,'0');
  $('clock').textContent=hh+':'+mm;
  if(S.inVehicle&&S.vehIndex>=0){const v=vehicles[S.vehIndex];$('speedo').classList.remove('hidden');$('speedo').textContent=Math.abs(Math.round(v.speed*3.6))+' km/h • '+v.name;}
  else $('speedo').classList.add('hidden');
}

// minimapa
const mm=$('minimap').getContext('2d');
function drawMinimap(){
  const W=180;mm.clearRect(0,0,W,W);
  mm.fillStyle='#0a2a12';mm.beginPath();mm.arc(90,90,90,0,TAU);mm.fill();
  mm.save();mm.beginPath();mm.arc(90,90,86,0,TAU);mm.clip();
  const range=130;
  const px=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].pos.x:P.pos.x;
  const pz=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].pos.z:P.pos.z;
  const sx=x=>90+(x-px)/range*90, sz=z=>90+(z-pz)/range*90;
  mm.strokeStyle='#555';mm.lineWidth=3;
  for(const rx of roadX){mm.beginPath();mm.moveTo(sx(rx),sz(OZ-20));mm.lineTo(sx(rx),sz(OZ+TOTAL+20));mm.stroke();}
  for(const rz of roadZ){mm.beginPath();mm.moveTo(sx(OX-20),sz(rz));mm.lineTo(sx(OX+TOTAL+20),sz(rz));mm.stroke();}
  mm.fillStyle='#1e6fbf';mm.fillRect(0,sz(OZ+TOTAL),W,W);
  for(const pk of pickups){if(pk.taken)continue;mm.fillStyle=pk.type==='mission'?'#ff0':'#0f0';mm.beginPath();mm.arc(sx(pk.pos.x),sz(pk.pos.z),3,0,TAU);mm.fill();}
  if(destMarker.visible){mm.fillStyle='#ff0';mm.beginPath();mm.arc(sx(destMarker.position.x),sz(destMarker.position.z),5,0,TAU);mm.fill();}
  for(const v of vehicles){if(v.destroyed)continue;mm.fillStyle=v.police?((Math.floor(S.time*4)%2)?'#f00':'#00f'):'#ff0';mm.fillRect(sx(v.pos.x)-2,sz(v.pos.z)-2,4,4);}
  for(const p of peds){if(!p.alive)continue;mm.fillStyle=p.isCop?'#00f':'#0f0';mm.fillRect(sx(p.pos.x)-1.5,sz(p.pos.z)-1.5,3,3);}
  // jogador
  mm.fillStyle='#fff';mm.save();mm.translate(90,90);mm.rotate(S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].heading:P.heading);
  mm.beginPath();mm.moveTo(0,-7);mm.lineTo(-5,5);mm.lineTo(5,5);mm.closePath();mm.fill();mm.restore();
  mm.restore();
}

// ---------- input ----------
const keys={};
addEventListener('keydown',e=>{
  if($('chat-input-row').classList.contains('hidden')===false&&document.activeElement===$('chat-input'))return;
  keys[e.code]=true;
  if(e.code==='KeyE')doAction();
  if(e.code==='KeyT'){e.preventDefault();openChat();}
  if(e.code==='Tab'){e.preventDefault();togglePlayers();}
  if(['Space','ArrowUp'].includes(e.code))e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
let mouseDown=false,lx=0,ly=0;
renderer.domElement.addEventListener('mousedown',e=>{mouseDown=true;lx=e.clientX;ly=e.clientY;});
addEventListener('mouseup',()=>mouseDown=false);
addEventListener('mousemove',e=>{if(mouseDown&&S.started){S.camYaw-=(e.clientX-lx)*0.005;S.camPitch=clamp(S.camPitch+(e.clientY-ly)*0.003,-0.2,1.2);lx=e.clientX;ly=e.clientY;S.lastCamDrag=S.time;}});
renderer.domElement.addEventListener('click',()=>{if(S.started&&!S.inVehicle)tryShoot();});

// touch joystick
const joy={x:0,y:0,id:null};let joyOX=0,joyOY=0;
const jzone=$('joystick-zone'),jbase=$('joystick-base'),jknob=$('joystick-knob');
jzone.addEventListener('touchstart',e=>{e.preventDefault();document.body.classList.add('touch');const t=e.changedTouches[0];joy.id=t.identifier;joyOX=t.clientX;joyOY=t.clientY;jbase.style.display='block';jbase.style.left=(t.clientX-65)+'px';jbase.style.top=(t.clientY-65-60)+'px';jbase.style.bottom='auto';},{passive:false});
addEventListener('touchmove',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===joy.id){let dx=t.clientX-joyOX,dy=t.clientY-joyOY;const m=Math.hypot(dx,dy);if(m>50){dx*=50/m;dy*=50/m;}joy.x=dx/50;joy.y=-dy/50;jknob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
    else if(camTouch.id===t.identifier){S.camYaw-=(t.clientX-camTouch.x)*0.007;S.camPitch=clamp(S.camPitch+(t.clientY-camTouch.y)*0.005,-0.2,1.2);camTouch.x=t.clientX;camTouch.y=t.clientY;S.lastCamDrag=S.time;}
  }
  if(S.started)e.preventDefault();
},{passive:false});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===joy.id){joy.id=null;joy.x=0;joy.y=0;jknob.style.transform='translate(-50%,-50%)';jbase.style.display='none';}if(t.identifier===camTouch.id)camTouch.id=null;}},{passive:true});
// camera drag lado direito
const camTouch={id:null,x:0,y:0};
renderer.domElement.addEventListener('touchstart',e=>{document.body.classList.add('touch');for(const t of e.changedTouches){if(t.clientX>innerWidth*0.45&&camTouch.id===null){camTouch.id=t.identifier;camTouch.x=t.clientX;camTouch.y=t.clientY;}}audioInit();},{passive:true});
if('ontouchstart' in window)document.body.classList.add('touch');

// botoes
let btnRun=false,btnShootHeld=false,btnGas=false,btnBrake=false;
function bindHold(id,down,up){const el=$(id);const on=e=>{e.preventDefault();down();};const off=e=>{e.preventDefault();if(up)up();};el.addEventListener('touchstart',on,{passive:false});el.addEventListener('touchend',off,{passive:false});el.addEventListener('mousedown',on);el.addEventListener('mouseup',off);}
bindHold('btn-action',()=>doAction());
bindHold('btn-jump',()=>{jumpQueued=true;});
bindHold('btn-shoot',()=>{btnShootHeld=true;},()=>{btnShootHeld=false;});
bindHold('btn-run',()=>{btnRun=!btnRun;$('btn-run').style.background=btnRun?'rgba(61,255,122,.6)':'rgba(0,0,0,.45)';addChat((btnRun?'🏃 correndo':'🚶 andando'));});
bindHold('btn-cam',()=>{S.camYaw+=Math.PI;});
bindHold('btn-gas',()=>{btnGas=true;},()=>{btnGas=false;});
bindHold('btn-brake',()=>{btnBrake=true;},()=>{btnBrake=false;});
let jumpQueued=false;
$('btn-full').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){}};
$('btn-help').onclick=()=>$('help-panel').classList.remove('hidden');
$('help-close').onclick=()=>$('help-panel').classList.add('hidden');
function togglePlayers(){const p=$('players-panel');p.classList.toggle('hidden');if(!p.classList.contains('hidden')){p.innerHTML='<h4>👥 Jogadores (12/100)</h4>'+pedNames.map((n,i)=>`<div>${i+1}. ${n} <span style="color:#3dff7a">●</span> ping ${20+((i*37)%60)}</div>`).join('')+`<div>0. ${S.nick} <b style="color:#ffe27a">VOCÊ</b></div>`;}}
$('btn-players').onclick=togglePlayers;
$('btn-chat').onclick=openChat;
function openChat(){$('chat-input-row').classList.remove('hidden');$('chat-input').focus();}
$('chat-input').addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Enter'){const v=$('chat-input').value.trim();$('chat-input').value='';$('chat-input').blur();$('chat-input-row').classList.add('hidden');if(v)onChat(v);}
});
function onChat(v){
  addChat(S.nick+': '+v,'#fff');
  if(!v.startsWith('/')){setTimeout(()=>addChat(pedNames[Math.floor(Math.random()*6)]+': kkk boa', '#ccc'),900);return;}
  const c=v.toLowerCase();
  if(c==='/ajuda')addChat('Comandos: /carro /vida /colete /grana /procurado /hora /nome','#ffe27a');
  else if(c==='/carro'){const i=nearestVehicle(P.pos,99);if(i>=0){enterVehicle(i);addChat('🚗 Carro teleportado: '+vehicles[i].name);}else addChat('Sem carros!');
  }
  else if(c==='/vida'){S.health=100;addChat('❤️ Vida restaurada');sfxPickup();}
  else if(c==='/colete'){S.armor=100;addChat('🛡 Colete 100%');sfxPickup();}
  else if(c==='/grana'){S.money+=500;addChat('💰 +$500 (admin)');sfxCash();}
  else if(c==='/procurado'){S.heat=0;S.stars=0;addChat('⭐ Procurado limpo');}
  else if(c==='/hora'){S.timeH=(S.timeH+6)%24;addChat('🕐 Hora: '+Math.floor(S.timeH)+':00');}
  else addChat('Comando desconhecido. /ajuda','#ff8888');
  refreshHUD();
}

// ---------- acoes ----------
function collides(x,z,r){
  for(const b of colliders){if(Math.abs(x-b.x)<b.hw+r&&Math.abs(z-b.z)<b.hd+r)return b;}
  return null;
}
function resolveCollision(pos,r){
  const b=collides(pos.x,pos.z,r);
  if(b){const px=b.hw+r-Math.abs(pos.x-b.x),pz=b.hd+r-Math.abs(pos.z-b.z);
    if(px<pz)pos.x=b.x+(pos.x>b.x?1:-1)*(b.hw+r);else pos.z=b.z+(pos.z>b.z?1:-1)*(b.hd+r);return true;}
  return false;
}
function nearestVehicle(p,maxD){
  let bi=-1,bd=maxD;
  vehicles.forEach((v,i)=>{if(v.destroyed)return;const d=Math.hypot(v.pos.x-p.x,v.pos.z-p.z);if(d<bd){bd=d;bi=i;}});
  return bi;
}
function doAction(){
  if(S.dead||S.busted)return;
  if(S.inVehicle)exitVehicle();
  else{const i=nearestVehicle(P.pos,4.5);if(i>=0)enterVehicle(i);else addChat('Nenhum carro por perto — chegue mais perto!','#ff8888');}
}
function enterVehicle(i){
  const v=vehicles[i];if(v.destroyed){addChat('Carro destruído!','#f88');return;}
  S.inVehicle=true;S.vehIndex=i;v.occupied=true;v.traffic=false;
  P.pos.copy(v.pos);P.heading=v.heading;
  $('pedals').classList.remove('hidden');
  setMission('Você entrou no '+v.name+'. Dirija até o marcador $ amarelo!');
  beep(300,0.15);
}
function exitVehicle(){
  const v=vehicles[S.vehIndex];if(!v)return;
  v.occupied=false;S.inVehicle=false;
  const sx=Math.cos(v.heading)*2.5,sz=-Math.sin(v.heading)*2.5;
  P.pos.set(v.pos.x+sx,0,v.pos.z+sz);P.heading=v.heading;v.speed=0;
  S.vehIndex=-1;$('pedals').classList.add('hidden');beep(200,0.15);
}
function setMission(t){$('mission-text').textContent=t;clearTimeout(setMission._t);setMission._t=setTimeout(()=>{$('mission-text').textContent=S.mission.active?'Leve a entrega ao marcador amarelo! 💰':'Livre! Explore, faça entregas ($), fuja da polícia 🚔';},4500);}
function tryShoot(){
  if(S.shootCd>0||S.dead||S.busted||S.inVehicle)return;
  S.shootCd=0.28;sfxShoot();
  // flash
  const f=new THREE.PointLight(0xffcc33,2,12);f.position.copy(P.pos).y=2;f.position.y=2;scene.add(f);setTimeout(()=>scene.remove(f),70);
  const fx=Math.sin(P.heading),fz=Math.cos(P.heading);
  let hit=null,hd=26;
  for(const p of peds){if(!p.alive)continue;const dx=p.pos.x-P.pos.x,dz=p.pos.z-P.pos.z;const d=Math.hypot(dx,dz);if(d>26)continue;const dot=(dx*fx+dz*fz)/(d||1);if(dot>0.94&&d<hd){hd=d;hit=p;}}
  // vidro de carro policial? danifica carro proximo na mira
  if(!hit){for(const v of vehicles){if(v.destroyed)continue;const dx=v.pos.x-P.pos.x,dz=v.pos.z-P.pos.z;const d=Math.hypot(dx,dz);if(d>20)continue;const dot=(dx*fx+dz*fz)/(d||1);if(dot>0.96){v.speed*=0.9;feed('🔫 Você atingiu '+v.name);addCrime(6);break;}}}
  if(hit){
    if(hit.isCop){hit.alive=false;hit.mesh.visible=false;feed('☠️ Você matou um LSPD! +2⭐');addChat('*** LSPD_'+ ' caiu em serviço ***','#f88');addCrime(30);S.money+=20;}
    else{hit.alive=false;hit.mesh.visible=false;S.money+=rand(20,80);feed('☠️ '+S.nick+' matou '+hit.name);addChat(hit.name+' morreu! +$','#ffb');addCrime(14);sfxCash();}
    sfxHit();refreshHUD();
  }
  // animacao braco
  playerMesh.userData.armR.rotation.x=-1.4;setTimeout(()=>playerMesh.userData.armR.rotation.x=0,150);
}
function addCrime(a){S.heat=clamp(S.heat+a,0,100);updateStars();}
function updateStars(){const h=S.heat;S.stars=h<8?0:h<25?1:h<45?2:h<65?3:h<85?4:5;}

// ---------- update: jogador ----------
function updatePlayer(dt,input){
  const run=input.run;
  const maxSp=run?10:6;
  let mx=input.x,mz=input.y;
  const m=Math.hypot(mx,mz);if(m>1){mx/=m;mz/=m;}
  // move relativo a camera
  const yaw=S.camYaw;
  const wx=Math.sin(yaw)*mz+Math.cos(yaw)*mx;
  const wz=Math.cos(yaw)*mz-Math.sin(yaw)*mx;
  if(m>0.05){P.heading=angLerp(P.heading,Math.atan2(wx,wz),dt*12);}
  P.vel.x=lerp(P.vel.x,wx*maxSp,clamp(dt*10,0,1));
  P.vel.z=lerp(P.vel.z,wz*maxSp,clamp(dt*10,0,1));
  P.speed=Math.hypot(P.vel.x,P.vel.z);
  if(jumpQueued&&P.onGround){P.vy=6.5;P.onGround=false;jumpQueued=false;}
  P.vy-=20*dt;
  P.pos.x+=P.vel.x*dt;P.pos.z+=P.vel.z*dt;P.pos.y+=P.vy*dt;
  if(P.pos.y<=0){P.pos.y=0;P.vy=0;P.onGround=true;}
  resolveCollision(P.pos,0.6);
  P.pos.x=clamp(P.pos.x,OX-20,OX+TOTAL+20);P.pos.z=clamp(P.pos.z,OZ-20,OZ+TOTAL+90);
  P.pos.y=Math.max(0,P.pos.y);
  playerMesh.position.copy(P.pos);playerMesh.rotation.y=P.heading;
  // animacao
  const t=S.time*(P.speed>0.5?(run?13:9):2);
  const sw=P.speed>0.5?Math.sin(t)*0.55:0;
  playerMesh.userData.legs.rotation.x=sw;
  playerMesh.userData.armL.rotation.x=-sw;
  if(S.shootCd<=0)playerMesh.userData.armR.rotation.x=sw;
  playerMesh.position.y=P.pos.y+Math.abs(Math.sin(t))*(P.speed>0.5?0.08:0);
  // atropelado pela policia?
  for(const c of cops){if(c.destroyed)continue;if(Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z)<2.2&&Math.abs(c.speed)>6){hurt(25,'atropelado pela LSPD');}}
  // pickups
  for(const pk of pickups){
    if(pk.taken)continue;
    if(Math.hypot(pk.pos.x-P.pos.x,pk.pos.z-P.pos.z)<2.4){
      if(pk.type==='health'){S.health=100;setMission('❤️ Vida cheia!');}
      else if(pk.type==='armor'){S.armor=100;setMission('🛡️ Colete 100%!');}
      else if(pk.type==='bribe'){S.heat=Math.max(0,S.heat-40);updateStars();setMission('⭐ Suborno! Procurado reduziu.');}
      else if(pk.type==='money'){S.money+=100;setMission('💰 +$100 achados na rua!');sfxCash();}
      else if(pk.type==='mission'&&!S.mission.active){S.mission.active=true;S.mission.stage=1;S.mission.reward=Math.round(rand(150,400));destMarker.visible=true;destMarker.position.set(roadX[Math.floor(rand(0,6))],0,roadZ[Math.floor(rand(0,6))]);setMission('📦 Pegou a entrega! Leve ao marcador AMARELO. Prêmio $'+S.mission.reward);addChat('* Entrega iniciada — siga o ponto amarelo no minimapa','#ff0');}
      else continue;
      pk.taken=true;pk.mesh.visible=false;pk.respawn=20;sfxPickup();refreshHUD();
    }
  }
  // entrega com carro ou a pe
  if(S.mission.active&&destMarker.visible){
    const cp=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].pos:P.pos;
    destMarker.rotation.y+=dt*2;
    if(Math.hypot(destMarker.position.x-cp.x,destMarker.position.z-cp.z)<4){
      S.money+=S.mission.reward;feed('💰 Entrega +$'+S.mission.reward);addChat('Entrega completa! +$'+S.mission.reward+'','#3dff7a');
      S.mission.active=false;destMarker.visible=false;sfxCash();
      const mp=pickups.find(p=>p.type==='mission');if(mp){mp.taken=true;mp.mesh.visible=false;mp.respawn=8;}
      refreshHUD();
    }
  }
}
function hurt(d,why){
  if(S.dead)return;
  let r=d;
  if(S.armor>0){const ab=Math.min(S.armor,r);S.armor-=ab;r-=ab;}
  S.health-=r;refreshHUD();
  if(S.health<=0){wasted(why);}
}
function wasted(why){
  S.dead=true;$('wasted').classList.remove('hidden');
  feed('☠️ '+S.nick+' morreu ('+(why||'—')+')');
  setTimeout(()=>{
    $('wasted').classList.add('hidden');S.dead=false;
    if(S.inVehicle)exitVehicle();
    S.health=100;S.armor=0;S.money=Math.max(0,S.money-100);S.heat=0;S.stars=0;
    P.pos.set(roadX[2],0,roadZ[2]);P.vy=0;refreshHUD();
    setMission('Você saiu do hospital. -$100 🏥');
  },2600);
}
function bustedFn(){
  if(S.busted)return;S.busted=true;$('busted').classList.remove('hidden');
  feed('🚔 '+S.nick+' foi PRESO');
  setTimeout(()=>{
    $('busted').classList.add('hidden');S.busted=false;
    if(S.inVehicle)exitVehicle();
    S.stars=0;S.heat=0;S.money=Math.max(0,S.money-150);
    P.pos.set(roadX[0]+3,0,roadZ[0]+3);refreshHUD();setMission('Você saiu da delegacia. -$150 🚔');
  },2600);
}

// ---------- update: veiculos ----------
function updateVehicle(dt,v,input){
  if(v.destroyed){v.speed=lerp(v.speed,0,clamp(dt*4,0,1));v.pos.x+=Math.sin(v.heading)*v.speed*dt;v.pos.z+=Math.cos(v.heading)*v.speed*dt;return;}
  const max=v.maxSpeed*(input.throttle<0?0.4:1);
  if(input.throttle>0.05)v.speed+=14*input.throttle*dt;
  else if(input.throttle<-0.05){if(v.speed>1)v.speed-=30*dt;else v.speed+=7*input.throttle*dt;}
  else v.speed=lerp(v.speed,0,clamp(dt*(input.handbrake?4:0.8),0,1));
  v.speed=clamp(v.speed,-max*0.5,max);
  const sf=clamp(Math.abs(v.speed)/10,0,1),dir=v.speed>=0?1:-1;
  v.heading+=input.steer*2.2*sf*dir*dt*-1;
  const nx=v.pos.x+Math.sin(v.heading)*v.speed*dt, nz=v.pos.z+Math.cos(v.heading)*v.speed*dt;
  const nb={x:nx,z:nz};
  const b=collides(nx,nz,1.6);
  if(b){if(Math.abs(v.speed)>12){v.speed*=0.4;feed('💥 Batida!');beep(120,0.2,'sawtooth');}else v.speed*=0.4;}
  else{v.pos.x=nx;v.pos.z=nz;}
  v.pos.x=clamp(v.pos.x,OX-10,OX+TOTAL+10);v.pos.z=clamp(v.pos.z,OZ-10,OZ+TOTAL+60);
  v.mesh.position.copy(v.pos);v.mesh.rotation.y=v.heading;
  v.wheels.forEach((w,i)=>{w.rotation.x+=v.speed*dt*2;});
  // atropela pedestre?
  for(const p of peds){
    if(!p.alive)continue;
    if(Math.hypot(p.pos.x-v.pos.x,p.pos.z-v.pos.z)<2.1&&Math.abs(v.speed)>7){
      p.alive=false;p.mesh.visible=false;S.money+=30;feed('🚗 '+S.nick+' atropelou '+p.name);
      addCrime(p.isCop?30:12);sfxHit();refreshHUD();
    }
  }
}
function updateTraffic(dt){
  for(const v of vehicles){
    if(!v.traffic||v.occupied||v.destroyed||(S.inVehicle&&vehicles[S.vehIndex]===v))continue;
    updateVehicle(dt,v,{throttle:0.55,steer:0,handbrake:false});
    const m=TOTAL/2-8;
    if(Math.abs(v.pos.x-OX-TOTAL/2)>m||Math.abs(v.pos.z-OZ-TOTAL/2)>m+20)v.heading+=Math.PI;
    // vira aleatorio nos cruzamentos
    let nearX=null,nearZ=null;
    for(const rx of roadX)if(Math.abs(v.pos.x-rx)<3)nearX=rx;
    for(const rz of roadZ)if(Math.abs(v.pos.z-rz)<3)nearZ=rz;
    if(nearX!==null&&nearZ!==null&&Math.random()<dt*0.5)v.heading+= (Math.random()<0.5?Math.PI/2:-Math.PI/2);
    v.mesh.position.copy(v.pos);v.mesh.rotation.y=v.heading;
  }
}
function updateCops(dt){
  const want=S.stars>0&&!S.dead&&!S.busted;
  const target=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].pos:P.pos;
  for(const c of cops){
    if(c.destroyed)continue;
    if(c.mesh.userData.siren)c.mesh.userData.siren.material.color.setHex(Math.floor(S.time*5)%2?0xff0000:0x0033ff);
    if(!want){updateVehicle(dt,c,{throttle:0,steer:0,handbrake:true});continue;}
    const dx=target.x-c.pos.x,dz=target.z-c.pos.z,d=Math.hypot(dx,dz);
    const wantH=Math.atan2(dx,dz);
    let diff=wantH-c.heading;while(diff>Math.PI)diff-=TAU;while(diff<-Math.PI)diff+=TAU;
    updateVehicle(dt,c,{throttle:d>8?1:(d>4?0.5:0.1),steer:clamp(-diff*2,-1,1),handbrake:false});
    // prende se perto e jogador lento/a pe
    const pspeed=S.inVehicle?Math.abs(vehicles[S.vehIndex].speed):P.speed;
    if(d<5&&pspeed<3){
      S.sirenT+=dt;
      if(S.sirenT>2.5){S.sirenT=0;bustedFn();return;}
      if(Math.floor(S.time*2)%2===0)setMission('🚔 A LSPD está te prendendo... FUJA!');
    }
  }
  if(!want)S.sirenT=0;
  // policiais a pe perseguem
  for(const p of peds){
    if(!p.isCop||!p.alive)continue;
    if(want){const dx=P.pos.x-p.pos.x,dz=P.pos.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<40&&!S.inVehicle){p.heading=Math.atan2(dx,dz);p.pos.x+=Math.sin(p.heading)*p.speed*dt;p.pos.z+=Math.cos(p.heading)*p.speed*dt;p.mesh.position.copy(p.pos);p.mesh.rotation.y=p.heading;
        if(d<1.6){hurt(30*dt+2,'espancado pela LSPD');addCrime(0);}}}
  }
}
function updatePeds(dt){
  for(const p of peds){
    if(!p.alive||p.isCop)continue;
    p.walkT+=dt;
    // foge de carro rapido perto
    let flee=null;
    for(const v of vehicles){if(Math.abs(v.speed)<8)continue;if(Math.hypot(v.pos.x-p.pos.x,v.pos.z-p.pos.z)<9){flee=v;break;}}
    if(flee){
      const dx=p.pos.x-flee.pos.x,dz=p.pos.z-flee.pos.z,d=Math.hypot(dx,dz)||1;
      p.heading=Math.atan2(dx/d,dz/d);p.pos.x+=Math.sin(p.heading)*4*dt;p.pos.z+=Math.cos(p.heading)*4*dt;
    }else{
      const dx=p.target.x-p.pos.x,dz=p.target.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<3||p.retarget>12){p.target.set(rand(OX+5,OX+TOTAL-5),0,rand(OZ+5,OZ+TOTAL-5));p.retarget=0;}
      p.retarget+=dt;
      p.heading=angLerp(p.heading,Math.atan2(dx,dz),dt*3);
      p.pos.x+=Math.sin(p.heading)*p.speed*dt;p.pos.z+=Math.cos(p.heading)*p.speed*dt;
      resolveCollision(p.pos,0.5);
    }
    p.mesh.position.copy(p.pos);p.mesh.rotation.y=p.heading;
    p.mesh.userData.legs.rotation.x=Math.sin(p.walkT*8)*0.5;
  }
}

// ---------- camera ----------
function updateCamera(dt){
  const focus=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].pos:P.pos;
  const followH=S.inVehicle&&S.vehIndex>=0?vehicles[S.vehIndex].heading:P.heading;
  if(S.inVehicle&&S.time-S.lastCamDrag>2.5)S.camYaw=angLerp(S.camYaw,followH,dt*1.6);
  const dist=S.inVehicle?10.5:7, h=S.inVehicle?4.2:3.4;
  const cx=focus.x-Math.sin(S.camYaw)*Math.cos(S.camPitch)*dist;
  const cz=focus.z-Math.cos(S.camYaw)*Math.cos(S.camPitch)*dist;
  const cy=focus.y+h+Math.sin(S.camPitch)*dist;
  camera.position.lerp(new THREE.Vector3(cx,cy,cz),clamp(dt*8,0,1));
  camera.lookAt(focus.x,focus.y+(S.inVehicle?2:2.2),focus.z);
}

// ---------- dia/noite ----------
function updateSky(dt){
  S.timeH+=dt*(24/480);if(S.timeH>=24)S.timeH-=24; // dia de 8min
  const t=(S.timeH-6)/12; // 0 nascer, 1 por
  const day=clamp(Math.sin(t*Math.PI),0,1);
  const night=1-day;
  scene.background.setRGB(lerp(0.05,0.53,day),lerp(0.05,0.81,day),lerp(0.12,0.92,day));
  scene.fog.color.copy(scene.background);
  sun.intensity=lerp(0.08,0.95,day);
  hemi.intensity=lerp(0.2,0.75,day);
  sun.position.set(Math.cos(t*Math.PI)*150,20+day*120,40);
  const sea=scene.getObjectByName('sea');if(sea)sea.position.y=0.02+Math.sin(S.time*1.2)*0.06;
  window._lamps.forEach(l=>l.material=l.material);
}

// ---------- loop ----------
const clock=new THREE.Clock();
let mmT=0;
function loop(){
  requestAnimationFrame(loop);
  const dt=Math.min(clock.getDelta(),0.05);
  if(!S.started){renderer.render(scene,camera);return;}
  S.time+=dt;
  if(S.shootCd>0)S.shootCd-=dt;
  // input combinado
  const ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
  const iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+joy.y;
  const run=keys.ShiftLeft||keys.ShiftRight||btnRun;
  if(btnShootHeld)tryShoot();
  if(keys.Space)jumpQueued=true;

  if(S.inVehicle&&S.vehIndex>=0){
    const v=vehicles[S.vehIndex];
    let th=0;
    if(btnGas)th=1;else if(btnBrake)th=-1;
    else th=((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0)+joy.y;
    let st=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+joy.x;
    th=clamp(th,-1,1);st=clamp(st,-1,1);
    updateVehicle(dt,v,{throttle:th,steer:st,handbrake:!!keys.Space});
    P.pos.copy(v.pos);P.heading=v.heading;
    playerMesh.visible=false;
    engineSound(v.speed);
    // dano afoga no mar?
    if(v.pos.z>OZ+TOTAL+30){v.destroyed=true;feed('🌊 Carro afundou!');exitVehicle();}
    if(v.destroyed&&th!==0&&Math.random()<dt){feed('🔥 Carro destruído! Aperte 🚗 para sair');}
  }else{
    playerMesh.visible=true;
    updatePlayer(dt,{x:clamp(ix,-1,1),y:clamp(iz,-1,1),run});
    engineSound(0);
    if(P.pos.z>OZ+TOTAL+34){P.pos.z=OZ+TOTAL+30;hurt(10*dt+1,'afogado');}
  }
  updateTraffic(dt);updateCops(dt);updatePeds(dt);updateCamera(dt);updateSky(dt);
  // wanted esfria escondido
  const inSight=S.stars>0&&cops.some(c=>!c.destroyed&&Math.hypot(c.pos.x-P.pos.x,c.pos.z-P.pos.z)<35);
  if(!inSight&&S.heat>0){S.heat=Math.max(0,S.heat-dt*(S.stars>=3?1.5:4));updateStars();}
  // respawn pickups
  for(const pk of pickups){pk.mesh.rotation.y+=dt*1.5;if(pk.taken){pk.respawn-=dt;if(pk.respawn<=0){pk.taken=false;pk.mesh.visible=true;}}}
  mmT+=dt;if(mmT>0.12){mmT=0;drawMinimap();refreshHUD();}
  renderer.render(scene,camera);
}

// ---------- start ----------
$('play-btn').onclick=()=>{
  S.nick=($('nick').value||'CJ_Brasil').slice(0,16);
  S.quality=$('quality').value;
  if(S.quality==='low'){renderer.shadowMap.enabled=false;renderer.setPixelRatio(1);}
  nickTag.material.map=textSprite(S.nick,'rgba(0,0,0,0.5)').material.map;
  $('menu').style.display='none';
  S.started=true;audioInit();try{AC.resume();}catch(e){}
  try{if(document.body.classList.contains('touch'))document.documentElement.requestFullscreen().catch(()=>{});}catch(e){}
  setMission('Bem-vindo, '+S.nick+'! Aperte 🚗 perto de um carro. Siga o $ amarelo!');
  addChat(S.nick+' entrou no servidor (id 0)','#3dff7a');
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  refreshHUD();drawMinimap();
};
camera.position.set(roadX[2]+10,12,roadZ[2]+10);camera.lookAt(roadX[2],0,roadZ[2]);
loop();
})();
