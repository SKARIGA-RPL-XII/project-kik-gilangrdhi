"use client";

import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import { useEffect } from "react";
import { Locate } from "lucide-react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  lat: number;
  lng: number;
  radius: number;
  setLat: (val: number) => void;
  setLng: (val: number) => void;
}

interface SearchResult {
  location: {
    x: number;
    y: number;
    label?: string;
  };
}

const SearchField = ({ setLat, setLng }: { setLat: (v: number) => void; setLng: (v: number) => void }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    // @ts-expect-error: GeoSearchControl tidak memiliki type definition yang lengkap di beberapa versi
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      keepResult: true,
      autoClose: true,
      searchLabel: 'Cari alamat kantor...',
    });

    map.addControl(searchControl);

    const handleLocationFound = (event: L.LeafletEvent) => {
      const result = (event as unknown as { location: SearchResult['location'] });
      const { x, y } = result.location;
      setLat(y);
      setLng(x);
    };

    map.on('geosearch/showlocation', handleLocationFound);
    return () => {
      map.off('geosearch/showlocation', handleLocationFound);
      map.removeControl(searchControl);
    };
  }, [map, setLat, setLng]);

  return null;
};

function LocationMarker({ lat, lng, radius, setLat, setLng }: MapProps) {
  const map = useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return (
    <>
      <Marker position={[lat, lng]} icon={icon} />
      <Circle 
        center={[lat, lng]} 
        radius={radius} 
        pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.2 }} 
      />
    </>
  );
}

const CurrentLocationButton = ({ onLocate }: { onLocate: () => void }) => {
  return (
    <div className="absolute top-20 left-3 z-1000">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLocate();
        }}
        className="bg-white p-2 rounded-md shadow-md border border-gray-300 hover:bg-gray-50 text-gray-700"
        title="Gunakan Lokasi Saya Sekarang"
      >
        <Locate size={20} />
      </button>
    </div>
  );
};

export default function CompanyMap({ lat, lng, radius, setLat, setLng }: MapProps) {
  
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);
        },
        (error) => {
          alert("Gagal mendeteksi lokasi. Pastikan GPS aktif.");
          console.error(error);
        }
      );
    } else {
      alert("Browser tidak mendukung Geolocation.");
    }
  };

  return (
    <div className="h-62.5 w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative shadow-inner bg-slate-50">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SearchField setLat={setLat} setLng={setLng} />
        <LocationMarker lat={lat} lng={lng} radius={radius} setLat={setLat} setLng={setLng} />
        
        <CurrentLocationButton onLocate={handleCurrentLocation} />
      
      </MapContainer>
    </div>
  );
}