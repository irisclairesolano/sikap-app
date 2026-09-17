import { Blob as ExpoBlob } from 'expo-blob';
import * as FileSystem from 'expo-file-system/legacy';

function ensurePrototypeWritableName(proto: any): void {
  if (!proto) return;
  try {
    const desc = Object.getOwnPropertyDescriptor(proto, 'name');
    if (desc && !desc.set && desc.configurable) {
      Object.defineProperty(proto, 'name', {
        get: desc.get,
        set(val: string) {
          try {
            Object.defineProperty(this, 'name', {
              value: val,
              writable: true,
              configurable: true,
              enumerable: true,
            });
          } catch {
            (this as any)._name = val;
          }
        },
        configurable: true,
        enumerable: desc.enumerable,
      });
    }
  } catch {
    // Ignore environments where prototype is frozen
  }
}

// Ensure prototypes in current runtime cannot throw on name assignment
if (typeof Blob !== 'undefined' && Blob.prototype) {
  ensurePrototypeWritableName(Blob.prototype);
}
if (typeof File !== 'undefined' && File.prototype) {
  ensurePrototypeWritableName(File.prototype);
}
if (typeof ExpoBlob !== 'undefined' && (ExpoBlob as any).prototype) {
  ensurePrototypeWritableName((ExpoBlob as any).prototype);
}

function ensureExtension(fileName: string, mimeType: string): string {
  if (/\.[a-zA-Z0-9]+$/.test(fileName)) {
    return fileName;
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return `${fileName}.jpg`;
  }
  if (mimeType === 'image/png') {
    return `${fileName}.png`;
  }
  if (mimeType === 'application/pdf') {
    return `${fileName}.pdf`;
  }
  return `${fileName}.jpg`;
}

// High performance base64 to Uint8Array converter
const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const b64Lookup = new Uint8Array(256);
for (let i = 0; i < b64Chars.length; i++) {
  b64Lookup[b64Chars.charCodeAt(i)] = i;
}

function base64ToUint8Array(b64: string): Uint8Array {
  if (!b64 || typeof b64 !== 'string') return new Uint8Array(0);
  const cleanB64 = b64.replace(/[\r\n\s]/g, '');
  const len = cleanB64.length;
  if (len === 0) return new Uint8Array(0);

  let bufferLength = len * 0.75;
  if (cleanB64[len - 1] === '=') {
    bufferLength--;
    if (cleanB64[len - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = b64Lookup[cleanB64.charCodeAt(i)];
    const encoded2 = b64Lookup[cleanB64.charCodeAt(i + 1)];
    const encoded3 = b64Lookup[cleanB64.charCodeAt(i + 2)];
    const encoded4 = b64Lookup[cleanB64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}

export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string = 'file.jpg',
  mimeType: string = 'image/jpeg',
): Promise<void> {
  const effectiveMimeType = String(mimeType || 'image/jpeg');
  const cleanFileName = ensureExtension(String(fileName || 'file.jpg'), effectiveMimeType);

  let rawBlob: any = null;

  // 1. Try reading blob via standard fetch(uri)
  try {
    const response = await fetch(uri);
    if (response && typeof response.blob === 'function') {
      rawBlob = await response.blob();
    }
  } catch (fetchErr) {
    console.log(`fetch("${uri}") failed, falling back to FileSystem reader:`, fetchErr);
  }

  // 2. If fetch(uri) failed (common on local Android file/cache/content URIs), read via FileSystem
  if (!rawBlob) {
    try {
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem?.EncodingType?.Base64 || ('base64' as any),
      });
      if (typeof base64Data === 'string' && base64Data.length > 0) {
        const bytes = base64ToUint8Array(base64Data);

        // Create blob using ExpoBlob or global Blob
        try {
          rawBlob = new ExpoBlob([bytes as any], { type: effectiveMimeType });
        } catch {
          rawBlob = new Blob([bytes as any], { type: effectiveMimeType });
        }

        // Ensure 'bytes' method exists so convertFormDataAsync succeeds
        if (!('bytes' in rawBlob) || typeof rawBlob.bytes !== 'function') {
          rawBlob.bytes = async () => bytes;
        }
      }
    } catch (fsErr) {
      console.warn(`FileSystem read failed for ${uri}:`, fsErr);
    }
  }

  // 3. If we have a blob (or created one), prepare it for Expo FormData
  if (rawBlob) {
    const typeToUse = effectiveMimeType || rawBlob.type || 'image/jpeg';
    const blob: any =
      rawBlob.type === typeToUse
        ? rawBlob
        : typeof rawBlob.slice === 'function'
          ? rawBlob.slice(0, rawBlob.size, typeToUse)
          : rawBlob;

    // Ensure 'name' and 'type' are enumerable own properties on the blob instance
    // so Expo's getFormDataPartHeaders will read `filename="${encodeFilename(part.name)}"`
    // and `content-type: ${part.type}`, preventing Laravel mime validation failure (422).
    try {
      Object.defineProperty(blob, 'name', {
        value: cleanFileName,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      try {
        blob.name = cleanFileName;
      } catch {
        // Ignored
      }
    }

    try {
      Object.defineProperty(blob, 'type', {
        value: typeToUse,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      try {
        blob.type = typeToUse;
      } catch {
        // Ignored
      }
    }

    formData.append(fieldName, blob, cleanFileName);
    return;
  }

  // 4. Ultimate fallback: if neither fetch nor FileSystem worked, append RN object
  console.warn(`appendFileToFormData fallback to RN object for ${fieldName}`);
  formData.append(fieldName, {
    uri,
    name: cleanFileName,
    type: effectiveMimeType,
  } as any);
}
