/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AdminSchoolMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

const roundTo6 = (num: number): number => {
  return parseFloat(num.toFixed(6));
};

export default function AdminSchoolMap({ latitude, longitude, onChange, disabled = false }: AdminSchoolMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Track values in refs to avoid useEffect dependency loops while keeping callbacks fresh
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Search location state
  const [searchQuery, setSearchQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Geocoding function using OpenStreetMap Nominatim API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !searchQuery.trim()) return;
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Jakarta, Indonesia')}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = roundTo6(parseFloat(first.lat));
        const newLng = roundTo6(parseFloat(first.lon));
        onChangeRef.current(newLat, newLng);
        
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 15);
        }
      } else {
        alert('Lokasi tidak ditemukan. Cari lokasi yang lebih spesifik di Jakarta (misal: "Menteng" atau "Kebon Jeruk").');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  // 1. Initial Map Setup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create custom SVG pulse marker icon
    const customMarkerIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center">
          <div class="relative flex items-center justify-center">
            ${disabled ? '' : '<span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-500/50 opacity-75"></span>'}
            <div class="relative ${disabled ? 'bg-zinc-600' : 'bg-indigo-600'} text-white rounded-full p-2.5 border-2 border-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M20 10c0 4.993-5.539 10.153-7.599 11.937a1.004 1.004 0 0 1-1.282 0C9.039 20.153 3.5 14.993 3.5 10a8.5 8.5 0 1 1 17 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Initialize Map centered on latitude, longitude
    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      scrollWheelZoom: !disabled,
      dragging: !disabled,
      touchZoom: !disabled,
      doubleClickZoom: !disabled,
      boxZoom: !disabled,
    });

    mapRef.current = map;

    // Add Dark Mode/Custom styled Tiles from OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Create marker
    const marker = L.marker([latitude, longitude], {
      icon: customMarkerIcon,
      draggable: !disabled,
    }).addTo(map);

    markerRef.current = marker;

    if (!disabled) {
      // Synchronize marker drag movements
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChangeRef.current(roundTo6(position.lat), roundTo6(position.lng));
      });

      // Handle maps clicks to relocate marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const roundedLat = roundTo6(lat);
        const roundedLng = roundTo6(lng);
        marker.setLatLng([roundedLat, roundedLng]);
        onChangeRef.current(roundedLat, roundedLng);
      });
    }

    // Invalidate size in a short timeout to handle DOM sizing delay cleanly
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(t);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [disabled]); // Re-initialize map if disabled state changes so handler/drag properties are properly remuted

  // 2. Sync External Coordinate values to Marker
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== latitude || currentPos.lng !== longitude) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  return (
    <div id="school-leaflet-wrapper" className="space-y-3 font-sans">
      {!disabled && (
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kelurahan/kecamatan/jalan di Jakarta..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={geocoding}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              {geocoding ? 'Mencari...' : 'Cari'}
            </button>
          </form>
        </div>
      )}

      <div className="relative">
        {/* Leaflet instance container */}
        <div
          ref={mapContainerRef}
          className={`w-full h-[220px] rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner z-10 ${disabled ? 'opacity-85 pointer-events-none' : ''}`}
          style={{ position: 'relative' }}
        />
        {!disabled && (
          <div className="absolute bottom-2 left-2 z-20 bg-zinc-950/90 text-[9px] font-mono text-zinc-400 border border-zinc-800 rounded-lg px-2 py-1 pointer-events-none">
            📍 Geser pin atau klik peta untuk menggeser koordinat
          </div>
        )}
      </div>
    </div>
  );
}
