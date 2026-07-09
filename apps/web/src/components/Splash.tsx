import { useEffect, useRef, useState } from 'react';

/**
 * The opening animation. A night sky blooms, the crescent moon fades up, the
 * black cat settles into place and blinks its moonlit eyes, and the wordmark
 * rises. Shown once per browser session (sessionStorage), tap to skip, and
 * collapsed to a quick fade when the user prefers reduced motion. Motion is
 * ease-out only, per the design system.
 */
const SEEN_KEY = 'getsu.splash.seen';

export default function Splash() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    const hold = reduced ? 500 : 2100;
    timers.current.push(window.setTimeout(() => setLeaving(true), hold));
    timers.current.push(window.setTimeout(() => setShow(false), hold + 480));
    return () => timers.current.forEach(clearTimeout);
  }, [show, reduced]);

  if (!show) return null;

  const skip = () => {
    setLeaving(true);
    window.setTimeout(() => setShow(false), 300);
  };

  return (
    <div
      className={`getsu-splash${leaving ? ' is-leaving' : ''}${reduced ? ' is-reduced' : ''}`}
      onClick={skip}
      role="img"
      aria-label="Getsu"
    >
      <svg viewBox="0 0 512 620" className="getsu-splash-art" aria-hidden="true">
        <defs>
          <linearGradient id="s-moon" x1="0.15" y1="0.1" x2="0.9" y2="1">
            <stop offset="0" stopColor="#fff6dc" />
            <stop offset="0.5" stopColor="#ffe4a0" />
            <stop offset="1" stopColor="#f6c452" />
          </linearGradient>
          <radialGradient id="s-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe6a6" stopOpacity="0.9" />
            <stop offset="0.45" stopColor="#ffcf6b" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffcf6b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="s-eye" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff2c4" />
            <stop offset="0.6" stopColor="#f7c94e" />
            <stop offset="1" stopColor="#e9a52f" />
          </radialGradient>
          <mask id="s-crescent">
            <rect width="512" height="620" fill="black" />
            <circle cx="248" cy="212" r="126" fill="white" />
            <circle cx="300" cy="178" r="118" fill="black" />
          </mask>
          <filter id="s-soften">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="s-catglow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffd980" floodOpacity="0.6" />
          </filter>
        </defs>

        <circle className="s-glow" cx="252" cy="206" r="210" fill="url(#s-glow)" />
        <g fill="#fff3d4">
          <circle className="s-star" cx="96" cy="120" r="3.2" />
          <circle className="s-star" cx="150" cy="76" r="2" />
          <circle className="s-star" cx="404" cy="132" r="3" />
          <circle className="s-star" cx="440" cy="228" r="2.2" />
          <circle className="s-star" cx="120" cy="250" r="2.4" />
        </g>
        <g className="s-moon" filter="url(#s-soften)">
          <circle cx="248" cy="212" r="126" fill="url(#s-moon)" mask="url(#s-crescent)" />
        </g>
        <g className="s-cat" filter="url(#s-catglow)">
          <g fill="#0c0a18">
            <path
              d="M300 430 C 372 432 410 388 392 340 C 382 312 350 312 344 344 C 340 366 356 372 366 358"
              fill="none"
              stroke="#0c0a18"
              strokeWidth="30"
              strokeLinecap="round"
            />
            <path d="M256 300 C 200 300 176 356 176 404 C 176 438 212 452 256 452 C 300 452 336 438 336 404 C 336 356 312 300 256 300 Z" />
            <circle cx="256" cy="300" r="58" />
            <path d="M210 272 L 214 206 L 262 254 Z" />
            <path d="M302 272 L 298 206 L 250 254 Z" />
          </g>
          <g className="s-eyes">
            <ellipse cx="238" cy="298" rx="10" ry="13" fill="url(#s-eye)" />
            <ellipse cx="278" cy="298" rx="10" ry="13" fill="url(#s-eye)" />
            <ellipse cx="238" cy="298" rx="2.6" ry="10" fill="#20160a" />
            <ellipse cx="278" cy="298" rx="2.6" ry="10" fill="#20160a" />
          </g>
        </g>
        <text className="s-word" x="256" y="548" textAnchor="middle">
          Getsu
        </text>
        <text className="s-tag" x="256" y="584" textAnchor="middle">
          a month at a time
        </text>
      </svg>
    </div>
  );
}
