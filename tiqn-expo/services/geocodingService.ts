export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(
  address: string,
  reference?: string
): Promise<GeocodingResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    console.warn(
      "⚠️ Google Maps API key not configured. Cannot geocode address."
    );
    return null;
  }

  try {
    const addressParts = [address];
    if (reference) {
      addressParts.push(reference);
    }
    addressParts.push("Santiago, Chile");

    const fullAddress = addressParts.join(", ");
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    console.log(`🔍 Geocoding address: "${address}"${reference ? ` (ref: ${reference})` : ""}`);
    console.log(`   URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);

    const response = await fetch(url);
    console.log(`   Response status: ${response.status}`);

    const data = await response.json();
    console.log("📍 Geocoding API response status:", data.status);
    console.log("   Full response:", JSON.stringify(data, null, 2));

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error("❌ Geocoding API error:", data.status);
      if (data.error_message) {
        console.error("Error message:", data.error_message);
      }
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    console.log(
      `✅ Address geocoded: ${result.formatted_address} -> (${location.lat}, ${location.lng})`
    );

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error("❌ Error geocoding address:", error);
    console.error("   Error stack:", error);
    return null;
  }
}
