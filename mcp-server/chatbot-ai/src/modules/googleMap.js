const API_KEY = 'AIzaSyBEKDomqoh74x6sz5zGYYS7GU2hY84dvFk';
import axios from 'axios';
const RADIUS = 20000; // metter

export async function searchByKeywordInArea(
  { lat, lng },
  keyword,
  radius = RADIUS
) {
  if (!keyword) return [];

  let results = [];
  let pageToken = null;
  let tries = 0;

  try {
    do {
      const params = {
        key: API_KEY,
        location: `${lat},${lng}`,
        radius,
        keyword,
      };
      if (pageToken) params.pagetoken = pageToken;

      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params,
        }
      );

      const places = res.data.results || [];
      results.push(...places);

      pageToken = res.data.next_page_token || null;
      if (pageToken) {
        tries++;
        await new Promise((r) => setTimeout(r, 2000));
      }
    } while (pageToken && tries < 3);
  } catch (e) {
    console.error(`[SimpleArea] Lỗi:`, e.message);
  }

  results = results
    .map((p) => p.geometry?.location)
    .filter((loc) => loc?.lat && loc?.lng)
    .map((loc) => ({ lat: loc.lat, lng: loc.lng }));
  return filterNonOverlapping(results, 5);
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
    let nearbyRes = await axios.get(
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
    return [];
  }
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // bán kính Trái Đất (km)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function filterNonOverlapping(locations, radiusKm = 5) {
  const result = [];

  for (let i = 0; i < locations.length; i++) {
    let valid = true;

    for (let j = 0; j < result.length; j++) {
      const d = haversineDistance(
        locations[i].lat,
        locations[i].lng,
        result[j].lat,
        result[j].lng
      );

      // Nếu khoảng cách <= 2 * bán kính thì 2 vòng tròn overlap
      if (d <= radiusKm * 2) {
        valid = false;
        break;
      }
    }

    if (valid) {
      result.push(locations[i]);
    }
  }

  return result;
}
