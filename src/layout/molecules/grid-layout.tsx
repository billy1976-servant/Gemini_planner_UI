"use client";
export default function GridLayout({ params = {}, children }) {
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
