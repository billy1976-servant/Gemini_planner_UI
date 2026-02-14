/**
 * Camera: Capacitor when native; web fallback "unsupported".
 * Guard with isNativePlatform().
 */

import { isNativePlatform } from "./nativeCapabilities";

export interface TakePhotoResult {
  webPath?: string;
  base64?: string;
  format?: string;
  error?: string;
}

/** Result shape: { webPath, base64String }. base64String may be absent if resultType was uri. */
export interface TakePictureResult {
  webPath?: string;
  base64String?: string;
  error?: string;
}

export async function takePhoto(): Promise<TakePhotoResult> {
  if (isNativePlatform()) {
    try {
<<<<<<< HEAD
      const { Camera, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
=======
      const { Camera } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: "uri",
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
      });
      return {
        webPath: photo.webPath,
        format: photo.format,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Camera failed" };
    }
  }
  return { error: "unsupported on web" };
}

/** Take a picture with camera. Returns { webPath, base64String }. Native only. */
export async function takePicture(): Promise<TakePictureResult> {
  if (!isNativePlatform()) return { error: "unsupported on web" };
  try {
<<<<<<< HEAD
    const { Camera, CameraResultType } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
=======
    const { Camera } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: "base64",
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
    });
    return {
      webPath: photo.webPath,
      base64String: photo.base64String,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Camera failed" };
  }
}

/** Pick an image from the gallery. Returns { webPath, base64String }. Native only. */
export async function pickFromGallery(): Promise<TakePictureResult> {
  if (!isNativePlatform()) return { error: "unsupported on web" };
  try {
<<<<<<< HEAD
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
=======
    const { Camera } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: "base64",
      source: "photos",
>>>>>>> e4b6a15 (Checkpoint: auth wiring, env setup, dev/app route split, capacitor config updates)
    });
    return {
      webPath: photo.webPath,
      base64String: photo.base64String,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gallery failed" };
  }
}
