import { getResults, getSwing, getNationalTotals } from '../data/elections.js';
import { PARTIES, normParty, getParty } from '../data/parties.js';

export function PartyPill({ party, selected, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: small ? 4 : 6,
      padding: small ? "3px 8px" : "5px 12px",
      border: selected ? `2px solid ${party.color}` : "2px solid transparent",
      borderRadius: 20, background: selected ? party.color + "20" : "rgba(255,255,255,0.04)",
      color: selected ? party.color : "#8888a0", cursor: "pointer",
      fontSize: small ? 11 : 13, fontWeight: selected ? 700 : 500,
      fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
    }}>
      <span style={{ width: small ? 7 : 9, height: small ? 7 : 9, borderRadius: "50%",
        background: party.color, opacity: selected ? 1 : 0.4, flexShrink: 0 }} />
      {party.short}
    </button>
  );
}

export function DetailPanel({ kredsName, selectedParty, view }) {
  if (!kredsName) return (
    <div style={{ padding: 16, color: "#8888a0", fontSize: 13, lineHeight: 1.6 }}>
      Klik på en opstillingskreds på kortet for at se partifordeling og ændringer fra 2022 til 2026.
    </div>
  );

  const d26 = getResults(kredsName, 2026);
  if (!d26) return null;

  const sorted = Object.entries(d26.p)
    .map(([p, v]) => ({ id: normParty(p), dstKey: p, pct: v[1], votes: v[0] }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ec",
        fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
        {kredsName}
      </div>
      <div style={{ fontSize: 11, color: "#8888a0", marginBottom: 12 }}>
        {d26.v.toLocaleString("da-DK")} stemmeberettigede · {d26.d}% deltagelse
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {sorted.filter(s => s.pct >= 1).map((s) => {
          const party = getParty(s.id);
          if (!party) return null;
          const swing = getSwing(kredsName, s.id);
          const isHL = view === "swing" && selectedParty === s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6,
              opacity: isHL ? 1 : 0.8, padding: "2px 0" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%",
                background: party.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, width: 26, color: "#e8e8ec",
                fontFamily: "'DM Sans', sans-serif" }}>{party.short}</span>
              <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)",
                borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(s.pct * 3, 100)}%`, height: "100%",
                  background: party.color, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 11, width: 38, textAlign: "right",
                fontFamily: "'DM Mono', monospace", color: "#e8e8ec", fontWeight: 500 }}>
                {s.pct.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace",
                color: swing > 0.05 ? "#4ade80" : swing < -0.05 ? "#f87171" : "#8888a0",
                width: 46, textAlign: "right", fontWeight: 600 }}>
                {swing > 0 ? "+" : ""}{swing.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NationalBar({ year }) {
  const totals = getNationalTotals(year);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 10, color: "#8888a0", marginBottom: 4, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.08em",
        fontFamily: "'DM Sans', sans-serif" }}>
        Landsresultat {year}
      </div>
      <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", gap: 1 }}>
        {sorted.map(([id, votes]) => {
          const pct = (votes / grand) * 100;
          const party = getParty(id);
          if (!party || pct < 1.5) return null;
          return (
            <div key={id} style={{
              width: `${pct}%`, minWidth: pct > 3.5 ? 20 : 0, background: party.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 700, color: "white",
              fontFamily: "'DM Sans', sans-serif", transition: "width 0.4s",
            }} title={`${party.name}: ${pct.toFixed(1)}%`}>
              {pct > 4 ? party.short : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
