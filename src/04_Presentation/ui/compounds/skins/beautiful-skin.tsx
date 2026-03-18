export function BeautifulSkin({ children }: any) {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        background: "#020617",
        color: "#e5e7eb",
        padding: 24,
        borderRadius: 16,
      }}
    >
      {children}
    </div>
  );
}
