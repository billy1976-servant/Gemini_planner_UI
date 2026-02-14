/**
 * Filesystem: Capacitor when native; web fallback via download/upload or stub.
 * Native only for saveFile/readFile (Documents directory).
 */

import { isNativePlatform } from "./nativeCapabilities";

export async function readFile(name: string): Promise<{ data?: string; error?: string }> {
  if (isNativePlatform()) {
    try {
<<<<<<< HEAD
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const result = await Filesystem.readFile({
        path: name,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
=======
      const { Filesystem } = await import("@capacitor/filesystem");
      const { Directory } = await import("@capacitor/filesystem");
      const result = await Filesystem.readFile({
        path: name,
        directory: Directory.Documents,
        encoding: "utf-8",
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
      });
      return { data: result.data as string };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Read failed" };
    }
  }
  return { error: "web fallback: use browser file input or upload" };
}

export async function writeFile(path: string, data: string): Promise<{ path?: string; error?: string }> {
  if (isNativePlatform()) {
    try {
<<<<<<< HEAD
      const { Filesystem, Encoding } = await import("@capacitor/filesystem");
      await Filesystem.writeFile({ path, data, encoding: Encoding.UTF8 });
=======
      const { Filesystem } = await import("@capacitor/filesystem");
      await Filesystem.writeFile({ path, data, encoding: "utf-8" });
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
      return { path };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Write failed" };
    }
  }
  return { error: "web fallback: use browser download or localStorage" };
}

/** Save a file by name in app Documents. Native only. */
export async function saveFile(name: string, data: string): Promise<{ path?: string; error?: string }> {
  if (!isNativePlatform()) return { error: "web fallback: use browser download or localStorage" };
  try {
<<<<<<< HEAD
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
=======
    const { Filesystem } = await import("@capacitor/filesystem");
    const { Directory } = await import("@capacitor/filesystem");
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
    await Filesystem.writeFile({
      path: name,
      data,
      directory: Directory.Documents,
<<<<<<< HEAD
      encoding: Encoding.UTF8,
=======
      encoding: "utf-8",
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
    });
    return { path: name };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Write failed" };
  }
}
