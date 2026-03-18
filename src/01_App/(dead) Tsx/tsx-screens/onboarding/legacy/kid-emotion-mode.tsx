"use client";


export default function KidsEmotionMode() {
  return (
    <div
      style={{
        height: "100vh",
        background: "#fef3c7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Comic Sans MS, system-ui",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 32,
          borderRadius: 20,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <h2>How are you feeling?</h2>
        <p>There is no wrong answer.</p>


        <button style={{ marginTop: 16, padding: 12, borderRadius: 12 }}>
          😊 Happy
        </button>
      </div>
    </div>
  );
}
