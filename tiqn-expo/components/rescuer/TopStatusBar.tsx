import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RescuerStatus } from "@/data/mockData";

interface TopStatusBarProps {
  status: RescuerStatus;
}

export function TopStatusBar({ status }: TopStatusBarProps) {
  const insets = useSafeAreaInsets();

  const isAvailable = status === "available";

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isAvailable ? "#10b981" : "#f59e0b" },
          ]}
        />
        <Text style={styles.statusText}>
          {isAvailable ? "Disponible" : "En ruta"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
});
