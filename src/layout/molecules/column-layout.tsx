"use client";
export default function ColumnLayout({ params = {}, children }) {
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
        alignItems: align,
        justifyContent: justify,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}
