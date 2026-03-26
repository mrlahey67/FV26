// Party definitions and helper functions

export const PARTIES = [
  { id: "A", name: "Socialdemokratiet", short: "S", color: "#C8102E" },
  { id: "F", name: "SF", short: "SF", color: "#E4007C" },
  { id: "V", name: "Venstre", short: "V", color: "#004B87" },
  { id: "I", name: "Liberal Alliance", short: "LA", color: "#1B9AA0" },
  { id: "O", name: "Dansk Folkeparti", short: "DF", color: "#FDDA24" },
  { id: "M", name: "Moderaterne", short: "M", color: "#8B6DAF" },
  { id: "C", name: "De Konservative", short: "KF", color: "#00583C" },
  { id: "OE", name: "Enhedslisten", short: "EL", color: "#E6801A" },
  { id: "B", name: "Radikale Venstre", short: "RV", color: "#733280" },
  { id: "AE", name: "Danmarksdemokraterne", short: "DD", color: "#7B2D26" },
  { id: "AA", name: "Alternativet", short: "ALT", color: "#2DC84D" },
  { id: "H", name: "Borgernes Parti", short: "BP", color: "#555" },
];

// DST uses Ø for Enhedslisten, Æ for DD, Å for ALT
const DST_MAP = { "Ø": "OE", "Æ": "AE", "Å": "AA" };
export const normParty = (p) => DST_MAP[p] || p;
export const getParty = (id) => PARTIES.find((p) => p.id === id);

export function interpolateColor(c1, c2, t) {
  const hex = (c) => parseInt(c.replace("#", ""), 16);
  const [r1, g1, b1] = [(hex(c1) >> 16) & 255, (hex(c1) >> 8) & 255, hex(c1) & 255];
  const [r2, g2, b2] = [(hex(c2) >> 16) & 255, (hex(c2) >> 8) & 255, hex(c2) & 255];
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function swingColor(swing, partyColor) {
  if (Math.abs(swing) < 0.3) return "#3a3a4a";
  const intensity = Math.min(Math.abs(swing) / 10, 1);
  if (swing > 0) return interpolateColor("#3a3a4a", partyColor, intensity);
  return interpolateColor("#3a3a4a", "#1a1a2e", intensity * 0.7);
}
