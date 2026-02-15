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
      const { Camera, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
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
    const { Camera, CameraResultType } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
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
    const { Camera, CameraResultType } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: "photos",
    });
    return {
      webPath: photo.webPath,
      base64String: photo.base64String,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gallery failed" };
  }
}
