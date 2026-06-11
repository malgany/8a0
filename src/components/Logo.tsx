export function Logo({ subtitle = "monte · simule · 7 a 0" }: { subtitle?: string }) {
  return (
    <span className="lk lk-horz logo" aria-label="7a0 — Sete a Zero">
      <span className="mark70 num" aria-hidden="true">
        <span className="mark-7">7</span>
        <span className="sep sep-dash">–</span>
        <span className="sep sep-colon">:</span>
        <span className="mark-0">0</span>
      </span>
      <span className="lk-horz-rule" />
      <span className="lk-horz-words">
        <span className="lk-horz-name">
          SETE
          <br />A ZERO
        </span>
        <span className="lk-horz-sub">{subtitle}</span>
      </span>
    </span>
  );
}

export function Mark70() {
  return (
    <span className="mark70 num" aria-label="7 to 0">
      <span className="mark-7">7</span>
      <span className="sep sep-dash">–</span>
      <span className="sep sep-colon">:</span>
      <span className="mark-0">0</span>
    </span>
  );
}
