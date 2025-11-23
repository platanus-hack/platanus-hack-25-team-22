export interface DirectionsResult {
  routes: RouteInfo[];
  status: string;
}

export interface RouteInfo {
  overview_polyline: {
    points: string;
  };
  legs: RouteLeg[];
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

export interface RouteLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_address: string;
  end_location: {
    lat: number;
    lng: number;
  };
  start_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  steps: RouteStep[];
}

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  polyline: {
    points: string;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

export interface DecodedPolyline {
  latitude: number;
  longitude: number;
}

function decodePolyline(encoded: string): DecodedPolyline[] {
  const poly: DecodedPolyline[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  coordinates: DecodedPolyline[];
  distance: number;
  duration: number;
} | null> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    console.warn(
      "⚠️ Google Maps API key not configured. Using straight line instead."
    );
    console.warn("Add your API key to .env.local as EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
    return {
      coordinates: [
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: destination.lat, longitude: destination.lng },
      ],
      distance: 0,
      duration: 0,
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;

    console.log("🗺️ Fetching directions from Google...");
    const response = await fetch(url);
    const data: DirectionsResult = await response.json();

    console.log("📍 Directions API response status:", data.status);

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("❌ Directions API error:", data.status);
      if ((data as any).error_message) {
        console.error("Error message:", (data as any).error_message);
      }
      return {
        coordinates: [
          { latitude: origin.lat, longitude: origin.lng },
          { latitude: destination.lat, longitude: destination.lng },
        ],
        distance: 0,
        duration: 0,
      };
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const coordinates = decodePolyline(route.overview_polyline.points);

    console.log(`✅ Route decoded: ${coordinates.length} points, ${(leg.distance.value / 1000).toFixed(1)}km, ${Math.ceil(leg.duration.value / 60)}min`);

    return {
      coordinates,
      distance: leg.distance.value / 1000,
      duration: Math.ceil(leg.duration.value / 60),
    };
  } catch (error) {
    console.error("❌ Error fetching directions:", error);
    return {
      coordinates: [
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: destination.lat, longitude: destination.lng },
      ],
      distance: 0,
      duration: 0,
    };
  }
}
