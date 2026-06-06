/* eslint-disable @next/next/no-img-element */
// A bouncing Phantom Tracker ghost used as a loading indicator.

export function PhantomLoader({
  size = 56,
  label,
  fullscreen = false,
  className = "",
}: {
  size?: number;
  label?: string;
  /** Center it over the full viewport (e.g. route-transition loading). */
  fullscreen?: boolean;
  className?: string;
}) {
  const inner = (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex flex-col items-center" style={{ width: size }}>
        <img
          src="/ghost-logo-128.png"
          alt=""
          width={size}
          height={size}
          className="phantom-bounce rounded-2xl object-cover"
          style={{ width: size, height: size }}
        />
        {/* ground shadow */}
        <div
          className="phantom-shadow mt-2 rounded-[50%] bg-black"
          style={{ width: size * 0.7, height: size * 0.14 }}
        />
      </div>
      {label && <p className="text-xs text-muted">{label}</p>}
    </div>
  );

  if (!fullscreen) return inner;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {inner}
    </div>
  );
}
