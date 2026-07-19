type OactoLogoProps = {
  className?: string;
  size?: number;
  title?: string;
};

/** Official Oacto mark (blue tile with white diamond). */
export function OactoLogo({ className, size = 34, title }: OactoLogoProps) {
  return (
    <img
      className={className}
      src="/oacto-logo.png"
      width={size}
      height={size}
      alt={title ?? ""}
      decoding="async"
      draggable={false}
    />
  );
}

/** Monochrome diamond mark for dark surfaces (currentColor). */
export function OactoMark({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M32 4.5 59.5 32 38.2 53.3 32 47.1 25.8 53.3 4.5 32 32 4.5Zm0 16.2L43.3 32 32 43.3 20.7 32 32 20.7Z"
        clipRule="evenodd"
      />
      <path fill="currentColor" d="M32 50.2 38.2 56.4 32 62.6 25.8 56.4 32 50.2Z" />
    </svg>
  );
}
