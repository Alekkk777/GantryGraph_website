const cells = [
  { feat: 'Integration model',           gg: 'Python library — drop into any service', oh: 'Standalone platform / Docker',    bu: 'Browser-only library',  ad: 'Hosted API / black box' },
  { feat: 'Scope',                        gg: 'Full OS · browser · MCP · local fns',   oh: 'Coding-agent IDE',                bu: 'Web pages only',        ad: 'Screenshot + mouse only' },
  { feat: 'Shell command firewall',       gg: 'check', oh: 'cross',    bu: 'cross',   ad: 'cross' },
  { feat: 'API budget kill-switch',       gg: 'check', oh: 'partial',  bu: 'cross',   ad: 'cross' },
  { feat: 'Human approval gate',         gg: 'check', oh: 'partial',  bu: 'cross',   ad: 'cross' },
  { feat: 'LangGraph-native',             gg: 'check', oh: 'cross',    bu: 'cross',   ad: 'cross' },
  { feat: 'Model-agnostic LLM',           gg: 'check', oh: 'partial',  bu: 'check',   ad: 'cross' },
  { feat: 'Native MCP support',           gg: 'check', oh: 'cross',    bu: 'cross',   ad: 'cross' },
  { feat: 'Async event streaming',        gg: 'check', oh: 'partial',  bu: 'check',   ad: 'cross' },
  { feat: 'Headless / Docker-ready',      gg: 'check', oh: 'check',    bu: 'check',   ad: 'partial' },
  { feat: 'License',                      gg: 'MIT',   oh: 'MIT',      bu: 'MIT',     ad: 'Proprietary' },
];

const renderCell = (v: string) => {
  if (v === 'check')   return <span className="check">✓</span>;
  if (v === 'cross')   return <span className="cross">—</span>;
  if (v === 'partial') return <span className="partial">~</span>;
  return v;
};

export default function Comparison() {
  return (
    <section className="section section-divider" id="compare">
      <div className="container">
        <p className="eyebrow">// COMPARISON</p>
        <h2 className="section-title">How GantryGraph stacks up.</h2>
        <p className="section-sub">
          Computer Use APIs are black boxes optimized for demos.
          GantryGraph is a library optimized for production.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th className="us">GantryGraph</th>
                <th>OpenHands</th>
                <th>browser-use</th>
                <th>Computer Use APIs</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((row, i) => (
                <tr key={i}>
                  <td className="feat">{row.feat}</td>
                  <td className="us">{renderCell(row.gg)}</td>
                  <td>{renderCell(row.oh)}</td>
                  <td>{renderCell(row.bu)}</td>
                  <td>{renderCell(row.ad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="compare-note">✓ supported · ~ partial / requires custom code · — not supported</p>
      </div>
    </section>
  );
}
