import E26 from './election2026.json';
import E22 from './election2022.json';
import { normParty, getParty } from './parties.js';

export function getResults(kredsName, year) {
  const ed = year === 2026 ? E26 : E22;
  return ed[kredsName] || null;
}

export function getWinner(kredsName, year) {
  const data = getResults(kredsName, year);
  if (!data) return null;
  let maxPct = 0, winner = null;
  for (const [p, vals] of Object.entries(data.p)) {
    if (vals[1] > maxPct) { maxPct = vals[1]; winner = normParty(p); }
  }
  return winner;
}

export function getSwing(kredsName, partyId) {
  const d26 = getResults(kredsName, 2026);
  const d22 = getResults(kredsName, 2022);
  if (!d26 || !d22) return 0;
  const revMap = { "OE": "Ø", "AE": "Æ", "AA": "Å" };
  const dstKey = revMap[partyId] || partyId;
  const pct26 = d26.p[dstKey]?.[1] || 0;
  const pct22 = d22.p[dstKey]?.[1] || 0;
  return pct26 - pct22;
}

export function getNationalTotals(year) {
  const ed = year === 2026 ? E26 : E22;
  const totals = {};
  for (const kreds of Object.values(ed)) {
    for (const [p, v] of Object.entries(kreds.p)) {
      const id = normParty(p);
      totals[id] = (totals[id] || 0) + v[0];
    }
  }
  return totals;
}
