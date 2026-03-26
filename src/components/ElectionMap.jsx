import { useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import geoData from '../data/geo.json';
import { getWinner, getSwing } from '../data/elections.js';
import { getParty, swingColor, interpolateColor } from '../data/parties.js';

// Copenhagen inset bounds
const DENMARK_CENTER = [56.0, 10.5];
const DENMARK_ZOOM = 7;
const CPH_CENTER = [55.69, 12.53];
const CPH_ZOOM = 12;

function getFillColor(name, view, year, selectedParty, partyA, partyB) {
  if (view === "winner") {
    const w = getWinner(name, year);
    return getParty(w)?.color || "#333";
  }
  if (view === "swing") {
    const sw = getSwing(name, selectedParty);
    const party = getParty(selectedParty);
    return swingColor(sw, party?.color || "#888");
  }
  if (view === "transfer") {
    const sw1 = getSwing(name, partyA);
    const sw2 = getSwing(name, partyB);
    const pA = getParty(partyA);
    const pB = getParty(partyB);
    if (sw1 < -0.5 && sw2 > 0.5) {
      const t = Math.min(Math.min(Math.abs(sw1), sw2) / 6, 1);
      return interpolateColor("#3a3a4a", pB?.color || "#888", t);
    }
    if (sw2 < -0.5 && sw1 > 0.5) {
      const t = Math.min(Math.min(Math.abs(sw2), sw1) / 6, 1);
      return interpolateColor("#3a3a4a", pA?.color || "#888", t);
    }
    return "#3a3a4a";
  }
  return "#333";
}

// Component to handle map view changes
function MapController({ viewCph }) {
  const map = useMap();
  useEffect(() => {
    if (viewCph) {
      map.flyTo(CPH_CENTER, CPH_ZOOM, { duration: 0.8 });
    } else {
      map.flyTo(DENMARK_CENTER, DENMARK_ZOOM, { duration: 0.8 });
    }
  }, [viewCph, map]);
  return null;
}

export default function ElectionMap({
  view, year, selectedParty, partyA, partyB,
  selected, setSelected, hovered, setHovered, viewCph, setViewCph
}) {
  const geoJsonRef = useRef(null);

  // Force re-render of GeoJSON when view params change
  const styleKey = useMemo(() =>
    `${view}-${year}-${selectedParty}-${partyA}-${partyB}`,
    [view, year, selectedParty, partyA, partyB]
  );

  const style = useCallback((feature) => {
    const name = feature.properties.OPSTILNAVN;
    const isSelected = selected === name;
    const isHovered = hovered === name;
    return {
      fillColor: getFillColor(name, view, year, selectedParty, partyA, partyB),
      weight: isSelected ? 2.5 : isHovered ? 2 : 0.8,
      color: isSelected ? '#f0f0f0' : isHovered ? '#ccc' : 'rgba(255,255,255,0.2)',
      fillOpacity: 0.85,
      className: '',
    };
  }, [view, year, selectedParty, partyA, partyB, selected, hovered]);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.OPSTILNAVN;
    const storkreds = feature.properties.STORKRNAVN;

    layer.on({
      mouseover: (e) => {
        setHovered(name);
        e.target.setStyle({ weight: 2, color: '#ccc' });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        setHovered(null);
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: () => {
        setSelected(selected === name ? null : name);
      },
    });

    layer.bindTooltip(
      `<strong>${name}</strong><br/><span style="opacity:0.7">${storkreds} Storkreds</span>`,
      { sticky: true, className: 'dark-tooltip', direction: 'top', offset: [0, -10] }
    );
  }, [selected, setSelected, setHovered]);

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 500, borderRadius: 14, overflow: 'hidden' }}>
      <MapContainer
        center={DENMARK_CENTER}
        zoom={DENMARK_ZOOM}
        style={{ height: '100%', width: '100%', background: '#0d0d1a' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.4}
        />
        <GeoJSON
          key={styleKey}
          ref={geoJsonRef}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
        <MapController viewCph={viewCph} />
      </MapContainer>

      {/* Copenhagen zoom toggle */}
      <button
        onClick={() => setViewCph(!viewCph)}
        style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
          padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, background: viewCph ? 'rgba(255,255,255,0.15)' : 'rgba(15,15,30,0.85)',
          color: '#e8e8ec', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", backdropFilter: 'blur(8px)',
          transition: 'all 0.15s',
        }}
      >
        {viewCph ? '← Hele Danmark' : 'Zoom: København'}
      </button>
    </div>
  );
}
