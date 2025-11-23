import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

export interface AgentDynamicVariables {
  incidentType?: string;
  incidentPriority?: string;
  incidentStatus?: string;
  incidentDescription?: string;
  incidentAddress?: string;
  incidentDistrict?: string;
  incidentReference?: string;
  incidentLat?: string;
  incidentLng?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientAge?: string;
  patientSex?: string;
  consciousness?: string;
  breathing?: string;
  respiratoryStatus?: string;
  vitalSigns?: string;
  symptomOnset?: string;
  allergies?: string;
  currentMedications?: string;
  medicalHistory?: string;
  requiredRescuers?: string;
  requiredResources?: string;
}

interface UseAgentConversationOptions {
  agentId: string;
  onAgentSpeaking?: (isSpeaking: boolean) => void;
  onConversationEnd?: () => void;
}

export function useAgentConversation({
  agentId,
  onAgentSpeaking,
  onConversationEnd,
}: UseAgentConversationOptions) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Agent] Connected to conversation');
      setIsConnected(true);
      setError(null);
      conversationIdRef.current = conversation.getId();
    },
    onDisconnect: () => {
      console.log('[Agent] Disconnected from conversation');
      setIsConnected(false);
      conversationIdRef.current = null;
      onConversationEnd?.();
    },
    onMessage: (message) => {
      console.log('[Agent] Message received:', message);
      setMessages((prev) => [...prev, message]);
    },
    onError: (err) => {
      console.error('[Agent] Conversation error:', err);
      setError(err.message || 'Unknown error occurred');
    },
    onModeChange: (mode) => {
      console.log('[Agent] Mode changed:', mode);
      const speaking = mode.mode === 'speaking';
      onAgentSpeaking?.(speaking);
    },
  });

  const requestMicrophonePermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permiso de Micrófono',
            message: 'La aplicación necesita acceso al micrófono para comunicarte con el asistente de emergencia.',
            buttonNeutral: 'Preguntar Después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[Agent] Permission error:', err);
        return false;
      }
    }
    return true;
  }, []);

  const startConversation = useCallback(
    async (dynamicVariables: AgentDynamicVariables) => {
      try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          setError('Permiso de micrófono denegado');
          return;
        }

        const cleanVariables: Record<string, string> = {};
        Object.entries(dynamicVariables).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanVariables[key] = String(value);
          }
        });

        console.log('[Agent] Starting conversation with variables:', cleanVariables);

        await conversation.startSession({
          agentId,
          dynamicVariables: cleanVariables,
        });

        setMessages([]);
      } catch (err: any) {
        console.error('[Agent] Failed to start conversation:', err);
        setError(err.message || 'Failed to start conversation');
      }
    },
    [agentId, conversation, requestMicrophonePermission]
  );

  const endConversation = useCallback(async () => {
    try {
      console.log('[Agent] Ending conversation');
      await conversation.endSession();
      setMessages([]);
    } catch (err: any) {
      console.error('[Agent] Failed to end conversation:', err);
      setError(err.message || 'Failed to end conversation');
    }
  }, [conversation]);

  const sendMessage = useCallback(
    async (message: string) => {
      try {
        await conversation.sendUserMessage(message);
      } catch (err: any) {
        console.error('[Agent] Failed to send message:', err);
        setError(err.message || 'Failed to send message');
      }
    },
    [conversation]
  );

  const sendContextUpdate = useCallback(
    async (context: string) => {
      try {
        await conversation.sendContextualUpdate(context);
      } catch (err: any) {
        console.error('[Agent] Failed to send context update:', err);
      }
    },
    [conversation]
  );

  const toggleMute = useCallback(
    (muted: boolean) => {
      conversation.setMicMuted(muted);
    },
    [conversation]
  );

  return {
    conversation,
    isConnected,
    isSpeaking: conversation.isSpeaking,
    messages,
    error,
    conversationId: conversationIdRef.current,
    startConversation,
    endConversation,
    sendMessage,
    sendContextUpdate,
    toggleMute,
  };
}
