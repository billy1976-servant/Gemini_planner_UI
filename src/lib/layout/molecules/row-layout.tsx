"use client";
export default function RowLayout({ params = {}, children }) {
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
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}
