import { useMemo } from 'react';
import { getResults, getSwing } from '../data/elections.js';
import { getParty, normParty } from '../data/parties.js';
import E26 from '../data/election2026.json';

export default function TransferPanel({ kredsName, partyA, partyB }) {
  const pA = getParty(partyA);
  const pB = getParty(partyB);

  // Compute top movers across all kredse
  const topMovers = useMemo(() => {
    const kredsNames = Object.keys(E26);
    return kredsNames
      .map((name) => {
        const swA = getSwing(name, partyA);
        const swB = getSwing(name, partyB);
        // Transfer score: how much did A lose where B gained (or vice versa)
        let score = 0;
        let direction = null; // 'AtoB' or 'BtoA'
        if (swA < -0.3 && swB > 0.3) {
          score = Math.min(Math.abs(swA), swB);
          direction = 'AtoB';
        } else if (swB < -0.3 && swA > 0.3) {
          score = Math.min(Math.abs(swB), swA);
          direction = 'BtoA';
        }
        return { name, swA, swB, score, direction };
      })
      .filter((d) => d.score > 0.3)
      .sort((a, b) => b.score - a.score);
  }, [partyA, partyB]);

  if (!pA || !pB) return null;

  // Head-to-head for selected kreds
  const headToHead = kredsName ? (() => {
    const d26 = getResults(kredsName, 2026);
    const d22 = getResults(kredsName, 2022);
    if (!d26 || !d22) return null;
    const revMap = { "OE": "Ø", "AE": "Æ", "AA": "Å" };
    const keyA = revMap[partyA] || partyA;
    const keyB = revMap[partyB] || partyB;
    return {
      a22: d22.p[keyA]?.[1] || 0,
      a26: d26.p[keyA]?.[1] || 0,
      b22: d22.p[keyB]?.[1] || 0,
      b26: d26.p[keyB]?.[1] || 0,
      swA: getSwing(kredsName, partyA),
      swB: getSwing(kredsName, partyB),
    };
  })() : null;

  return (
    <div style={{ padding: "12px 16px" }}>
      {/* Head-to-head comparison */}
      {kredsName && headToHead ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: "#e8e8ec",
            fontFamily: "'Playfair Display', serif", marginBottom: 12,
          }}>
            {kredsName}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 8, alignItems: "center" }}>
            {/* Party A */}
            <div style={{
              background: pA.color + "15", borderRadius: 10, padding: "10px 12px",
              borderLeft: `3px solid ${pA.color}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pA.color, marginBottom: 6 }}>
                {pA.short}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8888a0", marginBottom: 2 }}>
                <span>2022</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{headToHead.a22.toFixed(1)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#e8e8ec", fontWeight: 600 }}>
                <span>2026</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{headToHead.a26.toFixed(1)}%</span>
              </div>
              <div style={{
                marginTop: 6, fontSize: 14, fontWeight: 700, textAlign: "center",
                fontFamily: "'DM Mono', monospace",
                color: headToHead.swA > 0 ? "#4ade80" : headToHead.swA < 0 ? "#f87171" : "#8888a0",
              }}>
                {headToHead.swA > 0 ? "+" : ""}{headToHead.swA.toFixed(1)} pp
              </div>
            </div>

            {/* Arrow */}
            <div style={{ textAlign: "center", fontSize: 18, color: "#8888a0" }}>
              {headToHead.swA < -0.5 && headToHead.swB > 0.5 ? "→" :
               headToHead.swB < -0.5 && headToHead.swA > 0.5 ? "←" : "⇄"}
            </div>

            {/* Party B */}
            <div style={{
              background: pB.color + "15", borderRadius: 10, padding: "10px 12px",
              borderRight: `3px solid ${pB.color}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pB.color, marginBottom: 6, textAlign: "right" }}>
                {pB.short}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8888a0", marginBottom: 2 }}>
                <span>2022</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{headToHead.b22.toFixed(1)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#e8e8ec", fontWeight: 600 }}>
                <span>2026</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{headToHead.b26.toFixed(1)}%</span>
              </div>
              <div style={{
                marginTop: 6, fontSize: 14, fontWeight: 700, textAlign: "center",
                fontFamily: "'DM Mono', monospace",
                color: headToHead.swB > 0 ? "#4ade80" : headToHead.swB < 0 ? "#f87171" : "#8888a0",
              }}>
                {headToHead.swB > 0 ? "+" : ""}{headToHead.swB.toFixed(1)} pp
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#8888a0", lineHeight: 1.6, marginBottom: 16 }}>
          Klik på en kreds for at se sammenligning mellem {pA.short} og {pB.short}.
        </div>
      )}

      {/* Top movers ranking */}
      <div>
        <div style={{
          fontSize: 10, color: "#8888a0", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
        }}>
          Største vælgervandringer
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 240, overflowY: "auto" }}>
          {topMovers.slice(0, 15).map((item, i) => {
            const isSelected = item.name === kredsName;
            const fromParty = item.direction === 'AtoB' ? pA : pB;
            const toParty = item.direction === 'AtoB' ? pB : pA;
            return (
              <div
                key={item.name}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 8px", borderRadius: 6,
                  background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                  fontSize: 11, cursor: "default",
                }}
              >
                <span style={{
                  width: 18, color: "#8888a0", fontFamily: "'DM Mono', monospace",
                  fontSize: 10, flexShrink: 0,
                }}>
                  {i + 1}.
                </span>
                <span style={{
                  flex: 1, color: "#e8e8ec", fontWeight: isSelected ? 700 : 500,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {item.name}
                </span>
                <span style={{ color: fromParty.color, fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600 }}>
                  {fromParty.short}
                </span>
                <span style={{ color: "#8888a0", fontSize: 9 }}>→</span>
                <span style={{ color: toParty.color, fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600 }}>
                  {toParty.short}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  color: "#4ade80", fontWeight: 600, width: 32, textAlign: "right",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </div>
            );
          })}
          {topMovers.length === 0 && (
            <div style={{ color: "#8888a0", fontSize: 12, padding: 8 }}>
              Ingen tydelig vælgervandring mellem {pA.short} og {pB.short}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
