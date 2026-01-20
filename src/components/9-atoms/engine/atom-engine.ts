export function applyAtomParams(kind: string, props: any) {
  const scale = props.scale ?? 0;
  const label = props.label ?? "Label";

  // Temporary minimal style (no logic yet)
  const style = props.style ?? {};

  return { label, style };
}
