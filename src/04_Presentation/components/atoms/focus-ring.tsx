"use client";


import { useState, useEffect, useRef } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import { withMotionScale } from "@/engine/core/motion-scale";


type FocusRingAtomProps = {
  params?: any;
  children?: any;
  onFocus?: () => void;
  onBlur?: () => void;
};


export default function FocusRingAtom({ params = {}, children, onFocus, onBlur }: FocusRingAtomProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Track if last interaction was keyboard
  useEffect(() => {
    let lastInteractionWasKeyboard = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        lastInteractionWasKeyboard = true;
      }
    };

    const handleMouseDown = () => {
      lastInteractionWasKeyboard = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    // Only show focus ring if using keyboard navigation
    const wasKeyboard = document.activeElement === ref.current;
    setIsKeyboardFocus(wasKeyboard);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsKeyboardFocus(false);
    onBlur?.();
  };

  // Resolve focus ring tokens from palette
  const focusRingColor = resolveToken(params.focusRingColor ?? "focusRing.color");
  const focusRingWidth = resolveToken(params.focusRingWidth ?? "focusRing.width");
  const focusRingOffset = resolveToken(params.focusRingOffset ?? "focusRing.offset");

  const style: React.CSSProperties = {
    outline: isFocused && isKeyboardFocus && focusRingColor && focusRingWidth
      ? `${focusRingWidth} solid ${focusRingColor}`
      : "none",
    outlineOffset: isFocused && isKeyboardFocus && focusRingOffset
      ? focusRingOffset
      : undefined,
    transition: withMotionScale(resolveToken("transition.fast") ?? "150ms ease") ?? "150ms ease",
  };

  const tabIndex = params.disabled ? -1 : (params.tabIndex ?? 0);

  return (
    <div
      ref={ref}
      style={style}
      tabIndex={tabIndex}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
}
