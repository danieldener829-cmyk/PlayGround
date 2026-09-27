// Simple AES-GCM env encryption (Node runtime, WebCrypto). Falls back to base64 in browser demo.
const ENC_KEY = process.env.ENV_ENC_KEY || "hostbots-dev-key-32chars-12345678";

export async function encryptEnv(plain: string): Promise<string> {
  try {
    const cryptoObj = globalThis.crypto as any;
    if (!cryptoObj?.subtle) return Buffer.from(plain).toString("base64");
    const enc = new TextEncoder();
    const keyMat = await cryptoObj.subtle.importKey("raw", enc.encode(ENC_KEY.padEnd(32, "0").slice(0, 32)), "AES-GCM", false, ["encrypt"]);
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ct = await cryptoObj.subtle.encrypt({ name: "AES-GCM", iv }, keyMat, enc.encode(plain));
    const buf = Buffer.concat([Buffer.from(iv), Buffer.from(ct)]);
    return "enc:" + buf.toString("base64");
  } catch { return Buffer.from(plain).toString("base64"); }
}
export async function decryptEnv(encStr: string): Promise<string> {
  try {
    if (!encStr.startsWith("enc:")) return Buffer.from(encStr, "base64").toString();
    const cryptoObj = globalThis.crypto as any;
    const raw = Buffer.from(encStr.slice(4), "base64");
    const iv = raw.subarray(0, 12); const ct = raw.subarray(12);
    const enc = new TextEncoder();
    const keyMat = await cryptoObj.subtle.importKey("raw", enc.encode(ENC_KEY.padEnd(32, "0").slice(0, 32)), "AES-GCM", false, ["decrypt"]);
    const pt = await cryptoObj.subtle.decrypt({ name: "AES-GCM", iv }, keyMat, ct);
    return new TextDecoder().decode(pt);
  } catch { return "[decrypt-error]"; }
}
