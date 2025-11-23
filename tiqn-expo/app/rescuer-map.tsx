import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/api";
import { Id } from "convex/_generated/dataModel";
import { TopStatusBar } from "@/components/rescuer/TopStatusBar";
import { BottomCard } from "@/components/rescuer/BottomCard";
import { NavigationHUD } from "@/components/rescuer/NavigationHUD";
import { DriverCard } from "@/components/rescuer/DriverCard";
import { IncidentDetailModal } from "@/components/rescuer/IncidentDetailModal";
import { ArrivalModal } from "@/components/rescuer/ArrivalModal";
import { AgentConversationModal } from "@/components/rescuer/AgentConversationModal";
import { CustomMarker } from "@/components/rescuer/CustomMarker";
import {
  CURRENT_RESCUER_ID,
  RescuerStatus,
} from "@/data/mockData";
import { useLocation } from "@/hooks/useLocation";
import { useHeading } from "@/hooks/useHeading";
import { useAgentConversation, AgentDynamicVariables } from "@/hooks/useAgentConversation";
import { getDirections, DecodedPolyline } from "@/services/directionsService";
import { geocodeAddress } from "@/services/geocodingService";
import { searchPatientRecord } from "@/services/patientRecordService";
import { calculateDistance } from "@/utils/mapHelpers";

export default function MainMapScreen() {
  const mapRef = useRef<MapView>(null);

  const { location, error: locationError, isLoading: locationLoading, permissionGranted } = useLocation(true, 5000);

  const availableIncidents = useQuery(api.rescuers.getAvailableIncidents);
  const activeAssignment = useQuery(api.rescuers.getRescuerActiveAssignment, {
    rescuerId: CURRENT_RESCUER_ID as Id<"rescuers">,
  });
  const allRescuers = useQuery(api.rescuers.getAllRescuers);
  const currentRescuerData = useQuery(api.rescuers.getRescuerDetails, {
    rescuerId: CURRENT_RESCUER_ID as Id<"rescuers">,
  });

  const acceptIncident = useMutation(api.rescuers.acceptIncident);
  const rejectIncident = useMutation(api.rescuers.rejectIncident);
  const completeIncident = useMutation(api.rescuers.completeIncident);
  const updateIncidentCoordinates = useMutation(api.incidents.updateCoordinates);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [incidentsWithETA, setIncidentsWithETA] = useState<any[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [arrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<DecodedPolyline[]>([]);
  const [lastCameraUpdate, setLastCameraUpdate] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [patientRecordsMap, setPatientRecordsMap] = useState<Map<string, any>>(new Map());

  const agentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || '';
  const agent = useAgentConversation({
    agentId,
    onAgentSpeaking: setIsAgentSpeaking,
    onConversationEnd: () => {
      console.log('[Agent] Conversation ended');
    },
  });

  const isEnRoute = activeAssignment !== null && activeAssignment !== undefined;
  const rescuerStatus: RescuerStatus = isEnRoute ? "en_route" : "available";

  const { heading } = useHeading(isEnRoute);

  useEffect(() => {
    async function calculateETAs() {
      if (!availableIncidents || !location) return;

      const origin = {
        lat: location.latitude,
        lng: location.longitude,
      };

      const incidentsWithDistance = await Promise.all(
        availableIncidents.map(async (inc) => {
          let coordinates = inc.incident.coordinates;

          if (!coordinates && inc.incident.address) {
            console.log(`📍 Incident ${inc.incident._id} missing coordinates, attempting to geocode address: ${inc.incident.address}`);
            console.log(`   callSessionId: ${inc.incident.callSessionId}`);
            console.log(`   dispatcherId: ${inc.incident.dispatcherId}`);
            console.log(`   reference: ${inc.incident.reference || 'N/A'}`);

            const geocoded = await geocodeAddress(inc.incident.address, inc.incident.reference);
            console.log(`   Geocoding result:`, geocoded);

            if (geocoded) {
              coordinates = { lat: geocoded.lat, lng: geocoded.lng };

              try {
                const updatePayload = {
                  callSessionId: inc.incident.callSessionId,
                  coordinates: {
                    lat: geocoded.lat,
                    lng: geocoded.lng,
                  },
                };

                console.log(`   Updating incident coordinates:`, updatePayload);
                const result = await updateIncidentCoordinates(updatePayload);
                console.log(`✅ Updated incident ${inc.incident._id} with coordinates: (${geocoded.lat}, ${geocoded.lng})`);
                console.log(`   Update result:`, result);
              } catch (error) {
                console.error(`❌ Failed to update incident ${inc.incident._id} with coordinates:`, error);
                console.error(`   Error details:`, JSON.stringify(error, null, 2));
              }
            } else {
              console.warn(`   ⚠️ Geocoding failed for address: ${inc.incident.address}`);
            }
          }

          if (!coordinates) {
            return { ...inc, distanceKm: 999, etaMinutes: 999 };
          }

          const distance = calculateDistance(
            origin.lat,
            origin.lng,
            coordinates.lat,
            coordinates.lng
          );

          const directions = await getDirections(
            origin,
            coordinates
          );

          return {
            ...inc,
            distanceKm: distance,
            etaMinutes: directions?.durationMinutes || Math.ceil((distance / 40) * 60),
          };
        })
      );

      const sorted = incidentsWithDistance.sort((a, b) => a.etaMinutes - b.etaMinutes);
      setIncidentsWithETA(sorted);

      const patientLookups = sorted
        .filter(inc => {
          const firstName = inc.incident.firstName;
          const lastName = inc.incident.lastName;
          return (firstName || lastName) && !inc.incident.patientRecordId;
        })
        .map(async (inc) => {
          const firstName = inc.incident.firstName;
          const lastName = inc.incident.lastName;
          console.log(`🔍 Incident ${inc.incident._id} has patient name, searching known records: ${firstName} ${lastName}`);

          const patientRecord = await searchPatientRecord(firstName, lastName);

          if (patientRecord) {
            console.log(`✅ Found patient record for ${firstName} ${lastName}`);
            return { incidentId: inc.incident._id, record: patientRecord };
          }
          return null;
        });

      const results = await Promise.all(patientLookups);
      const recordsMap = new Map();
      results.forEach(result => {
        if (result) {
          recordsMap.set(result.incidentId, result.record);
        }
      });
      setPatientRecordsMap(recordsMap);
    }

    if (rescuerStatus === "available") {
      calculateETAs();
    }
  }, [availableIncidents, location, rescuerStatus, updateIncidentCoordinates]);

  useEffect(() => {
    async function fetchRoute() {
      if (!activeAssignment || !activeAssignment.incident) {
        setRouteCoordinates([]);
        return;
      }

      const incident = activeAssignment.incident;
      if (!incident.coordinates) return;

      const origin = location || currentRescuerData?.currentLocation;
      if (!origin) return;

      const result = await getDirections(
        { lat: origin.latitude || origin.lat, lng: origin.longitude || origin.lng },
        incident.coordinates
      );

      if (result) {
        setRouteCoordinates(result.coordinates);
      }
    }

    fetchRoute();
  }, [activeAssignment, location]);

  useEffect(() => {
    if (rescuerStatus === "en_route" && location && mapRef.current) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastCameraUpdate;

      if (timeSinceLastUpdate < 300) {
        return;
      }

      setLastCameraUpdate(now);

      const camera: any = {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        zoom: 16,
        pitch: 60,
      };

      if (heading !== null) {
        camera.heading = heading;
      }

      mapRef.current.animateCamera(camera, { duration: 300 });
    }
  }, [location, heading, rescuerStatus]);

  const displayedIncident = rescuerStatus === "available"
    ? incidentsWithETA[currentCardIndex]
    : activeAssignment;

  const handleNextCard = () => {
    if (currentCardIndex < incidentsWithETA.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleAccept = async () => {
    const incident = incidentsWithETA[currentCardIndex];
    if (!incident) return;

    try {
      await acceptIncident({
        incidentAssignmentId: incident.assignment._id,
        rescuerId: CURRENT_RESCUER_ID as Id<"rescuers">,
      });

      const dynamicVariables: AgentDynamicVariables = {
        incidentType: incident.incident.type,
        incidentPriority: incident.incident.priority,
        incidentStatus: incident.incident.status,
        incidentDescription: incident.incident.description,
        incidentAddress: incident.incident.address,
        incidentDistrict: incident.incident.district,
        incidentReference: incident.incident.reference,
        incidentLat: incident.incident.coordinates?.lat?.toString(),
        incidentLng: incident.incident.coordinates?.lng?.toString(),
        patientFirstName: incident.patient?.firstName,
        patientLastName: incident.patient?.lastName,
        patientAge: incident.patient?.age?.toString(),
        patientSex: incident.patient?.sex,
        consciousness: incident.patient?.consciousness,
        breathing: incident.patient?.breathing,
        respiratoryStatus: incident.patient?.respiratoryStatus,
        vitalSigns: incident.patient?.vitalSigns,
        symptomOnset: incident.patient?.symptomOnset,
        allergies: incident.patient?.allergies,
        currentMedications: incident.patient?.currentMedications,
        medicalHistory: incident.patient?.medicalHistory,
        requiredRescuers: incident.incident.requiredRescuers?.toString(),
        requiredResources: incident.incident.requiredResources,
      };

      console.log('[Agent] Starting conversation with variables:', dynamicVariables);
      await agent.startConversation(dynamicVariables);
      setAgentModalVisible(true);
    } catch (error) {
      console.error("Failed to accept incident:", error);
    }
  };

  const handleReject = async () => {
    const incident = incidentsWithETA[currentCardIndex];
    if (!incident) return;

    try {
      await rejectIncident({
        incidentAssignmentId: incident.assignment._id,
      });

      if (currentCardIndex >= incidentsWithETA.length - 1 && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    } catch (error) {
      console.error("Failed to reject incident:", error);
    }
  };

  const handleViewDetails = () => {
    if (activeAssignment) {
      setSelectedIncidentId(activeAssignment.assignment._id);
      setDetailModalVisible(true);
    }
  };

  const handleMarkArrived = () => {
    setArrivalModalVisible(true);
  };

  const handleConfirmArrival = async (note: string) => {
    if (!activeAssignment) return;

    try {
      if (agent.isConnected) {
        await agent.endConversation();
        setAgentModalVisible(false);
      }

      await completeIncident({
        incidentAssignmentId: activeAssignment.assignment._id,
      });

      setArrivalModalVisible(false);

      if (mapRef.current && location) {
        setTimeout(() => {
          mapRef.current?.animateCamera(
            {
              center: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              zoom: 13,
              pitch: 0,
              heading: 0,
            },
            { duration: 1000 }
          );
        }, 300);
      }
    } catch (error) {
      console.error("Failed to complete incident:", error);
    }
  };

  const handleCardPress = () => {
    if (displayedIncident) {
      setSelectedIncidentId(displayedIncident.assignment._id);
      setDetailModalVisible(true);
    }
  };

  const handleMarkerPress = (assignmentId: string) => {
    setSelectedIncidentId(assignmentId);
    setDetailModalVisible(true);
  };

  const handleSaveNote = (note: string) => {
  };

  const centerOnCurrentRescuer = () => {
    if (mapRef.current && (location || currentRescuerData?.currentLocation)) {
      const center = location || currentRescuerData!.currentLocation;
      const delta = rescuerStatus === "en_route" ? 0.01 : 0.05;
      mapRef.current.animateToRegion({
        latitude: center.latitude || center.lat,
        longitude: center.longitude || center.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }, 500);
    }
  };

  const getRealTimeDistance = (): number => {
    if (!activeAssignment || !location) return 0;

    const incident = activeAssignment.incident;
    if (!incident?.coordinates) return 0;

    return calculateDistance(
      location.latitude,
      location.longitude,
      incident.coordinates.lat,
      incident.coordinates.lng
    );
  };

  const getRealTimeETA = (): number => {
    const distanceKm = getRealTimeDistance();
    const avgSpeedKmh = 40;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60);
  };

  const selectedAssignment = selectedIncidentId
    ? (availableIncidents?.find((inc) => inc.assignment._id === selectedIncidentId) || activeAssignment)
    : null;

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const isDataLoading = !currentRescuerData || !allRescuers || availableIncidents === undefined;
  const hasLocationData = location || currentRescuerData?.currentLocation;
  const isInitialLoad = (!hasLocationData || isDataLoading) && !hasLoadedOnce;

  useEffect(() => {
    if (!isDataLoading && hasLocationData && permissionGranted) {
      setHasLoadedOnce(true);
    }
  }, [isDataLoading, hasLocationData, permissionGranted]);

  if (isInitialLoad) {
    const loadingMessage = locationLoading ? "Obteniendo tu ubicación..." : "Cargando datos...";
    console.log("[MainMapScreen] Showing loading screen:", loadingMessage);
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
        {locationError && <Text style={styles.errorSubtext}>{locationError}</Text>}
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Permiso de ubicación no otorgado</Text>
        <Text style={styles.errorSubtext}>
          Por favor activa los servicios de ubicación para usar esta aplicación
        </Text>
      </View>
    );
  }

  const initialRegion = location || currentRescuerData?.currentLocation || {
    latitude: -33.4489,
    longitude: -70.6693,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: initialRegion.latitude || initialRegion.lat,
          longitude: initialRegion.longitude || initialRegion.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => console.log("[MapView] ✅ Map is ready!")}
        onError={(error) => console.error("[MapView] ❌ Map error:", error)}
      >
        {rescuerStatus === "available"
          ? allRescuers?.map((rescuer) => {
              const isCurrent = rescuer._id === CURRENT_RESCUER_ID;
              const currentLoc = isCurrent && location
                ? { lat: location.latitude, lng: location.longitude }
                : currentRescuerData?.currentLocation;

              if (!currentLoc) return null;

              return (
                <Marker
                  key={rescuer._id}
                  coordinate={{
                    latitude: currentLoc.lat,
                    longitude: currentLoc.lng,
                  }}
                  title={rescuer.name}
                  description={rescuer.phone}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <CustomMarker
                    type={isCurrent ? "current-rescuer" : "rescuer-available"}
                    size={isCurrent ? 50 : 40}
                  />
                </Marker>
              );
            })
          : location && (
              <Marker
                key="current-rescuer"
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={currentRescuerData?.name || "Tú"}
                description="En ruta"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <CustomMarker type="current-rescuer" size={50} />
              </Marker>
            )
        }

        {rescuerStatus === "available"
          ? availableIncidents?.map((inc) => {
              const incident = inc.incident;
              if (!incident.coordinates) return null;

              const markerType =
                incident.priority === "high"
                  ? "incident-high"
                  : incident.priority === "medium"
                  ? "incident-medium"
                  : "incident-low";

              return (
                <Marker
                  key={inc.assignment._id}
                  coordinate={{
                    latitude: incident.coordinates.lat,
                    longitude: incident.coordinates.lng,
                  }}
                  title={incident.incidentType || "Emergencia"}
                  description={`${incident.priority.toUpperCase()} - ${incident.address}`}
                  onPress={() => handleMarkerPress(inc.assignment._id)}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <CustomMarker type={markerType} size={45} />
                </Marker>
              );
            })
          : displayedIncident?.incident && displayedIncident.incident.coordinates && (
              <Marker
                key={displayedIncident.assignment._id}
                coordinate={{
                  latitude: displayedIncident.incident.coordinates.lat,
                  longitude: displayedIncident.incident.coordinates.lng,
                }}
                title={displayedIncident.incident.incidentType || "Emergencia"}
                description={displayedIncident.incident.address}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <CustomMarker
                  type={
                    displayedIncident.incident.priority === "high"
                      ? "incident-high"
                      : displayedIncident.incident.priority === "medium"
                      ? "incident-medium"
                      : "incident-low"
                  }
                  size={50}
                />
              </Marker>
            )}

        {activeAssignment && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        )}
      </MapView>

      {rescuerStatus === "available" ? (
        <>
          <TopStatusBar status={rescuerStatus} />
          <Pressable style={styles.centerButton} onPress={centerOnCurrentRescuer}>
            <Text style={styles.centerButtonText}>⊙</Text>
          </Pressable>
          {incidentsWithETA.length > 0 ? (
            <BottomCard
              rescuerStatus={rescuerStatus}
              incident={displayedIncident}
              currentIndex={currentCardIndex}
              totalCards={incidentsWithETA.length}
              onAccept={handleAccept}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
              onMarkArrived={handleMarkArrived}
              onCardPress={handleCardPress}
              onSwipeLeft={handleNextCard}
              onSwipeRight={handlePrevCard}
              patientRecord={displayedIncident ? patientRecordsMap.get(displayedIncident.incident._id) : undefined}
            />
          ) : (
            <View style={styles.noIncidentsContainer}>
              <Text style={styles.noIncidentsText}>✓ No hay incidentes disponibles</Text>
              <Text style={styles.noIncidentsSubtext}>Esperando nuevas asignaciones...</Text>
            </View>
          )}
        </>
      ) : (
        displayedIncident && (
          <>
            <NavigationHUD
              distanceKm={getRealTimeDistance()}
              etaMinutes={getRealTimeETA()}
              destinationAddress={displayedIncident.incident.address}
            />
            <DriverCard
              onMarkArrived={handleMarkArrived}
              onViewDetails={handleViewDetails}
            />
            {agent.isConnected && (
              <Pressable
                style={[
                  styles.agentButton,
                  isAgentSpeaking && styles.agentButtonSpeaking,
                ]}
                onPress={() => setAgentModalVisible(true)}
              >
                <Text style={styles.agentButtonIcon}>🎙️</Text>
                <Text style={styles.agentButtonText}>
                  {isAgentSpeaking ? 'Hablando...' : 'Asistente'}
                </Text>
              </Pressable>
            )}
          </>
        )
      )}

      <IncidentDetailModal
        visible={detailModalVisible}
        incident={selectedAssignment?.incident}
        patient={selectedAssignment?.patient}
        currentRescuerId={CURRENT_RESCUER_ID}
        onClose={() => setDetailModalVisible(false)}
        onSaveNote={handleSaveNote}
        patientRecord={selectedAssignment ? patientRecordsMap.get(selectedAssignment.incident._id) : undefined}
      />

      <ArrivalModal
        visible={arrivalModalVisible}
        onConfirm={handleConfirmArrival}
        onCancel={() => setArrivalModalVisible(false)}
      />

      <AgentConversationModal
        visible={agentModalVisible}
        isConnected={agent.isConnected}
        isSpeaking={agent.isSpeaking}
        messages={agent.messages}
        error={agent.error}
        onClose={() => setAgentModalVisible(false)}
        onEndConversation={agent.endConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  centerButton: {
    position: "absolute",
    bottom: 240,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonText: {
    fontSize: 24,
    color: "#374151",
  },
  noIncidentsContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noIncidentsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 8,
  },
  noIncidentsSubtext: {
    fontSize: 14,
    color: "#6b7280",
  },
  agentButton: {
    position: "absolute",
    top: 120,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  agentButtonSpeaking: {
    backgroundColor: "#ef4444",
  },
  agentButtonIcon: {
    fontSize: 20,
  },
  agentButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
