/**
 * Shared helpers for saving and loading photo files via @capacitor/filesystem.
 * Photos are stored as raw JPEG files in Directory.Data (private app storage).
 * Only a file path string is persisted in SQLite — no base64 blobs in the database.
 */
import { Filesystem, Directory } from '@capacitor/filesystem';

const FS_DIR = Directory.Data;

/**
 * Write a photo (data URL or bare base64 string) to private app storage.
 * Returns the relative path used to reference the file later.
 */
export async function savePhotoFile(
  folder: string,
  id: string,
  dataUrl: string
): Promise<string> {
  // Capacitor writeFile expects raw base64 (no data: prefix) when encoding is unset
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const path = `${folder}/${id}.jpg`;
  await Filesystem.writeFile({ path, data: base64, directory: FS_DIR, recursive: true });
  return path;
}

/**
 * Read a stored photo file back as a data:image/jpeg;base64,… URL
 * suitable for use in an <img src> attribute.
 */
export async function loadPhotoFile(path: string): Promise<string> {
  const result = await Filesystem.readFile({ path, directory: FS_DIR });
  // On native, result.data is a string (base64). On web it may be a Blob.
  if (result.data instanceof Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(result.data as Blob);
    });
  }
  return `data:image/jpeg;base64,${result.data as string}`;
}

/**
 * Delete a stored photo file. Silent if the file is already absent.
 */
export async function deletePhotoFile(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path, directory: FS_DIR });
  } catch {
    // file may already be absent — not an error
  }
}
