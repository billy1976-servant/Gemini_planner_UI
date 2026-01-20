"use client";


type StackLayoutParams = {
  align?: string;
  justify?: string;
};


export default function StackLayout({
  params = {},
  children
}: {
  params?: StackLayoutParams;
  children?: any;
}) {
  const { align = "center", justify = "center" } = params;


  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: align,
        justifyContent: justify
      }}
    >
      {children}
    </div>
  );
}


