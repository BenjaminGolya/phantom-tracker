// Custom Phantom Tracker ghost mark. The eyes are punched out via the
// even-odd fill rule, so they stay transparent on any background and the
// shape inherits the current text color (use className="text-white" etc).

export function GhostMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 80 V43 C15 23.7 30.7 8 50 8 C69.3 8 85 23.7 85 43 V80
           C85 89 61.67 89 61.67 80 C61.67 89 38.33 89 38.33 80 C38.33 89 15 89 15 80 Z
           M31 44 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z
           M53 44 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z"
      />
    </svg>
  );
}

// Default user avatar: the ghost on the brand purple, used when a user has
// no uploaded profile picture.
export function GhostAvatar({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full bg-primary flex items-center justify-center text-white overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <GhostMark size={Math.round(size * 0.62)} />
    </div>
  );
}
