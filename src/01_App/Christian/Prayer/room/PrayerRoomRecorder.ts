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

  start(stream: MediaStream, mimeType = "audio/webm;codecs=opus"): void {
    if (this.mediaRecorder?.state === "recording") return;
    this.chunks = [];
    // Prefer Opus in WebM, but fall back to Safari-safe containers when needed.
    let selectedMime: string | undefined;
    const preferredTypes = [mimeType, "audio/webm", "audio/mp4"];
    for (const t of preferredTypes) {
      if (t && typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        selectedMime = t;
        break;
      }
    }
    const options = selectedMime ? { mimeType: selectedMime } : undefined;
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
    return new Blob(this.chunks, { type: this.mediaRecorder?.mimeType ?? "audio/webm" });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
