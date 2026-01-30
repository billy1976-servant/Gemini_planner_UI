/**
 * CalculatorSection
 * 
 * Displays calculator interface from calculator engine.
 * No hardcoded content - purely presentational.
 */

import React from "react";

interface CalculatorSectionProps {
  engineId: string;
  data: {
    context?: Record<string, any>;
    inputs?: Array<{
      id: string;
      label: string;
      type: "number" | "text" | "select";
      value?: any;
      options?: string[];
    }>;
    outputs?: Array<{
      id: string;
      label: string;
      value: number | string;
      unit?: string;
    }>;
  };
  className?: string;
}

export default function CalculatorSection({
  engineId,
  data,
  className = "",
}: CalculatorSectionProps) {
  return (
    <section className={`site-section ${className}`}>
      <div className="site-container-inner">
        <h2 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-6)",
          color: "var(--color-text-primary)",
        }}>
          Calculator
        </h2>
        
        <div className="site-card" style={{
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          {data.inputs && data.inputs.length > 0 ? (
            <div style={{
              marginBottom: "var(--spacing-6)",
            }}>
              {data.inputs.map((input) => (
                <div key={input.id} style={{
                  marginBottom: "var(--spacing-4)",
                }}>
                  <label style={{
                    display: "block",
                    fontSize: "var(--font-size-base)",
                    fontWeight: "var(--font-weight-medium)",
                    marginBottom: "var(--spacing-2)",
                    color: "var(--color-text-primary)",
                  }}>
                    {input.label}
                  </label>
                  {input.type === "number" && (
                    <input
                      type="number"
                      defaultValue={input.value}
                      style={{
                        width: "100%",
                        padding: "var(--spacing-3)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--font-size-base)",
                      }}
                    />
                  )}
                  {input.type === "select" && input.options && (
                    <select
                      style={{
                        width: "100%",
                        padding: "var(--spacing-3)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--font-size-base)",
                      }}
                    >
                      {input.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{
              fontSize: "var(--font-size-base)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--spacing-6)",
            }}>
              Calculator inputs will appear here
            </p>
          )}
          
          {data.outputs && data.outputs.length > 0 && (
            <div style={{
              paddingTop: "var(--spacing-6)",
              borderTop: "1px solid var(--color-border)",
            }}>
              <h3 style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--spacing-4)",
              }}>
                Results
              </h3>
              {data.outputs.map((output) => (
                <div key={output.id} style={{
                  marginBottom: "var(--spacing-4)",
                }}>
                  <div style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--spacing-1)",
                  }}>
                    {output.label}
                  </div>
                  <div style={{
                    fontSize: "var(--font-size-2xl)",
                    fontWeight: "var(--font-weight-bold)",
                    color: "var(--color-primary)",
                  }}>
                    {output.value} {output.unit || ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
