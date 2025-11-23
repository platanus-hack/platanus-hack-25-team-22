import { useState, useEffect } from "react";
import { Magnetometer } from "expo-sensors";

export interface UseHeadingResult {
  heading: number | null;
  accuracy: number | null;
}

export function useHeading(enabled: boolean = true): UseHeadingResult {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHeading(null);
      setAccuracy(null);
      return;
    }

    let subscription: any;
    let smoothedHeading: number | null = null;
    const smoothingFactor = 0.15;

    const startTracking = async () => {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
          console.warn("Magnetometer not available on this device");
          return;
        }

        Magnetometer.setUpdateInterval(200);

        subscription = Magnetometer.addListener((data) => {
          const { x, y } = data;

          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360;

          if (smoothedHeading === null) {
            smoothedHeading = angle;
          } else {
            let diff = angle - smoothedHeading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            smoothedHeading = smoothedHeading + diff * smoothingFactor;
            smoothedHeading = (smoothedHeading + 360) % 360;
          }

          const roundedHeading = Math.round(smoothedHeading);
          setHeading(roundedHeading);
          setAccuracy(1);
        });
      } catch (error) {
        console.error("Error starting magnetometer:", error);
      }
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled]);

  return { heading, accuracy };
}
