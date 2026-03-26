import { useState } from 'react';
import ElectionMap from './components/ElectionMap.jsx';
import { PartyPill, DetailPanel, NationalBar } from './components/Sidebar.jsx';
import TransferPanel from './components/TransferPanel.jsx';
import DemographicsPanel from './components/DemographicsPanel.jsx';
import { PARTIES, getParty, swingColor } from './data/parties.js';

const VIEWS = [
  { id: "winner", label: "Største parti" },
  { id: "swing", label: "Fremgang / tilbagegang" },
  { id: "transfer", label: "Vælgervandring" },
  { id: "demographics", label: "Demografi" },
];

export default function App() {
  const [view, setView] = useState("winner");
  const [year, setYear] = useState(2026);
  const [selectedParty, setSelectedParty] = useState("A");
  const [partyA, setPartyA] = useState("A");
  const [partyB, setPartyB] = useState("F");
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewCph, setViewCph] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #0d0d1a 0%, #141428 40%, #1a1a2e 100%)",
      color: "#e8e8ec",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "28px 28px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
          <h1 style={{
            fontSize: 32, fontFamily: "'Playfair Display', serif", fontWeight: 800,
            margin: 0, background: "linear-gradient(135deg, #e8e8ec 0%, #a0a0b8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            Valggeografien
          </h1>
          <span style={{ fontSize: 13, color: "#8888a0", fontWeight: 500 }}>FV2026</span>
        </div>
        <p style={{ fontSize: 13, color: "#8888a0", margin: "2px 0 20px", maxWidth: 520, lineHeight: 1.5 }}>
          Udforsk hvordan det politiske Danmarkskort forandrede sig ved folketingsvalget 2026.
          Data fra Danmarks Statistik · 92 opstillingskredse.
        </p>

        {/* View tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 16, flexWrap: "wrap" }}>
          {VIEWS.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: "7px 14px", border: "none", borderRadius: 8,
              background: view === v.id ? "rgba(255,255,255,0.12)" : "transparent",
              color: view === v.id ? "#e8e8ec" : "#8888a0", cursor: "pointer",
              fontSize: 13, fontWeight: view === v.id ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Demographics: side-by-side layout */}
      {view === "demographics" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden", minHeight: 500,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "12px 16px", fontSize: 11, color: "#8888a0", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Klik en kreds for at markere i grafen
              </div>
              <div style={{ flex: 1 }}>
                <ElectionMap
                  view="winner" year={2026}
                  selectedParty={selectedParty} partyA={partyA} partyB={partyB}
                  selected={selected} setSelected={setSelected}
                  hovered={hovered} setHovered={setHovered}
                  viewCph={viewCph} setViewCph={setViewCph}
                />
              </div>
            </div>
            <DemographicsPanel selected={selected} setSelected={setSelected} />
          </div>
        </div>
      ) : (
        /* Standard map + sidebar layout */
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 340px", gap: 20,
          maxWidth: 1200, margin: "0 auto", padding: "0 28px 40px",
        }}>
          {/* Map */}
          <div style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.07)", padding: 0,
            overflow: "hidden", minHeight: 550,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px",
            }}>
              <span style={{ fontSize: 11, color: "#8888a0", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {view === "winner" ? "Hvilket parti fik flest stemmer" :
                 view === "swing" ? "Ændring i procentpoint fra 2022" :
                 "Hvor det ene parti tabte, vandt det andet"}
              </span>
              {view === "winner" && (
                <div style={{ display: "flex", gap: 3 }}>
                  {[2022, 2026].map((y) => (
                    <button key={y} onClick={() => setYear(y)} style={{
                      padding: "3px 10px", border: "none", borderRadius: 5,
                      background: year === y ? "rgba(255,255,255,0.15)" : "transparent",
                      color: year === y ? "#e8e8ec" : "#8888a0", cursor: "pointer",
                      fontSize: 12, fontWeight: year === y ? 700 : 500,
                      fontFamily: "'DM Mono', monospace",
                    }}>{y}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <ElectionMap
                view={view} year={year}
                selectedParty={selectedParty} partyA={partyA} partyB={partyB}
                selected={selected} setSelected={setSelected}
                hovered={hovered} setHovered={setHovered}
                viewCph={viewCph} setViewCph={setViewCph}
              />
            </div>

            <div style={{ padding: "8px 16px 12px" }}>
              {view === "winner" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PARTIES.slice(0, 10).map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 3,
                      fontSize: 10, color: "#8888a0" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: p.color }} />
                      {p.short}
                    </div>
                  ))}
                </div>
              )}
              {view === "swing" && (
                <div style={{ display: "flex", alignItems: "center", gap: 5,
                  fontSize: 10, color: "#8888a0" }}>
                  <span>Tilbagegang</span>
                  <div style={{ display: "flex", gap: 1 }}>
                    {[-8, -5, -2, 0, 2, 5, 8].map((v) => (
                      <div key={v} style={{ width: 16, height: 8, borderRadius: 2,
                        background: swingColor(v, getParty(selectedParty)?.color || "#888") }} />
                    ))}
                  </div>
                  <span>Fremgang</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {view === "swing" && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)", padding: 16 }}>
                <div style={{ fontSize: 10, color: "#8888a0", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Vælg parti
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {PARTIES.filter(p => p.id !== "H").map((p) => (
                    <PartyPill key={p.id} party={p} selected={selectedParty === p.id}
                      onClick={() => setSelectedParty(p.id)} />
                  ))}
                </div>
              </div>
            )}

            {view === "transfer" && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)", padding: 16 }}>
                <div style={{ fontSize: 10, color: "#8888a0", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Sammenlign to partier
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#8888a0", marginBottom: 3 }}>Parti A</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {PARTIES.filter(p => p.id !== "H").map((p) => (
                      <PartyPill key={p.id} party={p} selected={partyA === p.id}
                        onClick={() => setPartyA(p.id)} small />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#8888a0", marginBottom: 3 }}>Parti B</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {PARTIES.filter(p => p.id !== "H").map((p) => (
                      <PartyPill key={p.id} party={p} selected={partyB === p.id}
                        onClick={() => setPartyB(p.id)} small />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.07)", flex: 1, minHeight: 200 }}>
              {view === "transfer" ? (
                <>
                  <div style={{ padding: "12px 16px 0", fontSize: 10, color: "#8888a0", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Vælgervandring
                  </div>
                  <TransferPanel kredsName={selected} partyA={partyA} partyB={partyB} />
                </>
              ) : (
                <>
                  <div style={{ padding: "12px 16px 0", fontSize: 10, color: "#8888a0", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {selected ? "Opstillingskreds" : "Vælg en kreds"}
                  </div>
                  <DetailPanel kredsName={selected} selectedParty={selectedParty} view={view} />
                  <div style={{ padding: "0 16px 14px" }}>
                    <NationalBar year={2026} />
                    <NationalBar year={2022} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
