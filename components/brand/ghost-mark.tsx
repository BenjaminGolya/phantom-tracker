/* eslint-disable @next/next/no-img-element */
// Phantom Tracker brand mark - uses the official logo artwork (public/ghost-logo-128.png).

export function GhostLogo({
  size = 28,
  className = "",
  rounded = "rounded-lg",
}: {
  size?: number;
  className?: string;
  rounded?: string;
}) {
  return (
    <img
      src="/ghost-logo-128.png"
      alt="Phantom Tracker"
      width={size}
      height={size}
      className={`${rounded} object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Default user avatar (no uploaded photo): the logo in a circle.
export function GhostAvatar({ size = 28, className = "" }: { size?: number; className?: string }) {
  return <GhostLogo size={size} rounded="rounded-full" className={className} />;
}

// Back-compat alias: existing call sites used <GhostMark size=.. className="text-white" />.
// The color class is now a no-op (the artwork has its own colors).
export function GhostMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <GhostLogo size={size} className={className} />;
}
