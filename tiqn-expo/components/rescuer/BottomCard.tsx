import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { RescuerStatus } from "@/data/mockData";

type IncidentAssignment = {
  assignment: any;
  incident: any;
  patient: any;
  distanceKm?: number;
  etaMinutes?: number;
};

interface BottomCardProps {
  rescuerStatus: RescuerStatus;
  incident: IncidentAssignment | null;
  currentIndex: number;
  totalCards: number;
  onAccept: () => void;
  onReject: () => void;
  onViewDetails: () => void;
  onMarkArrived: () => void;
  onCardPress: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  patientRecord?: any;
}

export function BottomCard({
  rescuerStatus,
  incident,
  currentIndex,
  totalCards,
  onAccept,
  onReject,
  onViewDetails,
  onMarkArrived,
  onCardPress,
  onSwipeLeft,
  onSwipeRight,
  patientRecord,
}: BottomCardProps) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const swipeThreshold = 100;

      if (event.translationX > swipeThreshold && currentIndex > 0) {
        runOnJS(triggerHaptic)();
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -swipeThreshold && currentIndex < totalCards - 1) {
        runOnJS(triggerHaptic)();
        runOnJS(onSwipeLeft)();
      }

      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!incident || !incident.incident) {
    return null;
  }

  const isAvailable = rescuerStatus === "available";
  const incidentData = incident.incident;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 20, marginBottom: 0 },
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable style={styles.card} onPress={onCardPress}>
            {isAvailable && totalCards > 1 && (
              <View style={styles.cardIndicator}>
                <Text style={styles.cardIndicatorText}>
                  {currentIndex + 1} / {totalCards}
                </Text>
              </View>
            )}

            <View style={styles.header}>
              <Text style={styles.incidentType}>
                {incidentData.incidentType || "Emergencia"}
              </Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(incidentData.priority) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {incidentData.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.address} numberOfLines={1}>
              {incidentData.address}
            </Text>

            {patientRecord?.profilePicture && (
              <View style={styles.patientImageContainer}>
                <Image
                  source={{ uri: patientRecord.profilePicture }}
                  style={styles.patientImage}
                />
                <Text style={styles.patientImageLabel}>
                  Paciente Conocido: {patientRecord.firstName} {patientRecord.lastName}
                </Text>
              </View>
            )}

            <View style={styles.info}>
              {incident.etaMinutes !== undefined && (
                <>
                  <Text style={styles.infoText}>
                    🚗 {incident.etaMinutes} min
                  </Text>
                  <Text style={styles.infoSeparator}>•</Text>
                  <Text style={styles.infoText}>
                    📍 {incident.distanceKm?.toFixed(1)} km
                  </Text>
                  <Text style={styles.infoSeparator}>•</Text>
                </>
              )}
              <Text style={styles.infoText}>
                {incidentData.incidentNumber}
              </Text>
            </View>

        <View style={styles.actions}>
          {isAvailable ? (
            <>
              <Pressable
                style={[styles.button, styles.rejectButton]}
                onPress={onReject}
              >
                <Text style={styles.rejectButtonText}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.acceptButton]}
                onPress={onAccept}
              >
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={onViewDetails}
              >
                <Text style={styles.secondaryButtonText}>Ver Detalles</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={onMarkArrived}
              >
                <Text style={styles.primaryButtonText}>Marcar como Llegado</Text>
              </Pressable>
            </>
          )}
        </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
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
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 12,
  },
  patientImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  patientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  patientImageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1,
  },
  cardIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardIndicatorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  infoSeparator: {
    fontSize: 14,
    color: "#d1d5db",
    marginHorizontal: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  rejectButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
