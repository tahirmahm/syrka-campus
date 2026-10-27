/** The official raster is the luminance mask: no tracing, redrawing or altered geometry. */
export function Brand({
  wordmark = false,
  className = "",
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={wordmark ? "Syrka" : "Syrka symbol"}
      className={`brand-mask ${wordmark ? "brand-wordmark" : "brand-symbol"} ${className}`}
    />
  );
}
