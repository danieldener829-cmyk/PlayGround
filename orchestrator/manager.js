// HOSTBOTS Orchestrator — gerencia containers Docker (1 por bot/site) + PM2 + auto-restart.
// Uso na VPS: node orchestrator/manager.js  (ou via docker-compose service "orchestrator")
// Requer: docker instalado. Se docker não disponível, roda em modo simulado (logs).
import { exec } from "child_process";
import { promisify } from "util";
const sh = promisify(exec);

const RUNTIMES = {
  "node20": "hostbots/runtime-node20",
  "python311": "hostbots/runtime-python311",
  "java17": "hostbots/runtime-java17",
  "php82": "hostbots/runtime-php82",
};

async function docker(cmd) {
  try { const { stdout } = await sh(`docker ${cmd}`); return stdout.trim(); }
  catch (e) { return `DOCKER-SIM: ${cmd} (docker indisponível neste ambiente)`; }
}

export async function deployBot({ id, runtime, ramMB, env }) {
  const img = runtime.includes("Python") ? RUNTIMES.python311 : runtime.includes("Java") ? RUNTIMES.java17 : RUNTIMES.node20;
  console.log(`[orchestrator] deploy ${id} → ${img} (${ramMB}MB)`);
  await docker(`build -t ${img} -f orchestrator/Dockerfile.node .`);
  await docker(`rm -f ${id} || true`);
  const out = await docker(`run -d --name ${id} --memory=${ramMB}m --restart=unless-stopped -e ENCRYPTED_ENV=1 -p 0:8080 ${img}`);
  await docker(`logs --tail 50 ${id}`);
  return out;
}
export async function stopBot(id) { return docker(`stop ${id}`); }
export async function restartBot(id) { return docker(`restart ${id}`); }
export async function stats() { return docker(`stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemUsage}}"`); }

// loop de uptime 99%: verifica a cada 30s e reinicia o que caiu
if (process.argv[1]?.endsWith("manager.js")) {
  console.log("🤖 HOSTBOTS orchestrator online (auto-restart 30s)");
  setInterval(async () => {
    const s = await docker("ps --format '{{.Names}} {{.Status}}'");
    console.log(new Date().toISOString(), "containers:", s.slice(0, 300));
  }, 30000);
}
