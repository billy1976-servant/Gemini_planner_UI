"use client";

export const dynamic = "force-dynamic";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* ============================================================
   MOBILE HARDWARE TEST PAGE
   Standalone device validation — real browser APIs only.
   No engine, layout, capability, or System7.
   Use: http://YOUR-IP:3000/diagnostics/mobile-test on a phone.
============================================================ */

type TestAllResult = {
  camera: "idle" | "pass" | "fail";
  gps: "idle" | "pass" | "fail";
  mic: "idle" | "pass" | "fail";
  motion: "idle" | "pass" | "fail";
  battery: "idle" | "pass" | "fail";
  network: "idle" | "pass" | "fail";
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "16px",
    paddingBottom: "32px",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    color: "#1a1a1a",
    background: "#f5f5f5",
  },
  h1: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: 700,
  },
  subtitle: {
    margin: "0 0 20px 0",
    fontSize: "12px",
    color: "#666",
  },
  section: {
    background: "#fff",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "14px",
    fontWeight: 600,
  },
  btn: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    minHeight: "44px",
    width: "100%",
    maxWidth: "280px",
  },
  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
  },
  btnSecondary: {
    background: "#e5e7eb",
    color: "#1a1a1a",
  },
  statusPass: { color: "#059669", fontWeight: 600 },
  statusFail: { color: "#dc2626", fontWeight: 600 },
  statusIdle: { color: "#6b7280" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "12px",
  },
  gridItem: {
    padding: "12px",
    borderRadius: "8px",
    textAlign: "center" as const,
    fontSize: "13px",
    fontWeight: 600,
  },
  video: {
    width: "100%",
    maxWidth: "320px",
    height: "240px",
    objectFit: "cover",
    borderRadius: "8px",
    background: "#000",
  },
  canvas: {
    width: "100%",
    maxWidth: "320px",
    borderRadius: "8px",
    marginTop: "8px",
    display: "block",
  },
  levelBar: {
    height: "12px",
    borderRadius: "6px",
    background: "#e5e7eb",
    overflow: "hidden",
    marginTop: "8px",
    maxWidth: "200px",
  },
  levelFill: {
    height: "100%",
    background: "#2563eb",
    transition: "width 0.1s ease",
  },
  mono: {
    fontFamily: "ui-monospace, monospace",
    fontSize: "12px",
    wordBreak: "break-all" as const,
  },
};

export default function MobileTestPage() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gps, setGps] = useState<{
    lat: number | null;
    lon: number | null;
    accuracy: number | null;
    error: string | null;
  }>({ lat: null, lon: null, accuracy: null, error: null });
  const [gpsLoading, setGpsLoading] = useState(false);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  const [deviceInfo, setDeviceInfo] = useState<{
    userAgent: string;
    platform: string;
    width: number;
    height: number;
    devicePixelRatio: number;
    orientation: string;
  } | null>(null);

  const [battery, setBattery] = useState<{
    level: number | null;
    charging: boolean | null;
    supported: boolean;
    error?: string;
  }>({ level: null, charging: null, supported: false });

  const [network, setNetwork] = useState<{
    online: boolean;
    effectiveType: string | null;
  }>({ online: false, effectiveType: null });

  const [motion, setMotion] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  const [screenInfo, setScreenInfo] = useState<{
    width: number;
    height: number;
    orientation: string;
  }>({ width: 0, height: 0, orientation: "unknown" });

  const [testAll, setTestAll] = useState<TestAllResult>({
    camera: "idle",
    gps: "idle",
    mic: "idle",
    motion: "idle",
    battery: "idle",
    network: "idle",
  });
  const [testAllRunning, setTestAllRunning] = useState(false);

  // ——— Camera ———
  const startCamera = useCallback(() => {
    setCameraError(null);
    setCapturedImageUrl(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("getUserMedia not supported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setCameraStream(stream);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        setCameraError(err?.message ?? "Permission denied");
        setCameraStream(null);
      });
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraStream) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg");
    setCapturedImageUrl(url);
  }, [cameraStream]);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  // ——— GPS ———
  const readGps = useCallback(() => {
    setGpsLoading(true);
    setGps({ lat: null, lon: null, accuracy: null, error: null });
    if (typeof navigator === "undefined" || !navigator.geolocation?.getCurrentPosition) {
      setGps({ lat: null, lon: null, accuracy: null, error: "Geolocation not supported" });
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          error: null,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGps({
          lat: null,
          lon: null,
          accuracy: null,
          error: err?.message ?? "Permission denied or error",
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ——— Microphone + level ———
  const startMic = useCallback(() => {
    setMicError(null);
    setMicLevel(0);
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("getUserMedia not supported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setMicStream(stream);
        setMicError(null);
        try {
          const ac = new AudioContext();
          const source = ac.createMediaStreamSource(stream);
          const analyser = ac.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;
          const data = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = data.length ? sum / data.length : 0;
            setMicLevel(Math.min(100, (avg / 255) * 150));
            animationRef.current = requestAnimationFrame(tick);
          };
          tick();
        } catch {
          setMicLevel(50);
        }
      })
      .catch((err) => {
        setMicError(err?.message ?? "Permission denied");
        setMicStream(null);
      });
  }, [micStream]);

  useEffect(() => {
    return () => {
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [micStream]);

  // ——— Device / Screen (read once and on resize) ———
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof window === "undefined") return;
    const update = () => {
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      setNetwork({
        online: navigator.onLine,
        effectiveType: conn?.effectiveType ?? null,
      });
      setDeviceInfo({
        userAgent: navigator.userAgent ?? "",
        platform: navigator.platform ?? "unknown",
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio ?? 1,
        orientation:
          typeof window.screen?.orientation?.type === "string"
            ? window.screen.orientation.type
            : window.innerWidth > window.innerHeight
              ? "landscape-primary"
              : "portrait-primary",
      });
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation:
          typeof window.screen?.orientation?.type === "string"
            ? window.screen.orientation.type
            : window.innerWidth > window.innerHeight
              ? "landscape"
              : "portrait",
      });
    };
    update();
    window.addEventListener("resize", update);
    if (window.screen?.orientation) window.screen.orientation.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      if (window.screen?.orientation) window.screen.orientation.removeEventListener("change", update);
    };
  }, []);

  // ——— Battery ———
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (!nav.getBattery) {
      setBattery({ level: null, charging: null, supported: false, error: "Battery API not supported" });
      return;
    }
    nav
      .getBattery()
      .then((b) => {
        setBattery({
          level: b.level,
          charging: b.charging,
          supported: true,
        });
        (b as any).addEventListener("levelchange", () =>
          setBattery(prev => ({ ...prev, level: b.level }))
        );
        (b as any).addEventListener("chargingchange", () =>
          setBattery(prev => ({ ...prev, charging: b.charging }))
        );
      })
      .catch((e) => setBattery({ level: null, charging: null, supported: false, error: String(e) }));
  }, []);

  // ——— Motion & Orientation ———
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMotion = (ev: DeviceMotionEvent) => {
      const acc = ev.accelerationIncludingGravity ?? ev.acceleration;
      if (acc) setMotion({ x: acc.x ?? 0, y: acc.y ?? 0, z: acc.z ?? 0 });
    };
    const onOrientation = (ev: DeviceOrientationEvent) => {
      setOrientation({
        alpha: ev.alpha ?? 0,
        beta: ev.beta ?? 0,
        gamma: ev.gamma ?? 0,
      });
    };
    window.addEventListener("devicemotion", onMotion, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  // ——— TEST ALL ———
  const runTestAll = useCallback(async () => {
    setTestAllRunning(true);
    setTestAll({
      camera: "idle",
      gps: "idle",
      mic: "idle",
      motion: "idle",
      battery: "idle",
      network: "idle",
    });

    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    setTestAll((prev) => ({
      ...prev,
      network: nav && nav.onLine ? "pass" : "fail",
    }));

    const getBattery = (nav as Navigator & { getBattery?: () => Promise<{ level: number }> })?.getBattery;
    if (getBattery) {
      try {
        const b = await getBattery.call(navigator);
        setTestAll((prev) => ({ ...prev, battery: typeof b.level === "number" ? "pass" : "fail" }));
      } catch {
        setTestAll((prev) => ({ ...prev, battery: "fail" }));
      }
    } else {
      setTestAll((prev) => ({ ...prev, battery: "fail" }));
    }

    if (nav?.mediaDevices?.getUserMedia) {
      try {
        const stream = await nav.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setTestAll((prev) => ({ ...prev, camera: "pass" }));
      } catch {
        setTestAll((prev) => ({ ...prev, camera: "fail" }));
      }
    } else {
      setTestAll((prev) => ({ ...prev, camera: "fail" }));
    }

    if (nav?.mediaDevices?.getUserMedia) {
      try {
        const stream = await nav.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setTestAll((prev) => ({ ...prev, mic: "pass" }));
      } catch {
        setTestAll((prev) => ({ ...prev, mic: "fail" }));
      }
    } else {
      setTestAll((prev) => ({ ...prev, mic: "fail" }));
    }

    if (nav?.geolocation?.getCurrentPosition) {
      await new Promise<void>((resolve) => {
        nav.geolocation.getCurrentPosition(
          () => {
            setTestAll((prev) => ({ ...prev, gps: "pass" }));
            resolve();
          },
          () => {
            setTestAll((prev) => ({ ...prev, gps: "fail" }));
            resolve();
          },
          { timeout: 8000, maximumAge: 0 }
        );
      });
    } else {
      setTestAll((prev) => ({ ...prev, gps: "fail" }));
    }

    let motionResult: "pass" | "fail" = "fail";
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      const req = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
      if (typeof req === "function") {
        try {
          const result = await req();
          motionResult = result === "granted" ? "pass" : "fail";
        } catch {
          motionResult = "fail";
        }
      } else {
        motionResult = "pass";
      }
    }
    setTestAll((prev) => ({ ...prev, motion: motionResult }));

    setTestAllRunning(false);
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Mobile Hardware Test</h1>
      <p style={styles.subtitle}>
        Real device APIs — camera, GPS, mic, battery, network, motion. Allow permissions when prompted.
      </p>

      {/* TEST ALL */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>TEST ALL</h2>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={runTestAll}
          disabled={testAllRunning}
        >
          {testAllRunning ? "Testing…" : "TEST ALL"}
        </button>
        <div style={styles.grid}>
          {(["camera", "gps", "mic", "motion", "battery", "network"] as const).map((key) => (
            <div
              key={key}
              style={{
                ...styles.gridItem,
                background:
                  testAll[key] === "pass"
                    ? "#d1fae5"
                    : testAll[key] === "fail"
                      ? "#fee2e2"
                      : "#f3f4f6",
                color:
                  testAll[key] === "pass"
                    ? "#065f46"
                    : testAll[key] === "fail"
                      ? "#991b1b"
                      : "#6b7280",
              }}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
              {testAll[key] === "pass" ? "PASS" : testAll[key] === "fail" ? "FAIL" : "—"}
            </div>
          ))}
        </div>
      </section>

      {/* Camera */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Camera</h2>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={startCamera}
        >
          {cameraStream ? "Stop camera" : "Start camera"}
        </button>
        {cameraError && <p style={styles.statusFail}>{cameraError}</p>}
        {cameraStream && (
          <>
            <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary, marginTop: 8 }}
              onClick={capturePhoto}
            >
              Capture
            </button>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
        {capturedImageUrl && (
          <img src={capturedImageUrl} alt="Captured" style={styles.canvas} />
        )}
      </section>

      {/* GPS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>GPS</h2>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={readGps}
          disabled={gpsLoading}
        >
          {gpsLoading ? "Getting position…" : "Get position"}
        </button>
        {gps.error && <p style={styles.statusFail}>{gps.error}</p>}
        {(gps.lat != null || gps.lon != null) && (
          <p style={styles.mono}>
            Lat: {gps.lat?.toFixed(6)} · Lon: {gps.lon?.toFixed(6)}
            {gps.accuracy != null && ` · Accuracy: ${Math.round(gps.accuracy)} m`}
          </p>
        )}
      </section>

      {/* Microphone */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Microphone</h2>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={startMic}
        >
          {micStream ? "Stop mic" : "Start mic"}
        </button>
        {micError && <p style={styles.statusFail}>{micError}</p>}
        {micStream && (
          <>
            <p style={styles.statusPass}>Permission granted — stream active</p>
            <div style={styles.levelBar}>
              <div style={{ ...styles.levelFill, width: `${micLevel}%` }} />
            </div>
          </>
        )}
      </section>

      {/* Device Info */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Device info</h2>
        {deviceInfo && (
          <>
            <p style={styles.mono}>userAgent: {deviceInfo.userAgent.slice(0, 80)}…</p>
            <p style={styles.mono}>platform: {deviceInfo.platform}</p>
            <p style={styles.mono}>
              screen: {deviceInfo.width} × {deviceInfo.height} · dpr: {deviceInfo.devicePixelRatio}
            </p>
            <p style={styles.mono}>orientation: {deviceInfo.orientation}</p>
          </>
        )}
      </section>

      {/* Battery */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Battery</h2>
        {!battery.supported && battery.error && <p style={styles.statusFail}>{battery.error}</p>}
        {battery.supported && (
          <p style={styles.mono}>
            level: {battery.level != null ? `${Math.round(battery.level * 100)}%` : "—"} · charging:{" "}
            {battery.charging != null ? (battery.charging ? "yes" : "no") : "—"}
          </p>
        )}
      </section>

      {/* Network */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Network</h2>
        <p style={styles.mono}>
          online: {network.online ? "yes" : "no"} · effectiveType: {network.effectiveType ?? "—"}
        </p>
      </section>

      {/* Motion / Orientation */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Motion & orientation</h2>
        <p style={styles.mono}>
          Motion x: {motion.x.toFixed(2)} · y: {motion.y.toFixed(2)} · z: {motion.z.toFixed(2)}
        </p>
        <p style={styles.mono}>
          Orientation α: {orientation.alpha.toFixed(1)} · β: {orientation.beta.toFixed(1)} · γ:{" "}
          {orientation.gamma.toFixed(1)}
        </p>
      </section>

      {/* Screen */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Screen</h2>
        <p style={styles.mono}>
          width: {screenInfo.width} · height: {screenInfo.height} · orientation: {screenInfo.orientation}
        </p>
      </section>
    </div>
  );
}
