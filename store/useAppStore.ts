import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'info';
  content: string;
  timestamp: number;
  videoId?: string | null;
}

export interface VideoGeneration {
  id: string | null;
  status: 'idle' | 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  videoUrl: string | null;
  error: string | null;
}

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  baseImageUrl?: string | null;
}

export interface SavedVideo {
  id: string;
  videoId: string;
  conversationId: string;
  prompt: string;
  createdAt: number;
  model: string;
}

export interface VideoConfig {
  size: string;
  seconds: string;
}

interface AppState {
  // API Key
  apiKey: string | null;
  setApiKey: (key: string | null) => void;

  // Model Selection
  selectedModel: 'sora-2' | 'sora-2-pro';
  setSelectedModel: (model: 'sora-2' | 'sora-2-pro') => void;

  // Video Configuration
  videoConfig: VideoConfig;
  setVideoConfig: (config: Partial<VideoConfig>) => void;

  // Base Image
  baseImage: { file?: File; previewUrl: string; cropX?: number; cropY?: number } | null;
  setBaseImage: (image: { file?: File; previewUrl: string; cropX?: number; cropY?: number } | null) => void;
  updateBaseImageCrop: (cropX: number, cropY: number) => void;

  // Mode
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showLibrary: boolean;
  setShowLibrary: (show: boolean) => void;
  showVideoHistory: boolean;
  setShowVideoHistory: (show: boolean) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  readyToGenerate: boolean;
  setReadyToGenerate: (ready: boolean) => void;

  // Video Generation
  videoGeneration: VideoGeneration;
  updateVideoGeneration: (updates: Partial<VideoGeneration>) => void;
  resetVideoGeneration: () => void;

  // Conversation History
  currentConversationId: string | null;
  savedConversations: SavedConversation[];
  savedVideos: SavedVideo[];
  saveCurrentConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  saveVideo: (videoId: string, prompt: string) => void;
  newConversation: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // API Key
  apiKey: null,
  setApiKey: (key) => {
    if (key) {
      localStorage.setItem('openai_api_key', key);
    } else {
      localStorage.removeItem('openai_api_key');
    }
    set({ apiKey: key });
  },

  // Model Selection
  selectedModel: 'sora-2',
  setSelectedModel: (model) => {
    localStorage.setItem('selected_model', model);
    set({ selectedModel: model });
  },

  // Video Configuration
  videoConfig: {
    size: '1280x720',
    seconds: '8',
  },
  setVideoConfig: (config) => {
    const newConfig = { ...get().videoConfig, ...config };
    localStorage.setItem('video_config', JSON.stringify(newConfig));
    set({ videoConfig: newConfig });
  },

  // Base Image
  baseImage: null,
  setBaseImage: (image) => set({ baseImage: image }),
  updateBaseImageCrop: (cropX, cropY) =>
    set((state) => ({
      baseImage: state.baseImage ? { ...state.baseImage, cropX, cropY } : null,
    })),

  // Mode
  showHistory: false,
  setShowHistory: (show) => set({ showHistory: show }),
  showLibrary: false,
  setShowLibrary: (show) => set({ showLibrary: show }),
  showVideoHistory: false,
  setShowVideoHistory: (show) => set({ showVideoHistory: show }),

  // Chat
  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m here to help you create amazing videos with Sora 2. Tell me what kind of video you\'d like to make and I\'ll help you bring it to life!',
      timestamp: Date.now(),
    },
  ],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          id: `msg-${Date.now()}`,
          timestamp: Date.now(),
        },
      ],
    })),
  readyToGenerate: false,
  setReadyToGenerate: (ready) => set({ readyToGenerate: ready }),

  // Video Generation
  videoGeneration: {
    id: null,
    status: 'idle',
    progress: 0,
    videoUrl: null,
    error: null,
  },
  updateVideoGeneration: (updates) =>
    set((state) => ({
      videoGeneration: { ...state.videoGeneration, ...updates },
    })),
  resetVideoGeneration: () =>
    set({
      videoGeneration: {
        id: null,
        status: 'idle',
        progress: 0,
        videoUrl: null,
        error: null,
      },
    }),

  // Conversation History
  currentConversationId: null,
  savedConversations: [],
  savedVideos: [],

  saveCurrentConversation: () => {
    const state = get();
    const conversationId = state.currentConversationId || `conv-${Date.now()}`;

    // Create title from first user message or default
    const firstUserMsg = state.chatMessages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
      : 'New Conversation';

    const conversation: SavedConversation = {
      id: conversationId,
      title,
      messages: state.chatMessages,
      createdAt: state.currentConversationId ?
        state.savedConversations.find(c => c.id === conversationId)?.createdAt || Date.now() :
        Date.now(),
      updatedAt: Date.now(),
      baseImageUrl: state.baseImage?.previewUrl || null,
    };

    const updatedConversations = state.savedConversations.filter(c => c.id !== conversationId);
    updatedConversations.unshift(conversation);

    localStorage.setItem('saved_conversations', JSON.stringify(updatedConversations));

    set({
      currentConversationId: conversationId,
      savedConversations: updatedConversations,
    });
  },

  loadConversation: (id) => {
    const state = get();
    const conversation = state.savedConversations.find(c => c.id === id);
    if (conversation) {
      set({
        chatMessages: conversation.messages,
        currentConversationId: id,
        showHistory: false,
        baseImage: conversation.baseImageUrl ? { previewUrl: conversation.baseImageUrl } : null,
      });
    }
  },

  deleteConversation: (id) => {
    const state = get();
    const updatedConversations = state.savedConversations.filter(c => c.id !== id);
    localStorage.setItem('saved_conversations', JSON.stringify(updatedConversations));

    // Delete associated videos
    const updatedVideos = state.savedVideos.filter(v => v.conversationId !== id);
    localStorage.setItem('saved_videos', JSON.stringify(updatedVideos));

    set({
      savedConversations: updatedConversations,
      savedVideos: updatedVideos,
    });
  },

  saveVideo: (videoId, prompt) => {
    const state = get();
    const video: SavedVideo = {
      id: `vid-${Date.now()}`,
      videoId,
      conversationId: state.currentConversationId || `conv-${Date.now()}`,
      prompt,
      createdAt: Date.now(),
      model: state.selectedModel,
    };

    const updatedVideos = [video, ...state.savedVideos];
    localStorage.setItem('saved_videos', JSON.stringify(updatedVideos));

    set({ savedVideos: updatedVideos });
  },

  newConversation: () => {
    // Save current conversation if it has messages
    const state = get();
    if (state.chatMessages.length > 1) {
      state.saveCurrentConversation();
    }

    set({
      chatMessages: [{
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m here to help you create amazing videos with Sora 2. Tell me what kind of video you\'d like to make and I\'ll help you bring it to life!',
        timestamp: Date.now(),
      }],
      currentConversationId: null,
      readyToGenerate: false,
      baseImage: null,
    });
  },
}));

// Initialize from localStorage on client side
if (typeof window !== 'undefined') {
  const storedKey = localStorage.getItem('openai_api_key');
  if (storedKey) {
    useAppStore.setState({ apiKey: storedKey });
  }

  const storedModel = localStorage.getItem('selected_model') as 'sora-2' | 'sora-2-pro';
  if (storedModel) {
    useAppStore.setState({ selectedModel: storedModel });
  }

  const storedConfig = localStorage.getItem('video_config');
  if (storedConfig) {
    try {
      useAppStore.setState({ videoConfig: JSON.parse(storedConfig) });
    } catch (e) {
      console.error('Failed to parse video config');
    }
  }

  const storedConversations = localStorage.getItem('saved_conversations');
  if (storedConversations) {
    try {
      useAppStore.setState({ savedConversations: JSON.parse(storedConversations) });
    } catch (e) {
      console.error('Failed to parse saved conversations');
    }
  }

  const storedVideos = localStorage.getItem('saved_videos');
  if (storedVideos) {
    try {
      useAppStore.setState({ savedVideos: JSON.parse(storedVideos) });
    } catch (e) {
      console.error('Failed to parse saved videos');
    }
  }
}
