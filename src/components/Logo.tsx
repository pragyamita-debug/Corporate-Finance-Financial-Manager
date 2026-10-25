/** A two-tone peak — the mark in the top bar and on the upload screen. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size * 0.8} viewBox="0 0 40 32" aria-hidden>
      <path d="M20 2 38 30H2z" fill="#5fb3b3" />
      <path d="M20 2 26 30H2z" fill="#9fd8d6" />
      <path className="logo__sun" d="M20 2 23 9h-6z" fill="#ffcf8f" />
    </svg>
  );
}
