import { createContext, useContext } from 'react';
import type { AiConversation } from '@/utils/aiConversation';
export const AiConversationContext = createContext<AiConversation | null>(null);
export function useAiConversation() {
  const conversation = useContext(AiConversationContext);
  if (!conversation) throw new Error('AiConversationProvider is required');
  return conversation;
}
