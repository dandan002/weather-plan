async function geocodeAddress(query) {
  // 1. Try Census Bureau
  try {
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;
    const res = await fetch(censusUrl);
    if (res.ok) {
      const data = await res.json();
      const matches = data?.result?.addressMatches;
      if (matches && matches.length > 0) {
        const m = matches[0];
        return {
          latitude: m.coordinates.y,
          longitude: m.coordinates.x,
          matchedAddress: m.matchedAddress
        };
      }
    }
  } catch (err) {
    console.warn('Census geocoder failed, falling back to Nominatim:', err.message);
  }

  // 2. Fallback: Nominatim
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res2 = await fetch(nominatimUrl, {
    headers: { 'User-Agent': 'WeatherEventPlanner/1.0' }
  });
  const data2 = await res2.json();
  if (data2 && data2.length > 0) {
    return {
      latitude: parseFloat(data2[0].lat),
      longitude: parseFloat(data2[0].lon),
      matchedAddress: data2[0].display_name
    };
  }

  return null;
}

module.exports = { geocodeAddress };
