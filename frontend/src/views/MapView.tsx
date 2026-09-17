import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SystemState, AffectedZone, Warehouse, Hospital, Shelter, Road } from '../types';
import { Layers, MapPin, AlertTriangle, Check, Shield, Navigation, Globe, Key, X, CheckCircle, Info, RefreshCw } from 'lucide-react';

export type BaseMapStyle = 'tactical_dark' | 'osm' | 'satellite';

interface BaseMapOption {
  id: BaseMapStyle;
  name: string;
  badge: string;
  getUrl: (cartoKey?: string) => string;
  getOptions: () => L.TileLayerOptions;
}

const BASEMAP_CONFIGS: Record<BaseMapStyle, BaseMapOption> = {
  tactical_dark: {
    id: 'tactical_dark',
    name: 'Tactical Dark',
    badge: 'Keyless Charcoal',
    getUrl: (cartoKey) => {
      if (cartoKey && cartoKey.trim().length > 0) {
        return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoKey.trim())}`;
      }
      // 100% Free, reliable ESRI Dark Gray Canvas without watermarks or API key requirements
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    },
    getOptions: () => ({
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxNativeZoom: 16,
      maxZoom: 19,
    }),
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    badge: 'Keyless Street',
    getUrl: () => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    getOptions: () => ({
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19,
    }),
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Aerial',
    badge: 'Keyless HD Imagery',
    getUrl: () => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    getOptions: () => ({
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and GIS User Community',
      maxNativeZoom: 18,
      maxZoom: 19,
    }),
  },
};

interface MapViewProps {
  state: SystemState;
  onToggleRoad: (roadId: string) => void;
  isDarkMode?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ state, onToggleRoad, isDarkMode = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [cartoKey, setCartoKey] = useState<string>(() => {
    return localStorage.getItem('resqgrid_carto_key') || '';
  });
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>(() => {
    return isDarkMode ? 'tactical_dark' : 'osm';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<AffectedZone | null>(state.zones[0] || null);
  const [showZones, setShowZones] = useState(true);
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Markers layer groups
  const zonesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const whLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const hospLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const shelterLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routesLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Automatically adapt basemap when global theme toggles
  useEffect(() => {
    if (isDarkMode && baseMapStyle === 'osm') {
      setBaseMapStyle('tactical_dark');
    } else if (!isDarkMode && baseMapStyle === 'tactical_dark') {
      setBaseMapStyle('osm');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center at Guwahati / Brahmaputra river basin (26.18, 91.75)
      const map = L.map(mapContainerRef.current, {
        center: [26.18, 91.75],
        zoom: 12,
        zoomControl: true,
      });

      const config = BASEMAP_CONFIGS[baseMapStyle];
      const tileUrl = config.getUrl(cartoKey);
      const tileOpts = config.getOptions();

      tileLayerRef.current = L.tileLayer(tileUrl, tileOpts).addTo(map);

      zonesLayerRef.current.addTo(map);
      whLayerRef.current.addTo(map);
      hospLayerRef.current.addTo(map);
      shelterLayerRef.current.addTo(map);
      routesLayerRef.current.addTo(map);

      mapInstanceRef.current = map;

      // Ensure proper map sizing on initial render
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, []);

  // Update tile layer whenever baseMapStyle or cartoKey changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const config = BASEMAP_CONFIGS[baseMapStyle];
    const tileUrl = config.getUrl(cartoKey);
    const tileOpts = config.getOptions();

    tileLayerRef.current = L.tileLayer(tileUrl, tileOpts).addTo(mapInstanceRef.current);
  }, [baseMapStyle, cartoKey]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempKeyInput.trim();
    if (clean) {
      localStorage.setItem('resqgrid_carto_key', clean);
      setCartoKey(clean);
      setKeySaveMessage('Custom Carto API Key activated successfully.');
    } else {
      localStorage.removeItem('resqgrid_carto_key');
      setCartoKey('');
      setKeySaveMessage('Reverted to 100% Keyless Basemap (Zero API Key Required).');
    }
    setTimeout(() => {
      setKeySaveMessage(null);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  const handleClearKey = () => {
    localStorage.removeItem('resqgrid_carto_key');
    setCartoKey('');
    setTempKeyInput('');
    setKeySaveMessage('Reverted to 100% Keyless Basemap (Zero API Key Required).');
    setTimeout(() => {
      setKeySaveMessage(null);
      setIsKeyModalOpen(false);
    }, 1200);
  };


  // Update layers whenever state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Render Zones
    zonesLayerRef.current.clearLayers();
    if (showZones) {
      state.zones.forEach((z) => {
        const color = z.priority_score >= 80 ? '#EF4444' : z.priority_score >= 60 ? '#F59E0B' : '#10B981';
        const circle = L.circle([z.lat, z.lon], {
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          radius: 800 + z.severity * 600,
          weight: 2,
        });

        circle.bindTooltip(`<strong>${z.name}</strong><br/>Priority: ${z.priority_score}<br/>Affected: ${z.affected_population.toLocaleString()}`, {
          permanent: false,
          direction: 'top',
        });

        circle.on('click', () => setSelectedZone(z));
        circle.addTo(zonesLayerRef.current);

        // Center dot marker
        const marker = L.circleMarker([z.lat, z.lon], {
          radius: 6,
          color: '#FFFFFF',
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        });
        marker.on('click', () => setSelectedZone(z));
        marker.addTo(zonesLayerRef.current);
      });
    }

    // 2. Render Warehouses
    whLayerRef.current.clearLayers();
    if (showWarehouses) {
      state.warehouses.forEach((w) => {
        const iconHtml = `<div style="background: #0EA5FF; color: white; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(14,165,233,0.5); font-size: 11px;">WH</div>`;
        const customIcon = L.divIcon({ html: iconHtml, className: 'custom-wh-marker', iconSize: [28, 28] });
        const marker = L.marker([w.lat, w.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="color: #020617; font-size: 12px; min-width: 180px;">
            <strong style="font-size: 13px; color: #0369A1;">${w.name}</strong><br/>
            <span>Water: <strong>${w.inventory.water?.toLocaleString() || 0} L</strong></span><br/>
            <span>Food: <strong>${w.inventory.food?.toLocaleString() || 0} rk</strong></span><br/>
            <span>Med Kits: <strong>${w.inventory.medical_kits?.toLocaleString() || 0}</strong></span><br/>
            <span>Ambulances: <strong>${w.inventory.ambulances || 0}</strong></span>
          </div>
        `);
        marker.addTo(whLayerRef.current);
      });
    }

    // 3. Render Hospitals
    hospLayerRef.current.clearLayers();
    if (showHospitals) {
      state.hospitals.forEach((h) => {
        const iconHtml = `<div style="background: #EF4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 12px;">+</div>`;
        const customIcon = L.divIcon({ html: iconHtml, className: 'custom-hosp-marker', iconSize: [24, 24] });
        const marker = L.marker([h.lat, h.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="color: #020617; font-size: 12px;">
            <strong style="color: #B91C1C;">${h.name}</strong><br/>
            Available Beds: <strong>${h.available_beds}</strong> / ${h.total_beds}<br/>
            ICU Available: <strong>${h.icu_available}</strong><br/>
            Status: <em>${h.status}</em>
          </div>
        `);
        marker.addTo(hospLayerRef.current);
      });
    }

    // 4. Render Shelters
    shelterLayerRef.current.clearLayers();
    if (showShelters) {
      state.shelters.forEach((s) => {
        const iconHtml = `<div style="background: #10B981; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; font-size: 10px;">S</div>`;
        const customIcon = L.divIcon({ html: iconHtml, className: 'custom-shelter-marker', iconSize: [22, 22] });
        const marker = L.marker([s.lat, s.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="color: #020617; font-size: 12px;">
            <strong style="color: #047857;">${s.name}</strong><br/>
            Available Capacity: <strong>${s.available_capacity}</strong> / ${s.capacity}<br/>
            Occupancy: ${Math.round((s.current_occupancy / s.capacity) * 100)}%
          </div>
        `);
        marker.addTo(shelterLayerRef.current);
      });
    }

    // 5. Render Allocation Routes & Road Statuses
    routesLayerRef.current.clearLayers();
    if (showRoutes) {
      // First, render active allocations
      state.active_allocations.forEach((alloc) => {
        const wh = state.warehouses.find((w) => w.id === alloc.source_warehouse_id);
        const z = state.zones.find((zone) => zone.id === alloc.destination_zone_id);
        if (wh && z) {
          const line = L.polyline([[wh.lat, wh.lon], [z.lat, z.lon]], {
            color: '#0EA5FF',
            weight: 2.5,
            opacity: 0.7,
            dashArray: '4, 8',
          });
          line.bindTooltip(`${alloc.resource_type}: ${alloc.quantity.toLocaleString()} units &rarr; ${z.name}`);
          line.addTo(routesLayerRef.current);
        }
      });

      // Also render road status segments
      state.roads.forEach((road) => {
        const wh = state.warehouses.find((w) => w.id === road.from_node);
        const z = state.zones.find((zone) => zone.id === road.to_node);
        if (wh && z) {
          const isBlocked = road.status === 'blocked';
          const roadLine = L.polyline([[wh.lat, wh.lon], [z.lat, z.lon]], {
            color: isBlocked ? '#EF4444' : '#10B981',
            weight: isBlocked ? 5 : 2,
            opacity: isBlocked ? 0.9 : 0.4,
            dashArray: isBlocked ? '6, 6' : undefined,
          });

          roadLine.bindTooltip(`
            <strong>${road.name} (${road.id})</strong><br/>
            Status: <span style="color: ${isBlocked ? 'red' : 'green'}">${road.status.toUpperCase()}</span><br/>
            Travel: ${road.standard_travel_min}m (${road.distance_km}km)<br/>
            <em>Click line to toggle closure</em>
          `);

          roadLine.on('click', () => onToggleRoad(road.id));
          roadLine.addTo(routesLayerRef.current);
        }
      });
    }
  }, [state, showZones, showWarehouses, showHospitals, showShelters, showRoutes, onToggleRoad]);

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Operational GIS Disaster Resource Map</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                100% Keyless Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Tactical Charcoal & OpenStreetMap Basemaps &bull; Zero API Key Required &bull; No Watermarks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Basemap Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setBaseMapStyle('tactical_dark')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                baseMapStyle === 'tactical_dark'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="High-Contrast Tactical Charcoal Canvas (Keyless & Watermark-Free)"
            >
              <Shield className="w-3 h-3" />
              <span>Tactical Dark</span>
            </button>
            <button
              onClick={() => setBaseMapStyle('osm')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                baseMapStyle === 'osm'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="OpenStreetMap Standard (Zero Key Required)"
            >
              <Globe className="w-3 h-3" />
              <span>Street Map</span>
            </button>
            <button
              onClick={() => setBaseMapStyle('satellite')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                baseMapStyle === 'satellite'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ESRI High-Definition Aerial Satellite (Zero Key Required)"
            >
              <Layers className="w-3 h-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* API Key / Provider Status Badge */}
          <button
            onClick={() => {
              setTempKeyInput(cartoKey);
              setIsKeyModalOpen(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition ${
              cartoKey
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40'
            }`}
            title="Configure Map API Key or Provider"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{cartoKey ? 'Carto Key: Active' : 'Keyless GIS: Ready'}</span>
          </button>

          {/* Layer Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                showZones
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              Zones ({state.zones.length})
            </button>
            <button
              onClick={() => setShowWarehouses(!showWarehouses)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                showWarehouses
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              Warehouses ({state.warehouses.length})
            </button>
            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                showHospitals
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              Hospitals ({state.hospitals.length})
            </button>
            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                showShelters
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              Shelters ({state.shelters.length})
            </button>
            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                showRoutes
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              Routes & Roads
            </button>
          </div>
        </div>
      </div>


      {/* Main Map + Zone Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl text-xs space-y-1.5 z-[1000] pointer-events-auto">
            <div className="font-semibold text-slate-200 text-[11px] mb-1">MAP LEGEND</div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300">Critical Zone (Score &ge; 80)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-sky-500" />
              <span className="text-slate-300">Warehouse Depot (WH)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-600 font-bold text-[9px] text-white text-center leading-3">+</span>
              <span className="text-slate-300">Hospital / Trauma Center</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-1 bg-red-500 border-dashed border-b" />
              <span className="text-slate-300">Blocked Road (No access)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-1 bg-sky-400" />
              <span className="text-slate-300">Active Supply Deployment</span>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="space-y-4">
          {selectedZone ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-sky-400 font-bold">{selectedZone.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedZone.priority_score >= 80
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    Score: {selectedZone.priority_score}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedZone.name}</h3>
                <p className="text-xs text-slate-400 italic mt-1">{selectedZone.notes}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Affected Population:</span>
                  <span className="font-semibold text-white">{selectedZone.affected_population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Flood Severity:</span>
                  <span className="font-semibold text-red-400">{Math.round(selectedZone.severity * 100)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Vulnerability Index:</span>
                  <span className="font-semibold text-amber-300">{Math.round(selectedZone.vulnerability * 100)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Road Navigability:</span>
                  <span className="font-semibold text-emerald-400">{Math.round(selectedZone.road_accessibility * 100)}%</span>
                </div>
              </div>

              {/* Demand Requirements */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Demand Requirements:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Water Need</span>
                    <strong className="text-white">{selectedZone.water_need.toLocaleString()} L</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Food Need</span>
                    <strong className="text-white">{selectedZone.food_need.toLocaleString()} rk</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Medical Kits</span>
                    <strong className="text-white">{selectedZone.medical_need} kits</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Ambulances</span>
                    <strong className="text-white">{selectedZone.ambulances_need} vehicles</strong>
                  </div>
                </div>
              </div>

              {/* Active incoming allocations */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Allocated Inflow:</div>
                {state.active_allocations
                  .filter((a) => a.destination_zone_id === selectedZone.id)
                  .map((a) => (
                    <div key={a.id} className="p-2 rounded bg-sky-950/40 border border-sky-500/20 text-xs">
                      <div className="flex justify-between text-sky-300 font-semibold">
                        <span>{a.resource_type.replace('_', ' ')}</span>
                        <span>{a.quantity.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                        <span>From: {a.source_warehouse_name}</span>
                        <span>ETA: {a.estimated_time_min}m</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              Click any zone marker on the map to inspect its real-time demand and routes.
            </div>
          )}

          {/* Quick Road Toggling Sandbox Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Road Control (Live Re-routing)</h4>
            </div>
            <p className="text-xs text-slate-400">
              Click a road below to toggle between OPEN and BLOCKED to trigger instant dynamic re-optimization.
            </p>
            <div className="space-y-1.5">
              {state.roads.slice(0, 4).map((r) => {
                const isBlocked = r.status === 'blocked';
                return (
                  <button
                    key={r.id}
                    onClick={() => onToggleRoad(r.id)}
                    className={`w-full p-2 rounded flex items-center justify-between text-xs font-medium border transition ${
                      isBlocked
                        ? 'bg-red-950/60 border-red-500/40 text-red-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className={`text-[10px] font-mono font-bold ${isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* API Key & Basemap Manager Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    GIS Basemap & API Key Manager
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Built-in Keyless GIS &bull; Zero Watermarks &bull; Optional Custom Provider Key
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Provider Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[10px] uppercase">Active Basemap</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Keyless Online
                </span>
              </div>
              <div className="font-bold text-white text-sm">
                {BASEMAP_CONFIGS[baseMapStyle].name}
              </div>
              <p className="text-slate-400 text-[11px]">
                {baseMapStyle === 'tactical_dark' && !cartoKey && 'Rendering ESRI Dark Gray Canvas tiles. 100% free, high-performance, and completely watermark-free.'}
                {baseMapStyle === 'osm' && 'Rendering official OpenStreetMap standard tiles. 100% open-source, fully labeled, and keyless.'}
                {baseMapStyle === 'satellite' && 'Rendering ESRI World Imagery high-resolution satellite tiles. Unmetered and keyless.'}
                {cartoKey && 'Authenticated with custom CARTO API Key.'}
              </p>
            </div>

            {/* Custom API Key Form */}
            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Carto / Provider API Key (Optional)
                </label>
                <input
                  type="text"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  placeholder="Enter custom API key if your agency has a Carto subscription..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave blank to use ResQGrid's built-in keyless basemap (recommended, prevents all "API KEY REQUIRED" watermarks).
                </p>
              </div>

              {keySaveMessage && (
                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>{keySaveMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Revert to 100% Keyless Mode</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition shadow-md shadow-sky-500/20"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

