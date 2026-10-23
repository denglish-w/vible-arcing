// The brand mark: a red Chi Rho (Χ + Ρ) with Alpha (Α) on the left and Omega
// (Ω) on the right, drawn straight on the header background (no tile). Strokes
// draw the Chi Rho; serif Greek glyphs render Α/Ω. Fixed red so it reads the
// same in every app theme.
export default function ChiRho({ className = "" }) {
  const RED = "#C8323A";
  const FONT = "'Gentium Plus','Cardo','EB Garamond',serif";
  return (
    <svg viewBox="0 0 44 30" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke={RED} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        {/* Rho stem + loop */}
        <line x1="22" y1="26" x2="22" y2="4" />
        <path d="M22 4 C 29 4 29 12 22 12" />
        {/* Chi (X) */}
        <line x1="13" y1="11" x2="31" y2="21" />
        <line x1="31" y1="11" x2="13" y2="21" />
      </g>
      <text x="6.5" y="20" fill={RED} fontFamily={FONT} fontSize="13" textAnchor="middle">Α</text>
      <text x="37.5" y="20" fill={RED} fontFamily={FONT} fontSize="13" textAnchor="middle">Ω</text>
    </svg>
  );
}