export default function Architecture() {
  return (
    <section className="section section-divider" id="architecture">
      <div className="container">
        <p className="eyebrow">// HOW IT WORKS</p>
        <h2 className="section-title">A ReAct loop, engineered for the OS.</h2>
        <p className="section-sub">
          User intent flows through the Gantry Engine, branches across desktop,
          browser, and local tools, then streams results asynchronously back to your UI.
        </p>
        <div className="arch-wrap">
          <svg viewBox="0 0 1100 380" className="arch-svg">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g>
              <rect className="arch-node" x="30" y="160" width="150" height="60" rx="10" />
              <text className="arch-label" x="105" y="186" textAnchor="middle">User Intent</text>
              <text className="arch-sub" x="105" y="202" textAnchor="middle">&quot;Find the pricing page&quot;</text>
            </g>

            <g>
              <circle cx="380" cy="190" r="100" fill="url(#glow)" opacity="0.25" />
              <rect className="arch-node-active" x="280" y="140" width="200" height="100" rx="12" />
              <text className="arch-label" x="380" y="170" textAnchor="middle" style={{ fill: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>Gantry Engine</text>
              <line x1="300" y1="184" x2="460" y2="184" stroke="var(--border)" />
              <text className="arch-sub" x="380" y="200" textAnchor="middle">LangGraph state machine</text>
              <text className="arch-sub" x="380" y="214" textAnchor="middle">observe → think → act → review</text>
              <text className="arch-sub" x="380" y="228" textAnchor="middle">GuardrailPolicy · BudgetPolicy</text>
            </g>

            {[
              { x: 600, y: 60, label: 'DesktopScreen', sub: 'pyautogui · mss' },
              { x: 600, y: 160, label: 'WebPage', sub: 'playwright · stealth' },
              { x: 600, y: 260, label: 'FileSystemTools', sub: 'read · write · shell' },
              { x: 600, y: 350, label: 'MCPConnector', sub: 'github · slack · pg' },
            ].map((b, i) => (
              <g key={i}>
                <rect className="arch-node" x={b.x} y={b.y - 20} width="200" height="50" rx="8" />
                <text className="arch-label" x={b.x + 16} y={b.y - 2}>{b.label}</text>
                <text className="arch-sub" x={b.x + 16} y={b.y + 14}>{b.sub}</text>
              </g>
            ))}

            <g>
              <rect className="arch-node-active" x="900" y="160" width="170" height="60" rx="10" />
              <text className="arch-label" x="985" y="186" textAnchor="middle" style={{ fill: 'var(--accent-2)' }}>Async Stream</text>
              <text className="arch-sub" x="985" y="202" textAnchor="middle">events → WebSocket / UI</text>
            </g>

            <path className="arch-line-active" d="M 180 190 L 280 190" />
            <path className="arch-line-active" d="M 480 175 C 540 175, 540 60, 600 60" />
            <path className="arch-line-active" d="M 480 185 C 540 185, 540 160, 600 160" />
            <path className="arch-line-active" d="M 480 200 C 540 200, 540 260, 600 260" />
            <path className="arch-line-active" d="M 480 215 C 540 215, 540 350, 600 350" />
            <path className="arch-line-active" d="M 800 60 C 860 60, 860 175, 900 175" />
            <path className="arch-line-active" d="M 800 160 C 860 160, 860 185, 900 185" />
            <path className="arch-line-active" d="M 800 260 C 860 260, 860 200, 900 200" />
            <path className="arch-line-active" d="M 800 350 C 860 350, 860 215, 900 215" />

            {[0, 1, 2, 3].map(i => (
              <circle key={i} className="arch-pulse" r="3" fill="var(--accent)">
                <animateMotion dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite"
                  path={[
                    "M 180 190 L 280 190 L 380 190 L 480 175 C 540 175, 540 60, 600 60 L 800 60 C 860 60, 860 175, 900 175 L 1070 190",
                    "M 180 190 L 280 190 L 380 190 L 480 185 C 540 185, 540 160, 600 160 L 800 160 C 860 160, 860 185, 900 185 L 1070 190",
                    "M 180 190 L 280 190 L 380 190 L 480 200 C 540 200, 540 260, 600 260 L 800 260 C 860 260, 860 200, 900 200 L 1070 190",
                    "M 180 190 L 280 190 L 380 190 L 480 215 C 540 215, 540 350, 600 350 L 800 350 C 860 350, 860 215, 900 215 L 1070 190",
                  ][i]}
                />
              </circle>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
