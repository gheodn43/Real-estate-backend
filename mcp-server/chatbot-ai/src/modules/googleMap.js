import axios from 'axios';
const API_KEY = 'AIzaSyBEKDomqoh74x6sz5zGYYS7GU2hY84dvFk';
const RADIUS = 2000; // metter

export async function searchByKeywordInArea(
  { lat, lng },
  keyword,
  radius = RADIUS
) {
  if (!keyword) return [];

  const results = [];
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

  return results
    .map((p) => p.geometry?.location)
    .filter((loc) => loc?.lat && loc?.lng)
    .map((loc) => ({ lat: loc.lat, lng: loc.lng }));
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
