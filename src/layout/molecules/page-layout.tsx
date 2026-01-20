"use client";


type PageLayoutProps = {
  params?: any;
  children?: any;
};


export default function PageLayout({ params = {}, children }: PageLayoutProps) {
  const {
    align = "flex-start",
    justify = "flex-start",
    padding = 0,
    background = "transparent"
  } = params;


  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: align,
    justifyContent: justify,
    padding,
    background
  };


  return <div style={style}>{children}</div>;
}


