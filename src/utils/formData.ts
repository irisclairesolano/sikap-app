/**
 * Safely appends a local file asset to FormData.
 *
 * In Expo SDK 52/56/57 and React Native with WinterCG-compliant fetch:
 * 1. Appending a legacy React Native pseudo-object `{ uri, name, type }`
 *    causes: [Error: Unsupported FormDataPart implementation] in Expo's fetch.
 * 2. Calling `new File([blob], fileName)` or appending a Blob directly without
 *    defining a writable 'name' property causes:
 *    [TypeError: Cannot assign to property 'name' which has only a getter]
 *    because Expo's FormData patch (normalizeArgs) executes `value.name = blobFilename ?? 'blob'`,
 *    and on Hermes/React Native, `name` is a getter without a setter on the prototype.
 *
 * This utility:
 * - Patches Blob/File prototypes so `name` property assignment never throws
 * - Converts the local file URI to a real Blob via fetch
 * - Defines an own writable 'name' and 'type' property on the Blob instance
 * - Safely appends to FormData without triggering getter-only or FormDataPart errors.
 */

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

export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string = 'file.jpg',
  mimeType: string = 'image/jpeg',
): Promise<void> {
  const effectiveMimeType = String(mimeType || 'image/jpeg');
  const cleanFileName = ensureExtension(String(fileName || 'file.jpg'), effectiveMimeType);

  try {
    const response = await fetch(uri);
    const rawBlob = await response.blob();
    const typeToUse = effectiveMimeType || rawBlob.type || 'image/jpeg';
    const blob: any =
      rawBlob.type === typeToUse ? rawBlob : rawBlob.slice(0, rawBlob.size, typeToUse);

    // Define own writable 'name' and 'type' on the blob instance so Expo's
    // normalizeArgs (in installFormDataPatch) can safely assign `value.name` without throwing.
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
  } catch (error) {
    console.warn(`appendFileToFormData fallback for ${fieldName}:`, error);
    // Legacy RN pseudo-object fallback
    formData.append(fieldName, {
      uri,
      name: cleanFileName,
      type: effectiveMimeType,
    } as any);
  }
}
