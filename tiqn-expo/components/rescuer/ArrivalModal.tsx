import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

interface ArrivalModalProps {
  visible: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function ArrivalModal({
  visible,
  onConfirm,
  onCancel,
}: ArrivalModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note);
    setNote("");
  };

  const handleCancel = () => {
    onCancel();
    setNote("");
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { marginBottom: insets.bottom + 20, paddingBottom: 24 },
          ]}
        >
          <Text style={styles.title}>Confirmar Llegada</Text>
          <Text style={styles.description}>
            Confirma que has llegado al lugar del incidente y agrega notas
            relevantes (opcional).
          </Text>

          <TextInput
            style={styles.noteInput}
            placeholder="Notas de llegada (opcional)..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Guardar y Finalizar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    minHeight: 100,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  confirmButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
