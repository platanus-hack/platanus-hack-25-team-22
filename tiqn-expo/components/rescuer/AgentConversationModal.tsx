import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

interface AgentConversationModalProps {
  visible: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  messages: Array<{ role: string; content: string }>;
  error: string | null;
  onClose: () => void;
  onEndConversation: () => void;
}

export function AgentConversationModal({
  visible,
  isConnected,
  isSpeaking,
  messages,
  error,
  onClose,
  onEndConversation,
}: AgentConversationModalProps) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isSpeaking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isSpeaking, pulseAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleEndConversation = () => {
    onEndConversation();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Asistente de Rescate</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.statusContainer}>
          {!isConnected && !error && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.statusText}>Conectando...</Text>
            </View>
          )}

          {isConnected && (
            <View style={styles.statusRow}>
              <Animated.View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: isSpeaking ? '#ef4444' : '#10b981',
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {isSpeaking ? 'Agente hablando...' : 'Escuchando...'}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && isConnected && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>🎙️ Conversación Activa</Text>
              <Text style={styles.emptyStateText}>
                El asistente está listo. Habla libremente sobre el incidente.
              </Text>
            </View>
          )}

          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBox,
                msg.role === 'user' ? styles.userMessage : styles.agentMessage,
              ]}
            >
              <Text style={styles.messageRole}>
                {msg.role === 'user' ? '👤 Tú' : '🤖 Asistente'}
              </Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 El asistente te acompañará durante el desplazamiento al incidente
            </Text>
          </View>

          <Pressable
            style={[styles.endButton, !isConnected && styles.endButtonDisabled]}
            onPress={handleEndConversation}
            disabled={!isConnected}
          >
            <Text style={styles.endButtonText}>
              {isConnected ? '⏹️ Finalizar Conversación' : 'Cerrar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#dbeafe',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  agentMessage: {
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
  },
  endButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
