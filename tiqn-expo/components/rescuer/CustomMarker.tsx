import { View, Text, StyleSheet } from "react-native";

interface CustomMarkerProps {
  type: "current-rescuer" | "rescuer-available" | "rescuer-enroute" | "incident-high" | "incident-medium" | "incident-low";
  size?: number;
}

export function CustomMarker({ type, size = 40 }: CustomMarkerProps) {
  const getMarkerContent = () => {
    switch (type) {
      case "current-rescuer":
        return {
          icon: "🚑",
          bg: "#10b981",
          border: "#059669",
          shadow: true,
        };
      case "rescuer-available":
        return {
          icon: "🚑",
          bg: "#6ee7b7",
          border: "#34d399",
          shadow: false,
        };
      case "rescuer-enroute":
        return {
          icon: "🚑",
          bg: "#fbbf24",
          border: "#f59e0b",
          shadow: false,
        };
      case "incident-high":
        return {
          icon: "🚨",
          bg: "#ef4444",
          border: "#dc2626",
          shadow: true,
        };
      case "incident-medium":
        return {
          icon: "⚠️",
          bg: "#f59e0b",
          border: "#d97706",
          shadow: true,
        };
      case "incident-low":
        return {
          icon: "ℹ️",
          bg: "#3b82f6",
          border: "#2563eb",
          shadow: false,
        };
    }
  };

  const config = getMarkerContent();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: config.bg,
          borderColor: config.border,
          shadowOpacity: config.shadow ? 0.3 : 0,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: size * 0.5 }]}>
        {config.icon}
      </Text>
      {config.shadow && (
        <View
          style={[
            styles.pulse,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderColor: config.bg,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    textAlign: "center",
  },
  pulse: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    opacity: 0.3,
  },
});
