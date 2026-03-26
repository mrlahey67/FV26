import { useState, useMemo, useRef, useEffect } from 'react';
import { PARTIES, getParty, normParty } from '../data/parties.js';
import { getSwing, getResults } from '../data/elections.js';
import demographics from '../data/demographics.json';
import E26 from '../data/election2026.json';

const DEMO_VARS = [
  { id: "edu", label: "Videregående uddannelse", unit: "%", desc: "Andel med kort/mellemlang/lang videregående uddannelse" },
  { id: "inc", label: "Disponibel indkomst", unit: "k kr", desc: "Gennemsnitlig disponibel indkomst pr. person" },
  { id: "age", label: "Gennemsnitsalder", unit: "år", desc: "Gennemsnitlig alder i kommunen" },
];

const METRICS = [
  { id: "swing", label: "Fremgang/tilbagegang (pp)" },
  { id: "pct2026", label: "Stemmeprocent 2026" },
];

function ScatterPlot({ demoVar, metric, partyId, setSelected, selected }) {
  const canvasRef = useRef(null);
  const party = getParty(partyId);
  const kredsNames = Object.keys(E26);

  const points = useMemo(() => {
    return kredsNames.map((name) => {
      const demo = demographics[name];
      if (!demo || demo[demoVar] === null) return null;
      const x = demo[demoVar];
      let y;
      if (metric === "swing") {
        y = getSwing(name, partyId);
      } else {
        const revMap = { "OE": "Ø", "AE": "Æ", "AA": "Å" };
        const dstKey = revMap[partyId] || partyId;
        y = getResults(name, 2026)?.p[dstKey]?.[1] || 0;
      }
      return { name, x, y };
    }).filter(Boolean);
  }, [demoVar, metric, partyId]);

  // Compute bounds
  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));
  const xPad = (xMax - xMin) * 0.1 || 1;
  const yPad = (yMax - yMin) * 0.1 || 1;

  // SVG dimensions
  const W = 560, H = 320, PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const scaleX = (v) => PAD.left + ((v - (xMin - xPad)) / ((xMax + xPad) - (xMin - xPad))) * plotW;
  const scaleY = (v) => PAD.top + plotH - ((v - (yMin - yPad)) / ((yMax + yPad) - (yMin - yPad))) * plotH;

  // Simple linear regression
  const regression = useMemo(() => {
    const n = points.length;
    if (n < 3) return null;
    const mx = points.reduce((s, p) => s + p.x, 0) / n;
    const my = points.reduce((s, p) => s + p.y, 0) / n;
    let num = 0, den = 0;
    for (const p of points) {
      num += (p.x - mx) * (p.y - my);
      den += (p.x - mx) * (p.x - mx);
    }
    if (den === 0) return null;
    const slope = num / den;
    const intercept = my - slope * mx;
    // R-squared
    const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const ssTot = points.reduce((s, p) => s + Math.pow(p.y - my, 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    return { slope, intercept, r2 };
  }, [points]);

  // Zero line for swing
  const zeroY = metric === "swing" ? scaleY(0) : null;

  const [hoveredPoint, setHoveredPoint] = useState(null);

  const demoInfo = DEMO_VARS.find((d) => d.id === demoVar);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => {
          const y = PAD.top + plotH * t;
          return <line key={`h${t}`} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />;
        })}

        {/* Zero line for swing */}
        {zeroY && zeroY > PAD.top && zeroY < PAD.top + plotH && (
          <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
        )}

        {/* Regression line */}
        {regression && (
          <line
            x1={scaleX(xMin - xPad * 0.5)}
            y1={scaleY(regression.slope * (xMin - xPad * 0.5) + regression.intercept)}
            x2={scaleX(xMax + xPad * 0.5)}
            y2={scaleY(regression.slope * (xMax + xPad * 0.5) + regression.intercept)}
            stroke={party?.color || "#888"}
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeDasharray="6 3"
          />
        )}

        {/* Points */}
        {points.map((p) => {
          const isHov = hoveredPoint === p.name;
          const isSel = selected === p.name;
          return (
            <circle
              key={p.name}
              cx={scaleX(p.x)}
              cy={scaleY(p.y)}
              r={isSel ? 6 : isHov ? 5 : 3.5}
              fill={party?.color || "#888"}
              fillOpacity={isSel ? 1 : isHov ? 0.9 : 0.6}
              stroke={isSel ? "#fff" : "none"}
              strokeWidth={isSel ? 1.5 : 0}
              style={{ cursor: "pointer", transition: "r 0.15s" }}
              onMouseEnter={() => setHoveredPoint(p.name)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => setSelected(selected === p.name ? null : p.name)}
            />
          );
        })}

        {/* Hover label */}
        {hoveredPoint && (() => {
          const p = points.find((pt) => pt.name === hoveredPoint);
          if (!p) return null;
          const tx = scaleX(p.x);
          const ty = scaleY(p.y) - 12;
          return (
            <g>
              <rect x={tx - 55} y={ty - 14} width={110} height={18} rx={4}
                fill="rgba(15,15,30,0.9)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              <text x={tx} y={ty - 2} textAnchor="middle" fill="#e8e8ec"
                fontSize="10" fontFamily="'DM Sans', sans-serif" fontWeight="600">
                {p.name}: {p.y > 0 && metric === "swing" ? "+" : ""}{p.y.toFixed(1)}
              </text>
            </g>
          );
        })()}

        {/* Axes labels */}
        <text x={W / 2} y={H - 5} textAnchor="middle" fill="#8888a0"
          fontSize="10" fontFamily="'DM Sans', sans-serif">
          {demoInfo?.label} ({demoInfo?.unit})
        </text>
        <text x={12} y={H / 2} textAnchor="middle" fill="#8888a0"
          fontSize="10" fontFamily="'DM Sans', sans-serif"
          transform={`rotate(-90, 12, ${H / 2})`}>
          {metric === "swing" ? "Ændring (pp)" : "Stemmeprocent (%)"}
        </text>

        {/* Axis tick labels */}
        {[0, 0.5, 1].map((t) => {
          const val = xMin - xPad + t * ((xMax + xPad) - (xMin - xPad));
          return (
            <text key={`xt${t}`} x={PAD.left + t * plotW} y={PAD.top + plotH + 16}
              textAnchor="middle" fill="#8888a0" fontSize="9" fontFamily="'DM Mono', monospace">
              {val.toFixed(0)}
            </text>
          );
        })}
        {[0, 0.5, 1].map((t) => {
          const val = yMin - yPad + (1 - t) * ((yMax + yPad) - (yMin - yPad));
          return (
            <text key={`yt${t}`} x={PAD.left - 6} y={PAD.top + t * plotH + 3}
              textAnchor="end" fill="#8888a0" fontSize="9" fontFamily="'DM Mono', monospace">
              {val.toFixed(1)}
            </text>
          );
        })}
      </svg>

      {/* R² indicator */}
      {regression && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 8px", fontSize: 11, color: "#8888a0",
        }}>
          <span>
            R² = <span style={{ color: "#e8e8ec", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              {regression.r2.toFixed(3)}
            </span>
          </span>
          <span style={{ fontSize: 10 }}>
            {regression.r2 > 0.3 ? "Stærk sammenhæng" :
             regression.r2 > 0.1 ? "Moderat sammenhæng" : "Svag sammenhæng"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DemographicsPanel({ selected, setSelected }) {
  const [demoVar, setDemoVar] = useState("edu");
  const [metric, setMetric] = useState("swing");
  const [partyId, setPartyId] = useState("A");

  return (
    <div>
      {/* Controls */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.07)", padding: 16, marginBottom: 14,
      }}>
        <div style={{ fontSize: 10, color: "#8888a0", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Demografisk variabel
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
          {DEMO_VARS.map((d) => (
            <button key={d.id} onClick={() => setDemoVar(d.id)} style={{
              padding: "4px 10px", border: "none", borderRadius: 6,
              background: demoVar === d.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
              color: demoVar === d.id ? "#e8e8ec" : "#8888a0", cursor: "pointer",
              fontSize: 11, fontWeight: demoVar === d.id ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#8888a0", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Parti &amp; metrik
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {PARTIES.filter((p) => !["H"].includes(p.id)).map((p) => (
            <button key={p.id} onClick={() => setPartyId(p.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 14,
              border: partyId === p.id ? `2px solid ${p.color}` : "2px solid transparent",
              background: partyId === p.id ? p.color + "20" : "rgba(255,255,255,0.03)",
              color: partyId === p.id ? p.color : "#8888a0", cursor: "pointer",
              fontSize: 11, fontWeight: partyId === p.id ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color,
                opacity: partyId === p.id ? 1 : 0.4 }} />
              {p.short}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {METRICS.map((m) => (
            <button key={m.id} onClick={() => setMetric(m.id)} style={{
              padding: "3px 8px", border: "none", borderRadius: 6,
              background: metric === m.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
              color: metric === m.id ? "#e8e8ec" : "#8888a0", cursor: "pointer",
              fontSize: 11, fontWeight: metric === m.id ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scatterplot */}
      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.07)", padding: "12px 8px",
      }}>
        <ScatterPlot
          demoVar={demoVar} metric={metric} partyId={partyId}
          selected={selected} setSelected={setSelected}
        />
      </div>
    </div>
  );
}
