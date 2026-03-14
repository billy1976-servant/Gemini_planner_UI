/**
 * Records a single MediaStream (e.g. host's mixed stream).
 * Phase 2: host uses this to record room audio and upload as prayer.
 * Phase 3: may add server-side LiveKit room recording or a path that feeds
 * LiveKit composite audio into a similar pipeline; this class remains for
 * client-side recording of the host's mixed stream.
 */

export class PrayerRoomRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  start(stream: MediaStream, mimeType?: string): void {
    if (this.mediaRecorder?.state === "recording") return;
    this.chunks = [];
    const hasVideo = stream.getVideoTracks().length > 0;
    const defaultMime = hasVideo ? "video/webm;codecs=vp9,opus" : "audio/webm;codecs=opus";
    const preferred = mimeType || defaultMime;
    const fallbacks = hasVideo
      ? [preferred, "video/webm", "video/webm;codecs=vp8", "video/mp4"]
      : [preferred, "audio/webm", "audio/mp4"];
    let selectedMime: string | undefined;
    for (const t of fallbacks) {
      if (t && typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        selectedMime = t;
        break;
      }
    }
    const options = selectedMime ? { mimeType: selectedMime, videoBitsPerSecond: hasVideo ? 2_500_000 : undefined } : undefined;
    this.mediaRecorder = new MediaRecorder(stream, options);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(1000);
  }

  stop(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") return;
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
  }

  getBlob(): Blob | null {
    if (this.chunks.length === 0) return null;
    const type = this.mediaRecorder?.mimeType ?? "audio/webm";
    return new Blob(this.chunks, { type });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
