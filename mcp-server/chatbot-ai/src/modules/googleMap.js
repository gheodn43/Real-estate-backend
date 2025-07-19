import axios from 'axios';
import haversine from 'haversine-distance';
const API_KEY = 'AIzaSyBEKDomqoh74x6sz5zGYYS7GU2hY84dvFk';
const RADIUS = 2000; // metter
const MAX_AREA_KM = 20; // km
const STEP_KM = 1.8; // km

export async function searchByGrid(
  { lat, lng },
  keyword,
  radius = RADIUS,
  maxAreaKm = MAX_AREA_KM,
  stepKm = STEP_KM
) {
  const searchPoints = generateGridPoints({ lat, lng }, maxAreaKm, stepKm);
  const placeMap = new Map();

  for (const point of searchPoints) {
    const places = await fetchNearbyPlaces(point, keyword, radius);
    for (const place of places) {
      placeMap.set(place.place_id, place.geometry?.location); // Lưu trực tiếp tọa độ
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return Array.from(placeMap.values())
    .filter((loc) => loc?.lat && loc?.lng)
    .map((loc) => ({ lat: loc.lat, lng: loc.lng }));
}

function generateGridPoints(center, maxRadiusKm, stepKm) {
  const points = [];
  const earthRadius = 6371;
  const dLat = (stepKm / earthRadius) * (180 / Math.PI);
  const dLng =
    (stepKm / (earthRadius * Math.cos((center.lat * Math.PI) / 180))) *
    (180 / Math.PI);

  for (let x = -maxRadiusKm; x <= maxRadiusKm; x += stepKm) {
    for (let y = -maxRadiusKm; y <= maxRadiusKm; y += stepKm) {
      const newLat = center.lat + x * dLat;
      const newLng = center.lng + y * dLng;
      const dist = haversine(center, { lat: newLat, lng: newLng }) / 1000;
      if (dist <= maxRadiusKm) {
        points.push({ lat: newLat, lng: newLng });
      }
    }
  }

  return points;
}

async function fetchNearbyPlaces({ lat, lng }, keyword, radius) {
  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: { key: API_KEY, location: `${lat},${lng}`, radius, keyword },
      }
    );
    return res.data.results || [];
  } catch (e) {
    console.error(`[Grid] Lỗi tại ${lat},${lng}:`, e.message);
    return [];
  }
}

export async function searchByAddress(address, keyword, radius = RADIUS) {
  try {
    const geoRes = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: { address, key: API_KEY },
      }
    );

    const location = geoRes.data.results[0]?.geometry.location;
    if (!location) throw new Error('Không tìm được tọa độ từ địa chỉ.');

    // Nếu không có keyword, trả về đúng 1 điểm là địa chỉ
    if (!keyword) {
      return [{ lat: location.lat, lng: location.lng }];
    }

    // Nếu có keyword, tiếp tục gọi Nearby Search
    const nearbyRes = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${location.lat},${location.lng}`,
          radius,
          keyword,
          key: API_KEY,
        },
      }
    );

    return (nearbyRes.data.results || [])
      .map((p) => p.geometry?.location)
      .filter((loc) => loc?.lat && loc?.lng)
      .map((loc) => ({ lat: loc.lat, lng: loc.lng }));
  } catch (e) {
    console.error(`[Address] Lỗi:`, e.message);
    return [];
  }
}

export async function searchByTextQuery(query) {
  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query,
          key: API_KEY,
        },
      }
    );

    return (res.data.results || [])
      .map((p) => p.geometry?.location)
      .filter((loc) => loc?.lat && loc?.lng)
      .map((loc) => ({ lat: loc.lat, lng: loc.lng }));
  } catch (e) {
    console.error(`[TextSearch] Lỗi:`, e.message);
    return [];
  }
}
