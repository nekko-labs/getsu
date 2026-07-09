/**
 * The Getsu mark: a glowing crescent moon with a small black cat sitting in
 * front, silhouetted by the moonlight. Rendered from the canonical /logo.svg
 * so the favicon, PWA icon, and in-app brand stay in lockstep.
 */
export default function BrandMark({ size = 26, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      width={size}
      height={size}
      alt="Getsu"
      className={className}
      style={{ borderRadius: size * 0.22, display: 'block', ...style }}
      draggable={false}
    />
  );
}
