"use client";

/**
 * Container Creations — 6-step instructional onboarding (plan: container_creations_onboarding_page).
 * One concept per step; user agrees before continuing.
 * Uses only landing-theme.css and existing layout classes.
 */
import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import "@/app/landing/landing-theme.css";

const SHOP_URL = "https://containercreations.com";
const SHOP_VENTS_URL = "https://containercreations.com/collections/all";
const SHOP_SKYLIGHTS_URL = "https://containercreations.com/products/shipping-container-skylight";
const TOTAL_STEPS = 6;

function GreenCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", flexShrink: 0 }} aria-hidden>
      <circle cx="11" cy="11" r="10" fill="#16a34a" />
      <path d="M6 11l3.5 3.5L16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam !== null) {
      const n = parseInt(stepParam, 10);
      if (!Number.isNaN(n) && n >= 0 && n <= 5) setOnboardingStep(n);
    }
  }, [searchParams]);

  const handleContinue = useCallback(() => {
    setOnboardingStep((s) => Math.min(5, s + 1));
  }, []);
  const handleBack = useCallback(() => {
    setOnboardingStep((s) => Math.max(0, s - 1));
  }, []);

  const isHero = onboardingStep === 0;
  const isStamped = onboardingStep === 1;
  const isWhiteStep = onboardingStep >= 2;

  const rootClassName = [
    "landing-container-creations",
    isHero ? " landing-step-hero" : "",
    isStamped ? " landing-step-stamped" : "",
    isWhiteStep ? " measure-step-active" : "",
  ].join("");

  return (
    <div className={rootClassName} data-landing="onboarding">
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
          background: isHero || isStamped || isWhiteStep ? "#fff" : "var(--landing-steel-bg, #1a1d23)",
          borderBottom: isHero || isStamped || isWhiteStep ? "1px solid #e2e8f0" : "1px solid var(--landing-steel-border, #2d3239)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: isHero || isStamped || isWhiteStep ? "var(--landing-steel-muted, #64748b)" : "var(--landing-steel-muted, #64748b)",
            }}
            aria-live="polite"
          >
            Step {onboardingStep + 1} of {TOTAL_STEPS}
          </span>
          {onboardingStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: isHero || isStamped || isWhiteStep ? "#1a1d23" : "var(--landing-steel-fg, #e2e8f0)",
                background: "transparent",
                border: `1px solid ${isHero || isStamped || isWhiteStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          ) : null}
        </div>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: isHero || isStamped || isWhiteStep ? "#1a1d23" : "var(--landing-steel-fg, #e2e8f0)",
            background: "transparent",
            border: `1px solid ${isHero || isStamped || isWhiteStep ? "#e2e8f0" : "var(--landing-steel-border, #2d3239)"}`,
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Shop Now
        </a>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: onboardingStep === 3 ? "100vh" : "calc(100vh - 52px)",
          ...(onboardingStep === 0 ? {} : onboardingStep === 3 ? { padding: 0, display: "flex", justifyContent: "center", alignItems: "flex-start" } : { padding: "1.5rem 1rem", maxWidth: 720, margin: "0 auto" }),
        }}
      >
        {/* Step 0 — Hero Introduction */}
        {onboardingStep === 0 && (
          <>
            <section style={{ position: "relative", width: "100%", overflow: "hidden" }}>
              <video autoPlay muted loop playsInline style={{ width: "100%", height: "auto", display: "block" }}>
                <source src="/Videos/hero-install.mp4.mp4" type="video/mp4" />
              </video>
              <img
                src="/images/logo-container-creations.webp"
                alt="Container Creations"
                style={{ position: "absolute", top: "20px", left: "20px", width: "140px", height: "auto", zIndex: 10 }}
              />
            </section>
            <div className="hero-intro">
              <h1 className="hero-title">Upgrade Your Shipping Container</h1>
              <p className="hero-subtitle">Ventilation • Natural Light • Structural Integration</p>
              <p style={{ fontSize: "1rem", opacity: 0.9, marginTop: 12, marginBottom: 0 }}>
                Before you buy, take 60 seconds to understand how the system works.
              </p>
              <button type="button" className="hero-cta" onClick={handleContinue}>
                Start the Guide
              </button>
            </div>
          </>
        )}

        {/* Step 1 — Structural Integrity */}
        {onboardingStep === 1 && (
          <div className="landing-content-block">
            <section
              className="stamped-section"
              style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", padding: "48px 24px 56px" }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: "0 0 16px",
                  color: "#1a1d23",
                }}
              >
                Precision-Stamped Structural Steel
              </h2>
              <p style={{ fontSize: "1.125rem", opacity: 0.85, margin: "0 0 24px", lineHeight: 1.5, color: "#1a1d23" }}>
                The original container roof adapter — formed from a single 20-gauge steel press.
              </p>
              <div style={{ marginBottom: 16 }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  src="/Videos/pressed-steel.mp4.mp4"
                  style={{ width: "100%", maxWidth: 560, height: "auto", display: "block", margin: "0 auto" }}
                />
                <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: "12px auto 0", maxWidth: 480, lineHeight: 1.45, color: "#1a1d23" }}>
                  Each base is formed in a single industrial press — not assembled from multiple welded parts.
                </p>
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 20px", textAlign: "left", color: "#1a1d23" }}>
                Structural Integrity Checklist
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 28px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px 32px",
                  textAlign: "left",
                }}
              >
                {[
                  { title: "One-piece stamped steel construction", sub: "Single press, no assembly." },
                  { title: "Stronger than thin roof vents", sub: "Built for container environments." },
                  { title: "No welded seams in the product body", sub: "Eliminates weak points." },
                  { title: "Built specifically for container environments", sub: "Engineered for corrugated roofs." },
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: "0.9375rem", lineHeight: 1.45 }}>
                    <span aria-hidden><GreenCheck /></span>
                    <span>
                      <strong style={{ display: "block", marginBottom: 2, color: "#1a1d23" }}>{item.title}</strong>
                      <span style={{ opacity: 0.9, color: "#1a1d23" }}>{item.sub}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: "1rem", opacity: 0.9, margin: "0 0 28px", lineHeight: 1.5, color: "#1a1d23" }}>
                If you&apos;re cutting your container roof, structural strength matters.
              </p>
              <button type="button" className="hero-cta" onClick={handleContinue}>
                Check Your Structural Fit
              </button>
            </section>
          </div>
        )}

        {/* Step 2 — Airflow Education */}
        {onboardingStep === 2 && (
          <div className="landing-content-block">
            <section className="stamped-section vent-section" style={{ color: "#1a1d23" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 16 }}>
                Why Vent Size Matters
              </h2>
              <img
                src="/images/12_%20vent.png"
                alt="12-inch vent — airflow and moisture control"
                className="measure-roof-image"
              />
              <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", marginBottom: 24, textAlign: "left", fontSize: "1.125rem", lineHeight: 1.6 }}>
                <li>Larger diameter vents move significantly more air</li>
                <li>Proper airflow prevents moisture buildup</li>
                <li>Correct ventilation protects stored equipment</li>
              </ul>
              <p style={{ fontSize: "1rem", opacity: 0.9, marginBottom: 28, lineHeight: 1.5 }}>
                If ventilation is your goal, airflow size is the most important factor.
              </p>
              <button type="button" className="hero-cta" onClick={handleContinue}>
                Continue
              </button>
            </section>
          </div>
        )}

        {/* Step 3 — Container Fit */}
        {onboardingStep === 3 && (
          <div style={{ width: "100%", maxWidth: 900, padding: "24px", margin: "0 auto" }}>
            <section className="stamped-section measure-roof-section" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 16, color: "#1a1d23" }}>
                Container Fit
              </h2>
              <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 0, color: "#1a1d23" }}>
                Check your roof corrugation before ordering. Container roofs use a corrugated pattern; checking your spacing ensures the vent sits correctly.
              </p>
              <img
                src="/images/Measure-roof.jpg.jpg"
                alt="Measure your container roof corrugation"
                style={{
                  width: "100%",
                  maxWidth: 520,
                  height: "auto",
                  display: "block",
                  margin: "24px auto",
                }}
              />
              <button type="button" className="hero-cta" onClick={handleContinue}>
                Ventilate your container
              </button>
            </section>
          </div>
        )}

        {/* Step 4 — Natural Light Upgrade */}
        {onboardingStep === 4 && (
          <div className="landing-content-block">
            <section className="stamped-section" style={{ color: "#1a1d23" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 16 }}>
                Natural Light Upgrade
              </h2>
              <p style={{ fontSize: "1.125rem", opacity: 0.9, marginBottom: 24, lineHeight: 1.5 }}>
                Add a skylight to bring daylight inside the container — a safer working environment and better visibility for tools and storage.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", textAlign: "left", fontSize: "1rem", lineHeight: 1.6 }}>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <GreenCheck /><span>Daylight inside the container</span>
                </li>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <GreenCheck /><span>Safer working environment</span>
                </li>
                <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <GreenCheck /><span>Better visibility for tools and storage</span>
                </li>
              </ul>
              <img
                src="/images/Container%20Images%20(1).jpg"
                alt="Skylight natural light in container"
                style={{ width: "100%", maxWidth: 560, height: "auto", display: "block", margin: "0 auto 28px" }}
              />
              <button type="button" className="hero-cta" onClick={handleContinue}>
                Show me the final recommendation
              </button>
            </section>
          </div>
        )}

        {/* Step 5 — Final Recommendation */}
        {onboardingStep === 5 && (
          <div className="landing-content-block">
            <section className="stamped-section" style={{ color: "#1a1d23", textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 24 }}>
                Your Container Upgrade System
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 28px",
                  textAlign: "left",
                  maxWidth: 480,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {[
                  "Structural stamped steel vent",
                  "Proper airflow for moisture control",
                  "Correct fit for corrugated roofs",
                  "Optional skylight for natural light",
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, fontSize: "1.0625rem" }}>
                    <GreenCheck />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: "1.125rem", opacity: 0.9, marginBottom: 32, lineHeight: 1.5 }}>
                You&apos;re ready to choose.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
                <a
                  href={SHOP_VENTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-cta"
                  style={{ textDecoration: "none", display: "inline-block" }}
                >
                  Shop Vents
                </a>
                <a
                  href={SHOP_SKYLIGHTS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "14px 30px",
                    fontSize: "18px",
                    borderRadius: "8px",
                    border: "1px solid #2d3239",
                    background: "transparent",
                    color: "#1a1d23",
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  Shop Skylights
                </a>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="landing-container-creations measure-step-active" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--landing-steel-muted)" }}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
