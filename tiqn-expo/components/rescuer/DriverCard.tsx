import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DriverCardProps {
  onMarkArrived: () => void;
  onViewDetails: () => void;
}

export function DriverCard({ onMarkArrived, onViewDetails }: DriverCardProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 16, marginBottom: 0 },
      ]}
    >
      <View style={styles.card}>
        <Pressable style={styles.arrivedButton} onPress={onMarkArrived}>
          <Text style={styles.arrivedButtonText}>He Llegado</Text>
        </Pressable>

        <Pressable style={styles.detailsButton} onPress={onViewDetails}>
          <Text style={styles.detailsButtonText}>📋 Detalles</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    gap: 12,
  },
  arrivedButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  arrivedButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  detailsButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
