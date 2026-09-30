/**
 * Camada de integração com backend real.
 * Troque USE_DEMO=false e implemente os endpoints quando o backend existir.
 * Backend esperado: virtualização (Proxmox/OpenStack/API própria), DB, auth JWT, gateway de pagamento.
 */
const ApiConfig={USE_DEMO:true,BASE_URL:"https://api.suaempresa.com",ENDPOINTS:{
  login:"/auth/login",register:"/auth/register",recover:"/auth/recover",
  vms:"/vms",vmAction:"/vms/:id/:action (ligar|desligar|reiniciar|console)",
  plans:"/plans",payments:"/payments/checkout",tickets:"/tickets",coupons:"/coupons",metrics:"/vms/:id/metrics"
}};
async function api(path,opts={}){
  if(ApiConfig.USE_DEMO) throw new Error("Modo demonstração: backend não conectado. Conecte API real em assets/js/api.js");
  const r=await fetch(ApiConfig.BASE_URL+path,{headers:{"Content-Type":"application/json",...(Session.get()?{Authorization:"Bearer "+Session.get().token}:{})},...opts});
  if(!r.ok) throw new Error("Erro API "+r.status);
  return r.json();
}
window.ApiConfig=ApiConfig;
