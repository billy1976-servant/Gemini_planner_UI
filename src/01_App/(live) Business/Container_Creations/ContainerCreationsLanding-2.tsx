"use client";

import React, { useState } from "react";
import { useSyncExternalStore } from "react";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import {
  getEditorMode,
  subscribeEditorMode,
} from "@/07_Dev_Tools/editor/editor-mode-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/07_Dev_Tools/dev/device-preview-store";
import { getCardDevice } from "@/07_Dev_Tools/dev/preview-derivations";
import "@/app/landing/landing-theme.css";

const SHOP_URL = "https://containercreations.com";

/** Renders a visible placeholder and logs a warning when media src is missing or fails to load. */
function MediaPlaceholder({ label, className }: { label: string; className?: string }) {
  if (typeof console !== "undefined") {
    console.warn("[ContainerCreations] Missing or failed media:", label);
  }
  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "0.875rem",
      }}
    >
      {label}
    </div>
  );
}

const steps = [
  "Intro",
  "Verify Container Type",
  "Measure Roof Opening",
  "Verify Vent Fit",
  "Calculate Airflow",
  "Choose Vent Size",
  "Final Recommendation",
];

const STRUCTURAL_CHECKLIST = [
  { title: "20-Gauge Structural Steel", sub: "Built for the strength of container roofs." },
  { title: "Single-Stamp Formed Base", sub: "Pressed from one piece of steel for strength and consistency." },
  { title: "No Welded Seams", sub: "Eliminates weak joints and distortion points." },
  { title: "Precision-Formed Seal Surface", sub: "Creates a tight, consistent weather seal." },
  { title: "Original Patented Design", sub: "The first vent base engineered specifically for containers." },
];

export default function ContainerCreationsLanding2() {
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const isEditor = editorMode === "editor";
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );
  const cardDevice = getCardDevice(shellDevice, editorMode);
  const [step, setStep] = useState(0);
  const [heroVideoError, setHeroVideoError] = useState(false);
  const isHero = step === 0;
  const isLightStep = step === 0 || step === 1 || step === 2;

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const renderStep0 = () => (
    <>
      <section className="landing-hero-video-wrap" style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        {heroVideoError ? (
          <MediaPlaceholder label="Intro video" />
        ) : (
          <video autoPlay muted loop playsInline onError={() => setHeroVideoError(true)}>
            <source src="/Videos/hero-install.mp4.mp4" type="video/mp4" />
          </video>
        )}
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: "absolute", top: 24, right: 24, color: "#fff", fontWeight: 600, textDecoration: "none", zIndex: 10 }}
        >
          Shop Now
        </a>
      </section>
      <div className="hero-intro">
        <h1 className="hero-title">Upgrade Your Shipping Container</h1>
        <p className="hero-subtitle">Ventilation • Natural Light • Structural Integration</p>
        <div className="hero-badge">60-Minute DIY Install • No Welding Required</div>
        <button type="button" className="hero-cta" onClick={goNext}>
          Explore the Container Upgrade System
        </button>
      </div>
    </>
  );

  const renderStep1 = () => (
    <div className="landing-content-block">
      <section className="cc-stamped-section">
        <h2 className="cc-stamped-heading">Precision-Stamped Structural Steel</h2>
        <div className="cc-stamped-description">
          <p>The Original Container Roof Adapter — Formed from a Single 20-Gauge Steel Press.</p>
          <p>This isn&apos;t a generic roof vent. It&apos;s a structural adapter system for container roofs.</p>
        </div>
        <div className="landing-phone-video-wrap" style={{ marginBottom: 16 }}>
          <video autoPlay muted loop playsInline src="/Videos/pressed-steel.mp4.mp4" />
          <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: "12px auto 0", maxWidth: 480, lineHeight: 1.45 }}>
            Each base is formed in a single industrial press — not assembled from multiple welded parts.
          </p>
        </div>
        <h3 className="cc-stamped-checklist-heading" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Structural Integrity Checklist</h3>
        <ul className="cc-stamped-checklist" style={{ listStyle: "none", padding: 0 }}>
          {STRUCTURAL_CHECKLIST.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: "0.9375rem", lineHeight: 1.45, marginBottom: 12 }}>
              <span style={{ flexShrink: 0 }} aria-hidden>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                  <circle cx="11" cy="11" r="10" fill="#16a34a" />
                  <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong style={{ display: "block", marginBottom: 2 }}>{item.title}</strong>
                <span style={{ opacity: 0.9 }}>{item.sub}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="cc-step-nav">
          <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2d3239", background: "transparent", color: "#1a1d23", fontWeight: 600, cursor: "pointer" }}>Back</button>
          <button type="button" className="hero-cta" onClick={goNext}>Check Your Structural Fit</button>
        </div>
      </section>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ width: "100%", background: "#fff", display: "flex", justifyContent: "center" }}>
      <div className="landing-content-block">
        <div className="cc-two-col">
          <div className="cc-text">
            <h2 style={{ color: "#1a1d23" }}>Check your roof corrugation before ordering.</h2>
            <p style={{ color: "#1a1d23" }}>Measure your roof rib height so we can recommend the right adapter.</p>
          </div>
          <div className="cc-media-card" style={{ background: "#f1f5f9", borderColor: "#e2e8f0" }}>
            <img src="/images/Measure-roof.jpg.jpg" alt="Measure your container roof" style={{ width: "100%", height: "auto" }} />
          </div>
        </div>
        <div className="cc-step-nav">
          <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2d3239", background: "transparent", color: "#1a1d23", fontWeight: 600, cursor: "pointer" }}>Back</button>
          <button type="button" className="hero-cta" onClick={goNext}>Ventilate your container</button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="landing-content-block">
      <div className="cc-two-col">
        <div className="cc-text">
          <h2>12″ vent — airflow and moisture control</h2>
          <p>Optimized for container roofs. Airflow is king with moisture control.</p>
          <div className="cc-step-nav">
            <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button type="button" className="hero-cta" onClick={goNext}>Continue</button>
          </div>
        </div>
        <div className="cc-media-card">
          <img src="/images/12_%20vent.png" alt="12 vent — airflow and moisture control" style={{ width: "100%", height: "auto" }} />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="landing-content-block">
      <div className="cc-two-col">
        <div className="cc-text">
          <h2>Cut Once. Upgrade Fully.</h2>
          <p>See the difference natural light makes.</p>
          <p>You&apos;re already cutting structural steel.</p>
          <p>Upgrade light while you&apos;re there.</p>
          <div className="cc-step-nav">
            <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <button type="button" className="hero-cta" onClick={goNext}>See why we lead</button>
          </div>
        </div>
        <div className="cc-media-card">
          <BeforeAfterSlider
            beforeSrc="/images/Container%20Images%20(1).jpg"
            afterSrc="/images/Container%20Images%20(1).jpg"
            altBefore="Container without skylight"
            altAfter="Same space with natural light"
            darkenBefore
            objectFit="contain"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="landing-content-block">
      <div className="cc-two-col">
        <div className="cc-media-card">
          <img src="/images/Container%20Images%20(8).jpg" alt="Final install" style={{ width: "100%", height: "auto" }} />
        </div>
        <div className="cc-text">
          <h2>Built to Outlast the Container.</h2>
          <p>Formed 20-gauge adapter. No weld distortion. Designed for container rib transfer. Hundreds of 5-star installs.</p>
          <p style={{ fontSize: "1.25rem", marginBottom: 8 }}>★★★★★</p>
          <p style={{ fontStyle: "italic", marginBottom: 4 }}>I ordered a second set immediately after I opened the box.</p>
          <p style={{ opacity: 0.85, marginBottom: 24 }}>– David S, Payson AZ</p>
          <div className="cc-step-nav">
            <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>Back</button>
            <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="hero-cta" style={{ display: "inline-block", textDecoration: "none", marginTop: 0 }}>Build My Container System</a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="landing-content-block">
      <div className="cc-two-col">
        <div className="cc-text">
          <h2>Final Recommendation</h2>
          <p>Summary and recommended vent size based on your inputs. (Step 7 placeholder for dev grid.)</p>
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="hero-cta" style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}>Build My Container System</a>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`landing-container-creations${isHero ? " landing-step-hero" : ""}${step === 1 ? " landing-step-stamped" : ""}${step === 2 ? " measure-step-active" : ""}`}
      data-landing="container-creations"
    >
      <header
        className="landing-shop-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          background: isLightStep ? "#fff" : "var(--landing-steel-bg, #1a1d23)",
          borderBottom: `1px solid ${isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
        }}
      >
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/images/logo-container-creations.webp"
            alt="Container Creations"
            style={{ width: 120, height: "auto" }}
          />
        </a>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: isLightStep ? "#1a1d23" : "var(--landing-steel-fg, #e2e8f0)",
            background: "transparent",
            border: `1px solid ${isLightStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Shop Now
        </a>
      </header>

      <main style={{ flex: 1, minHeight: step === 2 && !isEditor ? "100vh" : "calc(100vh - 52px)" }}>
        {isEditor ? (
          <div
            className="dev-flow-grid editor-cards-phone"
            data-card-device={cardDevice}
          >
            <div className="dev-step">
              <h3>Step 1 – Intro</h3>
              {renderStep0()}
            </div>
            <div className="dev-step">
              <h3>Step 2 – Verify Container</h3>
              {renderStep1()}
            </div>
            <div className="dev-step">
              <h3>Step 3 – Measure Corrugation</h3>
              {renderStep2()}
            </div>
            <div className="dev-step">
              <h3>Step 4 – Verify Vent Fit</h3>
              {renderStep3()}
            </div>
            <div className="dev-step">
              <h3>Step 5 – Calculate Airflow</h3>
              {renderStep4()}
            </div>
            <div className="dev-step">
              <h3>Step 6 – Choose Vent Size</h3>
              {renderStep5()}
            </div>
            <div className="dev-step">
              <h3>Step 7 – Final Recommendation</h3>
              {renderStep6()}
            </div>
          </div>
        ) : (
          <>
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            {step === 6 && renderStep6()}

            <aside className="stepTracker" aria-label="Vent Installation Checklist">
          <h3 className="stepTracker-title">Vent Installation Checklist</h3>
          <p className="stepTracker-description">
            Follow these steps to verify your container ventilation before cutting the roof opening.
          </p>
          <ul className="stepTracker-list">
            {steps.map((label, i) => {
              const status =
                i < step ? "done" :
                i === step ? "current" :
                "todo";
              const icon = status === "done" ? "✔" : status === "current" ? "➜" : "○";

              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={`stepTracker-item stepTracker-item--${status}`}
                  >
                    <span className="stepTracker-icon" aria-hidden>{icon}</span>
                    <span className="stepTracker-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
          </>
        )}
      </main>
    </div>
  );
}
