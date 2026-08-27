export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#080808]">
      {/* Deep radial glows */}
      <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[120px] mix-blend-screen" />
      <div className="absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-gold-soft/10 blur-[100px] mix-blend-screen" />

      {/* Animated Light Rays using CSS */}
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[30%] top-[-50%] h-[200%] w-px origin-center rotate-[35deg] animate-[spin_60s_linear_infinite] bg-gradient-to-b from-transparent via-gold/40 to-transparent blur-[1px]" />
        <div className="absolute left-[70%] top-[-50%] h-[200%] w-[2px] origin-center -rotate-[45deg] animate-[spin_80s_linear_infinite_reverse] bg-gradient-to-b from-transparent via-gold-soft/30 to-transparent blur-[2px]" />
        <div className="absolute left-[50%] top-[-50%] h-[200%] w-px origin-center rotate-[15deg] animate-[spin_100s_linear_infinite] bg-gradient-to-b from-transparent via-gold/50 to-transparent blur-[1px]" />
      </div>

      {/* Geometric SVG Overlay */}
      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gold-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-gold)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gold-edge-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gold-soft)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-gold-soft)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-gold-soft)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gold-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="animate-[pulse_8s_ease-in-out_infinite]">
          <path
            d="M 20,100 L 50,0 L 80,100 Z"
            fill="url(#gold-fill)"
            stroke="url(#gold-edge)"
            strokeWidth="0.1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 0,30 L 100,50 L 50,100 Z"
            fill="none"
            stroke="url(#gold-edge-2)"
            strokeWidth="0.15"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 100,0 L 0,80 L 50,20 Z"
            fill="url(#gold-fill)"
            stroke="url(#gold-edge)"
            strokeWidth="0.1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      
      {/* Noise overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} 
      />
      
      {/* Bottom fade out to merge with the page background */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
