export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="5.5" fill="currentColor" />
      <circle cx="24" cy="8" r="5.5" fill="currentColor" />
      <circle cx="16" cy="18" r="11.5" fill="currentColor" />
      <circle cx="12" cy="16" r="1.6" fill="var(--bg)" />
      <circle cx="20" cy="16" r="1.6" fill="var(--bg)" />
      <ellipse cx="16" cy="21.5" rx="3.4" ry="2.5" fill="var(--bg)" />
    </svg>
  );
}
