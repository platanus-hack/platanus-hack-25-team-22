import { useState, useEffect } from "react";
import * as Location from "expo-location";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  location: LocationCoords | null;
  error: string | null;
  isLoading: boolean;
  permissionGranted: boolean;
}

export function useLocation(
  enableHighAccuracy: boolean = false,
  updateInterval: number = 5000
): UseLocationResult {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      try {
        console.log("[useLocation] Requesting location permissions...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[useLocation] Permission status:", status);

        if (status !== "granted") {
          console.log("[useLocation] Permission denied");
          setError("Location permission not granted");
          setPermissionGranted(false);
          setIsLoading(false);
          return;
        }

        setPermissionGranted(true);
        console.log("[useLocation] Getting current position...");

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: enableHighAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
        });

        console.log("[useLocation] Got position:", currentPosition.coords);
        setLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });
        setIsLoading(false);
        console.log("[useLocation] Location set, loading complete");

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: enableHighAccuracy
              ? Location.Accuracy.High
              : Location.Accuracy.Balanced,
            timeInterval: updateInterval,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.log("[useLocation] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    }

    console.log("[useLocation] Starting location tracking...");
    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [enableHighAccuracy, updateInterval]);

  return { location, error, isLoading, permissionGranted };
}
