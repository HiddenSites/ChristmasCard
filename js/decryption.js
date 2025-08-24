// decryptImage expects a full path to the .bin file
async function decryptImage(fullPath, cryptoKey) {
  const resp = await fetch(fullPath);
  if (!resp.ok) throw new Error(`Failed to fetch encrypted file: ${fullPath}`);

  const data = await resp.arrayBuffer();
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);
  return new Blob([decrypted]);
}

// This builds the full path from a relative path and calls decryptImage
async function decryptRelativeImage(baseFolder, relativePath, cryptoKey) {
  const fullPath = `${baseFolder}${relativePath}.bin`;
  return await decryptImage(fullPath, cryptoKey);
}

async function fetchEncryptedList(indexFile, folder) {
  try {
    const res = await fetch(indexFile);
    if (!res.ok) throw new Error('Fetch failed');

    const fileList = await res.json();
    
    // If index.json contains paths like "IMG_2559.jpeg.bin", prefix them
    return fileList.map(name => `${folder}/${name}`);
  } catch (err) {
    console.error('❌ Failed to load image list:', err);
    return [];
  }
}

async function deriveDecryptionKey(password) {
  const encoder = new TextEncoder();
  const salt = encoder.encode("static-salt-or-something-obscure"); // Could be public, or per-image if you want
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

// Helper: convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Function to hash user input with SHA-256 and return hex string
async function hashAnswer(answer) {
  const encoder = new TextEncoder();
  const data = encoder.encode(answer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}