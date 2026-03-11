/**
 * Generates 3 test Nostr accounts for debugging.
 * Run once: node test/gen-accounts.mjs
 * Output saved to test/accounts.json (gitignored)
 */
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// bech32 encoder (minimal, for nsec/npub)
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
function bech32Encode(hrp, data) {
  const values = convertBits(data, 8, 5, true);
  const checksum = createChecksum(hrp, values);
  let result = hrp + "1";
  for (const v of [...values, ...checksum]) result += CHARSET[v];
  return result;
}
function polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
function hrpExpand(hrp) {
  const ret = [];
  for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
  ret.push(0);
  for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
  return ret;
}
function createChecksum(hrp, data) {
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ 1;
  return Array.from({ length: 6 }, (_, i) => (mod >> (5 * (5 - i))) & 31);
}
function convertBits(data, from, to, pad = false) {
  let acc = 0, bits = 0;
  const result = [];
  const maxv = (1 << to) - 1;
  for (const v of data) {
    acc = (acc << from) | v;
    bits += from;
    while (bits >= to) { bits -= to; result.push((acc >> bits) & maxv); }
  }
  if (pad && bits > 0) result.push((acc << (to - bits)) & maxv);
  return result;
}

const accounts = [];
for (let i = 0; i < 3; i++) {
  const privBytes = secp256k1.utils.randomPrivateKey();
  const pubBytes = secp256k1.getPublicKey(privBytes, true).slice(1); // x-only
  const privHex = bytesToHex(privBytes);
  const pubHex = bytesToHex(pubBytes);
  const nsec = bech32Encode("nsec", Array.from(privBytes));
  const npub = bech32Encode("npub", Array.from(pubBytes));
  accounts.push({ label: `Test Account ${i + 1}`, privHex, pubHex, nsec, npub });
}

const outPath = join(__dir, "accounts.json");
writeFileSync(outPath, JSON.stringify(accounts, null, 2));
console.log("Generated accounts:");
for (const a of accounts) {
  console.log(`\n${a.label}`);
  console.log(`  npub: ${a.npub}`);
  console.log(`  nsec: ${a.nsec}`);
  console.log(`  pub:  ${a.pubHex}`);
}
console.log(`\nSaved to ${outPath}`);
