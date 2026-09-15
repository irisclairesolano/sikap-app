/**
 * Safely appends a local file asset to FormData.
 *
 * In Expo SDK 52/56/57 and React Native with WinterCG-compliant fetch,
 * appending a legacy React Native pseudo-object `{ uri, name, type }`
 * causes:
 *   [Error: Unsupported FormDataPart implementation]
 *
 * This utility converts the local URI into a real Blob/File instance
 * which is fully supported by both modern WinterCG fetch and standard multipart encoders.
 */
export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string = 'file.jpg',
  mimeType: string = 'image/jpeg',
): Promise<void> {
  try {
    const response = await fetch(uri);
    const rawBlob = await response.blob();
    const effectiveMimeType = mimeType || rawBlob.type || 'image/jpeg';
    const blob =
      rawBlob.type === effectiveMimeType
        ? rawBlob
        : rawBlob.slice(0, rawBlob.size, effectiveMimeType);

    if (typeof File !== 'undefined') {
      const file = new File([blob], fileName, { type: effectiveMimeType });
      formData.append(fieldName, file);
    } else {
      formData.append(fieldName, blob, fileName);
    }
  } catch (error) {
    console.warn(`appendFileToFormData fallback for ${fieldName}:`, error);
    // Legacy RN pseudo-object fallback
    formData.append(fieldName, {
      uri,
      name: fileName,
      type: mimeType,
    } as any);
  }
}
