import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

interface IncidentDetailModalProps {
  visible: boolean;
  incident: any;
  patient: any;
  currentRescuerId: string;
  onClose: () => void;
  onSaveNote: (note: string) => void;
  patientRecord?: any;
}

export function IncidentDetailModal({
  visible,
  incident,
  patient,
  currentRescuerId,
  onClose,
  onSaveNote,
  patientRecord,
}: IncidentDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");

  if (!incident) {
    return null;
  }

  const handleSave = () => {
    onSaveNote(note);
    onClose();
  };

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalles del Incidente</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Incidente</Text>
            {incident.incidentNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>Número:</Text>
                <Text style={styles.value}>{incident.incidentNumber}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Tipo:</Text>
              <Text style={styles.value}>{incident.incidentType || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Prioridad:</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(incident.priority) },
                ]}
              >
                <Text style={styles.priorityText}>
                  {(incident.priority || 'N/A').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {incident.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{incident.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <Text style={styles.value}>{incident.address}</Text>
            {incident.coordinates && (
              <Text style={styles.coordinates}>
                {incident.coordinates.lat.toFixed(6)},{" "}
                {incident.coordinates.lng.toFixed(6)}
              </Text>
            )}
          </View>

          {patient && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Paciente</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>
                  {patient.firstName} {patient.lastName}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Edad:</Text>
                <Text style={styles.value}>{patient.age} años</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sexo:</Text>
                <Text style={styles.value}>{patient.sex}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>RUT:</Text>
                <Text style={styles.value}>{patient.rut}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Teléfono:</Text>
                <Text style={styles.value}>{patient.phone}</Text>
              </View>
              {patient.allergies.length > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Alergias:</Text>
                  <Text style={styles.value}>
                    {patient.allergies.join(", ")}
                  </Text>
                </View>
              )}
              {patient.medications.length > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Medicamentos:</Text>
                  <Text style={styles.value}>
                    {patient.medications.join(", ")}
                  </Text>
                </View>
              )}
              {patient.medicalHistory.length > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Historial médico:</Text>
                  <Text style={styles.value}>
                    {patient.medicalHistory.join(", ")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {patientRecord && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registro de Paciente Conocido</Text>
              {patientRecord.profilePicture && (
                <View style={styles.recordImageContainer}>
                  <Image
                    source={{ uri: patientRecord.profilePicture }}
                    style={styles.recordImage}
                  />
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>
                  {patientRecord.firstName} {patientRecord.lastName}
                </Text>
              </View>
              {patientRecord.bloodType && (
                <View style={styles.row}>
                  <Text style={styles.label}>Tipo de Sangre:</Text>
                  <Text style={styles.value}>{patientRecord.bloodType}</Text>
                </View>
              )}
              {patientRecord.visitNotes && (
                <View style={styles.visitNotesContainer}>
                  <Text style={styles.label}>Notas de Visitas Previas:</Text>
                  <Text style={styles.visitNotesText}>{patientRecord.visitNotes}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas del Rescatista</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Agregar notas sobre este incidente..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Nota</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    width: 120,
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
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
  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  coordinates: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  recordImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  recordImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#3b82f6",
  },
  visitNotesContainer: {
    marginTop: 8,
  },
  visitNotesText: {
    fontSize: 14,
    color: "#374151",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  existingNote: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  existingNoteLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});
