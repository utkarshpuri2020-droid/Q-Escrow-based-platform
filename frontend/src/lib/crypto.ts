// Client-side Cryptographic Utilities (Web Crypto SHA-256 and Canonical Serialization)

export async function sha256Client(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function canonicalizeJson(payload: Record<string, any>): string {
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    sortedObj[k] = payload[k];
  }
  return JSON.stringify(sortedObj);
}
