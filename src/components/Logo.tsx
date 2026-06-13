export function Logo({ subtitle = "sorteie · escale · jogue" }: { subtitle?: string }) {
  return (
    <span className="lk lk-horz logo" aria-label="8a0 — Oito a Zero">
      <span className="mark80 num" aria-hidden="true">
        <span className="mark-8">8</span>
        <span className="sep sep-dash">–</span>
        <span className="sep sep-colon">:</span>
        <span className="mark-0">0</span>
      </span>
      <span className="lk-horz-rule" />
      <span className="lk-horz-words">
        <span className="lk-horz-name">
          OITO<br />A ZERO
        </span>
        <span className="lk-horz-sub">{subtitle}</span>
      </span>
    </span>
  );
}

export function Mark80() {
  return (
    <span className="mark80 num" aria-label="8 to 0">
      <span className="mark-8">8</span>
      <span className="sep sep-dash">–</span>
      <span className="sep sep-colon">:</span>
      <span className="mark-0">0</span>
    </span>
  );
}
