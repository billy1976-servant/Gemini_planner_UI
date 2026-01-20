"use client";


import { resolveToken } from "@/engine/core/palette-resolve-token";


type MediaAtomProps = {
  params?: any;
  src?: string;
  alt?: string;
  type?: string;
  children?: any;
};


export default function MediaAtom({
  params = {},
  src,
  alt = "",
  type,
  children,
}: MediaAtomProps) {
  const size = resolveToken(params.size) || resolveToken("size.md");


  const baseStyle: React.CSSProperties = {
    width: size,
    height: params.autoHeight ? "auto" : size,
    objectFit: params.objectFit || "cover",
    borderRadius: resolveToken(params.radius),
    opacity: resolveToken(params.opacity) ?? 1,
    display: "block",
  };


  if (!src) return <div style={baseStyle}>{children}</div>;


  // IMAGE (default)
  if (!type && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(src)) {
    return <img src={src} alt={alt} style={baseStyle} />;
  }


  // VIDEO
  if (type === "video" || /\.(mp4|webm|ogg)$/i.test(src)) {
    return (
      <video style={baseStyle} controls>
        <source src={src} />
      </video>
    );
  }


  // AUDIO
  if (type === "audio" || /\.(mp3|wav|ogg)$/i.test(src)) {
    return <audio controls src={src} style={{ width: size }} />;
  }


  // PDF
  if (type === "pdf" || /\.pdf$/i.test(src)) {
    return <iframe src={src} style={{ ...baseStyle, height: "600px" }} />;
  }


  // DOC / XLS
  if (type === "doc" || type === "xls" || /\.(doc|docx|xls|xlsx)$/i.test(src)) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" style={baseStyle}>
        Download File
      </a>
    );
  }


  // TEXT / JSON
  if (type === "text" || /\.(txt|json)$/i.test(src)) {
    return <iframe src={src} style={{ ...baseStyle, height: "400px" }} />;
  }


  // FALLBACK
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" style={baseStyle}>
      Open File
    </a>
  );
}
