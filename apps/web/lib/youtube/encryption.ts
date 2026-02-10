/**
 * Token encryption/decryption using Web Crypto API (AES-256-GCM).
 * Native to Cloudflare Workers -- no external dependencies.
 *
 * Tokens are stored as base64-encoded strings: `{iv}:{ciphertext}`
 * where iv is a 12-byte random nonce.
 */

/** Import the encryption key from a base64-encoded string */
async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error('Encryption key must be 256 bits (32 bytes)');
  }
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Convert ArrayBuffer to base64 string */
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/** Convert base64 string to Uint8Array */
function base64ToBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Encrypt a plaintext token using AES-256-GCM.
 * Returns a string in format: `{base64_iv}:{base64_ciphertext}`
 */
export async function encryptToken(plaintext: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return `${bufferToBase64(iv.buffer)}:${bufferToBase64(ciphertext)}`;
}

/**
 * Decrypt an encrypted token string.
 * Expects format: `{base64_iv}:{base64_ciphertext}`
 */
export async function decryptToken(encrypted: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const [ivBase64, ciphertextBase64] = encrypted.split(':');

  if (!ivBase64 || !ciphertextBase64) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Get the encryption key from environment.
 * Throws if not configured.
 */
export function getEncryptionKey(): string {
  const key = process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'Missing YOUTUBE_TOKEN_ENCRYPTION_KEY secret. ' +
      'Set it using: npx wrangler secret put YOUTUBE_TOKEN_ENCRYPTION_KEY'
    );
  }
  return key;
}
