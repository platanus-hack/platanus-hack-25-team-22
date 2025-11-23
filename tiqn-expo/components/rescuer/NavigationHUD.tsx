import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NavigationHUDProps {
  distanceKm: number;
  etaMinutes: number;
  destinationAddress: string;
}

export function NavigationHUD({
  distanceKm,
  etaMinutes,
  destinationAddress,
}: NavigationHUDProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.etaContainer}>
        <Text style={styles.etaValue}>{etaMinutes}</Text>
        <Text style={styles.etaLabel}>min</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <View style={styles.distanceRow}>
          <Text style={styles.distanceText}>
            {distanceKm.toFixed(1)} km
          </Text>
        </View>
        <Text style={styles.addressText} numberOfLines={1}>
          {destinationAddress}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  etaContainer: {
    alignItems: "center",
    paddingRight: 16,
  },
  etaValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#10b981",
    lineHeight: 36,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: -2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addressText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});
