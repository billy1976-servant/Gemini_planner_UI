"use client";

interface RowLayoutProps {
  params?: {
    gap?: string;
    align?: string;
    justify?: string;
    wrap?: string;
  };
  children?: React.ReactNode;
}

export default function RowLayout({ params = {}, children }: RowLayoutProps) {
  const {
    gap = "1rem",
    align = "center",
    justify = "flex-start",
    wrap = "wrap"
  } = params;


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap,
        alignItems: align as React.CSSProperties['alignItems'],
        justifyContent: justify as React.CSSProperties['justifyContent'],
        flexWrap: wrap as React.CSSProperties['flexWrap'],
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}
