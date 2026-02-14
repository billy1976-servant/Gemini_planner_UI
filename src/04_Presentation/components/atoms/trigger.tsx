"use client";


import { useState } from "react";
import { resolveToken } from "@/engine/core/palette-resolve-token";
import { withMotionScale } from "@/engine/core/motion-scale";


type TriggerAtomProps = {
  params?: any;
  onTap?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: any;
};


const FEEDBACK_INTENSITY: Record<string, number> = {
  light: 0.5,
  soft: 0.7,
  medium: 1.0,
  strong: 1.3,
};


export default function TriggerAtom({ params = {}, onTap, children }: TriggerAtomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Resolve interaction tokens from palette
  const interactionHover = resolveToken("interaction.hover") as any;
  const interactionPress = resolveToken("interaction.press") as any;
  const interactionDisabled = resolveToken("interaction.disabled") as any;

  // Get feedback intensity multipliers
  const hoverIntensity = FEEDBACK_INTENSITY[params.hoverFeedback] ?? 1.0;
  const pressIntensity = FEEDBACK_INTENSITY[params.pressFeedback] ?? 1.0;

  // Calculate opacity based on state
  let opacity = 1;
  if (params.disabled && interactionDisabled?.opacity != null) {
    opacity = interactionDisabled.opacity;
  } else if (isPressed && interactionPress?.opacity != null) {
    opacity = 1 - ((1 - interactionPress.opacity) * pressIntensity);
  } else if (isHovered && interactionHover?.opacity != null) {
    opacity = 1 - ((1 - interactionHover.opacity) * hoverIntensity);
  }

  // Calculate scale based on state
  let scale = 1;
  if (isPressed && interactionPress?.scale != null) {
    scale = 1 - ((1 - interactionPress.scale) * pressIntensity);
  } else if (isHovered && interactionHover?.scale != null) {
    scale = 1 + ((interactionHover.scale - 1) * hoverIntensity);
  }

  // Calculate lift transform based on state
  let liftTransform: string | undefined;
  if (params.hoverLift && isHovered && !isPressed) {
    const hoverLiftToken = interactionHover?.lift ?? resolveToken(params.hoverLiftTransform ?? "transform.hoverLift");
    if (typeof hoverLiftToken === "string") {
      liftTransform = hoverLiftToken;
    }
  }

  // Combine transform values
  const transforms: string[] = [];
  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }
  if (liftTransform) {
    transforms.push(liftTransform);
  }

  const transitionVal = params.transition != null ? resolveToken(params.transition) : resolveToken("transition.base");
  const transitionScaled = withMotionScale(typeof transitionVal === "string" ? transitionVal : undefined);

  const style: React.CSSProperties = {
    cursor: params.disabled ? "not-allowed" : (params.cursor || "pointer"),
    opacity,
    ...(transitionScaled ? { transition: `opacity ${transitionScaled}, transform ${transitionScaled}` } : {}),
    ...(transforms.length > 0 ? { transform: transforms.join(" ") } : {}),
  };


  return (
    <div
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => {
        if (!params.disabled) {
          setIsPressed(true);
        }
      }}
      onMouseUp={() => setIsPressed(false)}
      onClick={(e) => {
        if (params.disabled) return;
        e.stopPropagation();
        onTap && onTap(e);
      }}
    >
      {children}
    </div>
  );
}
