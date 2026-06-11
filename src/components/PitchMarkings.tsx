export function PitchMarkings() {
  return (
    <svg className="pitch-markings" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="200" x2="300" y2="200" />
      <circle cx="150" cy="200" r="46" />
      <circle cx="150" cy="200" r="2.4" className="mk-fill" />
      <path d="M62 0 V60 H238 V0" />
      <path d="M112 0 V22 H188 V0" />
      <circle cx="150" cy="40" r="2.4" className="mk-fill" />
      <path d="M110.8 60 A44 44 0 0 0 189.2 60" />
      <path d="M62 400 V340 H238 V400" />
      <path d="M112 400 V378 H188 V400" />
      <circle cx="150" cy="360" r="2.4" className="mk-fill" />
      <path d="M110.8 340 A44 44 0 0 1 189.2 340" />
      <path d="M0 9 A9 9 0 0 0 9 0" />
      <path d="M291 0 A9 9 0 0 0 300 9" />
      <path d="M300 391 A9 9 0 0 0 291 400" />
      <path d="M9 400 A9 9 0 0 0 0 391" />
    </svg>
  );
}
