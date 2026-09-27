export const PLANS = {
  FREE: { id: "FREE", name: "Grátis", price: 0, bots: 1, sites: 1, ramPerBot: 256, sleepMin: 30, watermark: true, alwaysOn: false },
  BASIC: { id: "BASIC", name: "Basic", price: 9.9, bots: 3, sites: 2, ramPerBot: 512, sleepMin: 0, watermark: false, alwaysOn: true },
  PRO: { id: "PRO", name: "Pro", price: 29.9, bots: 10, sites: 10, ramPerBot: 2048, sleepMin: 0, watermark: false, alwaysOn: true, freeDomain: true },
} as const;
export type PlanId = keyof typeof PLANS;

export function detectRuntime(files: string[], pkg?: string) {
  const f = files.map((x) => x.toLowerCase());
  if (f.includes("package.json") || f.some((x) => x.endsWith(".js") || x.endsWith(".ts"))) return { runtime: "Node.js 20", install: "npm install", start: "npm start" };
  if (f.includes("requirements.txt") || f.some((x) => x.endsWith(".py"))) return { runtime: "Python 3.11", install: "pip install -r requirements.txt", start: "python main.py" };
  if (f.some((x) => x.endsWith(".jar")) || f.includes("pom.xml")) return { runtime: "Java 17", install: "mvn package", start: "java -jar app.jar" };
  if (f.includes("index.php") || f.some((x) => x.endsWith(".php"))) return { runtime: "PHP 8.2", install: "composer install", start: "php -S 0.0.0.0:8080" };
  if (f.includes("index.html")) return { runtime: "Static HTML", install: "—", start: "nginx" };
  return { runtime: "Node.js 20", install: "npm install", start: "npm start" };
}

export function freeSubdomain(name: string, kind: "bot" | "site") {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 30) || "app";
  return `${slug}.hostbots.com.br`;
}
