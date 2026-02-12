"use client";

interface GridLayoutProps {
  params?: {
    columns?: number;
    gap?: string;
    align?: string;
    justify?: string;
  };
  children?: React.ReactNode;
}

export default function GridLayout({ params = {}, children }: GridLayoutProps) {
  const {
    columns = 2,
    gap = "1rem",
    align = "stretch",
    justify = "stretch"
  } = params;


  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        alignItems: align,
        justifyItems: justify,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}
