import { supabase } from '@/lib/supabaseClient';

// Downscale + re-encode to JPEG (handles iPhone HEIC via canvas), upload to the
// `memories` bucket, return the public URL. On decode failure (some HEIC files
// reject on older Safari), fall back to uploading the original bytes unmodified.
export async function uploadMemoryPhoto(file: File, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  let blob: Blob;
  let contentType = 'image/jpeg';
  try {
    const img = await createImageBitmap(file);
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', 0.82)
    );
  } catch {
    // Fallback: upload the original file bytes unmodified rather than failing.
    blob = file;
    contentType = file.type || 'application/octet-stream';
  }

  const { error } = await supabase.storage.from('memories').upload(path, blob, { contentType });
  if (error) throw error;
  return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
}
