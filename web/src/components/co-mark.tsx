// Compact VApplyIQ AI brand mark used in navigation.
export function CoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand font-bold text-brand-foreground"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.78),
        letterSpacing: "0.01em",
        lineHeight: 1,
        paddingBottom: Math.round(size * 0.08),
      }}
    >
      V
    </span>
  );
}
