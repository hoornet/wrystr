import { fetch } from "@tauri-apps/plugin-http";

/**
 * Upload an image file to nostr.build and return the hosted URL.
 * Uses Tauri's HTTP plugin to bypass WebView CORS/fetch restrictions.
 *
 * Clipboard-pasted images sometimes arrive as File objects that Tauri's
 * HTTP plugin can't serialize correctly, so we read the bytes ourselves
 * and build a proper Blob with the correct MIME type.
 */
export async function uploadImage(file: File): Promise<string> {
  // Read file bytes — ensures clipboard-pasted images are properly serialized
  const bytes = new Uint8Array(await file.arrayBuffer());
  return uploadBytes(bytes, file.name || "image.png", file.type || "image/png");
}

/**
 * Upload raw bytes to nostr.build. Used by the native file picker path
 * where we already have a Uint8Array from tauri-plugin-fs.
 */
export async function uploadBytes(bytes: Uint8Array, fileName: string, mimeType: string): Promise<string> {
  const blob = new Blob([bytes], { type: mimeType });

  const form = new FormData();
  form.append("file", blob, fileName);

  const resp = await fetch("https://nostr.build/api/v2/upload/files", {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    throw new Error(`Upload failed (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  if (data.status === "success" && data.data?.[0]?.url) {
    return data.data[0].url as string;
  }
  throw new Error(data.message || "Upload failed — no URL returned");
}
