"use client";

import React, { useState } from "react";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import "@/app/landing/landing-theme.css";

const SHOP_URL = "https://containercreations.com";

const STRUCTURAL_CHECKLIST = [
  { title: "20-Gauge Structural Steel", sub: "Built for the strength of container roofs." },
  { title: "Single-Stamp Formed Base", sub: "Pressed from one piece of steel for strength and consistency." },
  { title: "No Welded Seams", sub: "Eliminates weak joints and distortion points." },
  { title: "Precision-Formed Seal Surface", sub: "Creates a tight, consistent weather seal." },
  { title: "Original Patented Design", sub: "The first vent base engineered specifically for containers." },
];

export default function ContainerCreationsLanding2() {
  const [step, setStep] = useState(0);
  const isHero = step === 0;
  const isLightStep = step === 0 || step === 1 || step === 2;

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

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

      <main style={{ flex: 1, minHeight: step === 2 ? "100vh" : "calc(100vh - 52px)" }}>
        {step === 0 && (
          <>
            <section style={{ position: "relative", width: "100%", overflow: "hidden" }}>
              <video autoPlay muted loop playsInline style={{ width: "100%", height: "auto", display: "block" }}>
                <source src="/Videos/hero-install.mp4.mp4" type="video/mp4" />
              </video>
              <img
                src="/images/logo-container-creations.webp"
                alt="Container Creations"
                style={{ position: "absolute", top: 20, left: 20, width: 140, height: "auto", zIndex: 10 }}
              />
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
            <section style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 32 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "1px solid #d0d0d0",
                    background: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                  }}
                >
                  Test Fit Your Container
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "1px solid #d0d0d0",
                    background: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                  }}
                >
                  Add Instant Light
                </button>
                <a
                  href={SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "1px solid #d0d0d0",
                    background: "#fff",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: "#1a1d23",
                    fontSize: "0.9375rem",
                  }}
                >
                  What To Know Before Buying
                </a>
              </div>
            </section>
          </>
        )}

        {step === 1 && (
          <div className="landing-content-block">
            <section className="cc-stamped-section">
              <h2 className="cc-stamped-heading">Precision-Stamped Structural Steel</h2>
              <div className="cc-stamped-description">
                <p>The Original Container Roof Adapter — Formed from a Single 20-Gauge Steel Press.</p>
                <p>This isn&apos;t a generic roof vent. It&apos;s a structural adapter system for container roofs.</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  src="/Videos/pressed-steel.mp4.mp4"
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    height: "auto",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    margin: "12px auto 0",
                    maxWidth: 480,
                    lineHeight: 1.45,
                  }}
                >
                  Each base is formed in a single industrial press — not assembled from multiple welded parts.
                </p>
              </div>
              <h3 className="cc-stamped-checklist-heading" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                Structural Integrity Checklist
              </h3>
              <ul className="cc-stamped-checklist" style={{ listStyle: "none", padding: 0 }}>
                {STRUCTURAL_CHECKLIST.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      fontSize: "0.9375rem",
                      lineHeight: 1.45,
                      marginBottom: 12,
                    }}
                  >
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
                <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2d3239", background: "transparent", color: "#1a1d23", fontWeight: 600, cursor: "pointer" }}>
                  Back
                </button>
                <button type="button" className="hero-cta" onClick={goNext}>
                  Check Your Structural Fit
                </button>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div style={{ width: "100%", minHeight: "100vh", background: "#fff", display: "flex", justifyContent: "center" }}>
            <div className="landing-content-block">
              <div className="cc-two-col">
                <div className="cc-text">
                  <h2 style={{ color: "#1a1d23" }}>Check your roof corrugation before ordering.</h2>
                  <p style={{ color: "#1a1d23" }}>Measure your roof rib height so we can recommend the right adapter.</p>
                  <div className="cc-step-nav">
                    <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2d3239", background: "transparent", color: "#1a1d23", fontWeight: 600, cursor: "pointer" }}>
                      Back
                    </button>
                    <button type="button" className="hero-cta" onClick={goNext}>
                      Ventilate your container
                    </button>
                  </div>
                </div>
                <div className="cc-media-card" style={{ background: "#f1f5f9", borderColor: "#e2e8f0" }}>
                  <img src="/images/Measure-roof.jpg.jpg" alt="Measure your container roof" style={{ width: "100%", height: "auto" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="landing-content-block">
            <div className="cc-two-col">
              <div className="cc-text">
                <h2>12″ vent — airflow and moisture control</h2>
                <p>Optimized for container roofs. Airflow is king with moisture control.</p>
                <div className="cc-step-nav">
                  <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>
                    Back
                  </button>
                  <button type="button" className="hero-cta" onClick={goNext}>
                    Continue
                  </button>
                </div>
              </div>
              <div className="cc-media-card">
                <img src="/images/12_%20vent.png" alt="12 vent — airflow and moisture control" style={{ width: "100%", height: "auto" }} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="landing-content-block">
            <div className="cc-two-col">
              <div className="cc-text">
                <h2>Cut Once. Upgrade Fully.</h2>
                <p>See the difference natural light makes.</p>
                <p>You&apos;re already cutting structural steel.</p>
                <p>Upgrade light while you&apos;re there.</p>
                <div className="cc-step-nav">
                  <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>
                    Back
                  </button>
                  <button type="button" className="hero-cta" onClick={goNext}>
                    See why we lead
                  </button>
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
        )}

        {step === 5 && (
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
                  <button type="button" onClick={goBack} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid var(--landing-steel-border)", background: "transparent", color: "var(--landing-steel-fg)", fontWeight: 600, cursor: "pointer" }}>
                    Back
                  </button>
                  <a
                    href={SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-cta"
                    style={{ display: "inline-block", textDecoration: "none", marginTop: 0 }}
                  >
                    Build My Container System
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
