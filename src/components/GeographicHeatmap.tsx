'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  callVolume: number;
  avgSentimentScore: number;
  happyPercent: number;
  satisfiedPercent: number;
  negativePercent: number;
  happyCount: number;
  satisfiedCount: number;
  frustratedCount: number;
  angryCount: number;
}

interface GeographicHeatmapProps {
  data: LocationData[];
}

export default function GeographicHeatmap({ data }: GeographicHeatmapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Import Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  // Calculate bounds and max volume for scaling
  const maxVolume = Math.max(...data.map(d => d.callVolume));
  const minVolume = Math.min(...data.map(d => d.callVolume));
  
  // Calculate center point
  const centerLat = data.reduce((sum, d) => sum + d.latitude, 0) / data.length || 0;
  const centerLon = data.reduce((sum, d) => sum + d.longitude, 0) / data.length || 0;

  // Get color based on sentiment score (0-5 scale)
  const getSentimentColor = (score: number, volume: number) => {
    // Color gradient from red (poor) to yellow (neutral) to green (good)
    if (score >= 4) return { color: '#10b981', fillColor: '#10b981' }; // Emerald - Happy
    if (score >= 3.5) return { color: '#22c55e', fillColor: '#22c55e' }; // Green - Satisfied
    if (score >= 2.5) return { color: '#f59e0b', fillColor: '#f59e0b' }; // Amber - Neutral
    if (score >= 1.5) return { color: '#f97316', fillColor: '#f97316' }; // Orange - Confused
    return { color: '#ef4444', fillColor: '#ef4444' }; // Red - Frustrated/Angry
  };

  // Calculate radius based on call volume (log scale for better distribution)
  const getRadius = (volume: number) => {
    const normalized = (volume - minVolume) / (maxVolume - minVolume || 1);
    return 5 + (normalized * 35); // Range: 5-40px
  };

  // Get opacity based on call volume
  const getOpacity = (volume: number) => {
    const normalized = (volume - minVolume) / (maxVolume - minVolume || 1);
    return 0.4 + (normalized * 0.5); // Range: 0.4-0.9
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border border-gray-800">
      <MapContainer
        center={[centerLat || 39.0, centerLon || 35.0]} // Default to Turkey center
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#1f2937' }}
        className="z-0"
      >
        {/* Dark mode tile layer - CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render location markers */}
        {data.map((location, index) => {
          const { color, fillColor } = getSentimentColor(location.avgSentimentScore, location.callVolume);
          const radius = getRadius(location.callVolume);
          const opacity = getOpacity(location.callVolume);

          return (
            <CircleMarker
              key={index}
              center={[location.latitude, location.longitude]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: fillColor,
                fillOpacity: opacity,
                weight: 2,
                opacity: 0.9,
              }}
              eventHandlers={{
                mouseover: (e) => {
                  e.target.setStyle({
                    fillOpacity: 0.9,
                    weight: 3,
                  });
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    fillOpacity: opacity,
                    weight: 2,
                  });
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="font-semibold text-sm">
                  {location.city}, {location.state}
                </div>
              </Tooltip>
              
              <Popup maxWidth={250}>
                <div className="p-2">
                  <h3 className="font-bold text-base mb-2 text-gray-900">
                    {location.city}, {location.state}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Call Volume:</span>
                      <span className="font-semibold">{location.callVolume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sentiment Score:</span>
                      <span className="font-semibold">{location.avgSentimentScore.toFixed(1)}/5</span>
                    </div>
                    <div className="border-t border-gray-300 mt-2 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">😊 Happy:</span>
                        <span>{location.happyPercent?.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-600">✓ Satisfied:</span>
                        <span>{location.satisfiedPercent?.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-red-600">⚠ Negative:</span>
                        <span>{location.negativePercent?.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-700 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Sentiment Score</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-300">Excellent (4-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-300">Good (3.5-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs text-gray-300">Neutral (2.5-3.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-300">Poor (1.5-2.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-300">Critical (&lt;1.5)</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">Size = Call Volume</p>
        </div>
      </div>
    </div>
  );
}
