
export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isGenerating?: boolean;
}

export interface ChatState {
  messages: Message[];
  isThinking: boolean;
  theme: 'light' | 'dark';
}
