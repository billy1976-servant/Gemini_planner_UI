"use client";

interface ColumnLayoutProps {
  params?: {
    gap?: string;
    align?: string;
    justify?: string;
  };
  children?: React.ReactNode;
}

export default function ColumnLayout({ params = {}, children }: ColumnLayoutProps) {
  const {
    gap = "1rem",
    align = "stretch",
    justify = "flex-start"
  } = params;


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        alignItems: align as React.CSSProperties['alignItems'],
        justifyContent: justify as React.CSSProperties['justifyContent'],
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}
