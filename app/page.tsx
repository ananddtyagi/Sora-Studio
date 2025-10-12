'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { VideoPlayer } from '@/components/content/VideoPlayer';
import { ApiKeyModal } from '@/components/ui/ApiKeyModal';
import { Button } from '@/components/ui/Button';
import { ConfigPanel } from '@/components/ui/ConfigPanel';
import { LibraryPanel } from '@/components/ui/LibraryPanel';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { useVideoGeneration } from '@/lib/useVideoGeneration';
import { useAppStore } from '@/store/useAppStore';
import { Check, DownloadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Video History Content Component
function VideoHistoryContent() {
  const { apiKey, savedVideos, loadConversation, referenceVideoForRemix } = useAppStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justDownloaded, setJustDownloaded] = useState<Record<string, boolean>>({});
  const downloadTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (apiKey) {
      fetchVideos();
    }
  }, [apiKey]);

  const fetchVideos = async () => {
    if (!apiKey) {
      setError('No API key found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/videos/list', {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json().then(data => {
        const currentTime = Math.floor(Date.now() / 1000);
        const videosWithExpiry = (data.videos || []).map((video: any) => ({
          ...video,
          expired: video.expires_at ? video.expires_at < currentTime : false,
        }));
        console.log('🔴 videosWithExpiry', videosWithExpiry);
        setVideos(videosWithExpiry);
      });
      // setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };


  const getSavedVideo = (videoId: string) => savedVideos.find(v => v.videoId === videoId);

  const handleVideoClick = (videoId: string) => {
    // Immediate visual feedback
    setJustDownloaded(prev => ({ ...prev, [videoId]: true }));
    if (downloadTimersRef.current[videoId]) {
      clearTimeout(downloadTimersRef.current[videoId]);
    }
    downloadTimersRef.current[videoId] = setTimeout(() => {
      setJustDownloaded(prev => {
        const { [videoId]: _omit, ...rest } = prev;
        return rest;
      });
      delete downloadTimersRef.current[videoId];
    }, 2000);

    fetch(`/api/videos/download/${videoId}`, {
      headers: { 'x-api-key': apiKey || '' }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${videoId}.mp4`;
        a.click();
      })
      .catch(err => console.error('Failed to download video:', err));
  };

  const handleLoadChat = (videoId: string) => {
    const savedVideo = getSavedVideo(videoId);
    if (savedVideo?.conversationId) {
      loadConversation(savedVideo.conversationId);
    }
  };

  const getConversationId = (videoId: string) => {
    return getSavedVideo(videoId)?.conversationId;
  };

  const handleReferenceVideo = (video: any) => {
    const savedVideo = getSavedVideo(video.id);
    const title = savedVideo?.title || video.prompt || `Video ${video.id}`;
    referenceVideoForRemix(video.id, title);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-3"></div>
        <p className="text-sm">Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-sm text-red-600 text-center mb-3">{error}</p>
        <button
          onClick={fetchVideos}
          className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">No videos yet</p>
        <p className="text-xs text-center mt-1">Create your first video to see it here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {videos.map((video) => {
        const savedMeta = getSavedVideo(video.id);
        const displayTitle = savedMeta?.title || video.prompt || `Video ${video.id}`;
        const remixedFromId = savedMeta?.remixedFromVideoId;
        const remixedFromTitle = remixedFromId
          ? getSavedVideo(remixedFromId)?.title || `Video ${remixedFromId}`
          : null;

        return (
          <div
            key={video.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
              {displayTitle}
            </p>
            {remixedFromTitle && (
              <p className="text-xs text-purple-600 mb-1">Remix of {remixedFromTitle}</p>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded ${video.status === 'completed' ? 'bg-green-100 text-green-700' :
                  video.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                  {video.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(video.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
              {video.status === 'completed' && !video.expired && (
                <button
                  onClick={() => handleVideoClick(video.id)}
                  className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                  title={justDownloaded[video.id] ? 'Downloaded' : 'Download'}
                >
                  {justDownloaded[video.id] ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <DownloadCloud className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            {video.status === 'completed' && (
              <div className="flex gap-2">
                {getConversationId(video.id) && (
                  <button
                    onClick={() => handleLoadChat(video.id)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    Chat
                  </button>
                )}
                {video.expired && (
                  <button
                    disabled
                    className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-500 rounded text-xs font-medium cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    Expired
                  </button>
                )}
                {!video.expired && (
                  <>
                    {video.status === 'completed' && (
                      <button
                        onClick={() => handleReferenceVideo(video)}
                        className="flex-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                      >
                        Reference
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Chat History Content Component
function ChatHistoryContent() {
  const { savedConversations, savedVideos, loadConversation, deleteConversation, apiKey } = useAppStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (savedConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm font-medium">No saved chats</p>
        <p className="text-xs text-center mt-1">Your conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {savedConversations.map((conv) => (
        <div
          key={conv.id}
          className="group p-3 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <button
              onClick={() => loadConversation(conv.id)}
              className="flex-1 text-left"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {conv.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(conv.updatedAt)}
              </p>
            </button>
            <button
              onClick={() => deleteConversation(conv.id)}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity ml-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const {
    apiKey,
    chatMessages,
    setApiKey,
    videoGeneration,
    readyToGenerate,
    setReadyToGenerate,
    selectedModel,
    setSelectedModel,
  } = useAppStore();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'videos' | 'chats'>('videos');
  const { generateVideo } = useVideoGeneration();
  const [isGenerateButtonLocked, setIsGenerateButtonLocked] = useState(false);

  useEffect(() => {
    // Show API key modal only if there's no stored key
    const storedKey = localStorage.getItem('openai_api_key');
    if (!storedKey) {
      setShowApiKeyModal(true);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    if (!isGenerateButtonLocked) return;
    if (
      videoGeneration.status === 'queued' ||
      videoGeneration.status === 'in_progress' ||
      videoGeneration.status === 'failed'
    ) {
      setIsGenerateButtonLocked(false);
    }
  }, [isGenerateButtonLocked, videoGeneration.status]);

  const handleGenerateVideo = async () => {
    // Prevent double clicking while generation is queued/in progress or already locked this click
    if (
      isGenerateButtonLocked ||
      videoGeneration.status === 'queued' ||
      videoGeneration.status === 'in_progress'
    ) {
      return;
    }

    // Quick prechecks to avoid locking when we know we won't start
    if (!apiKey) {
      alert('Please set your OpenAI API key in settings');
      return;
    }
    const hasUserPrompt = chatMessages.some(
      (m) => m.role === 'user' && m.content.trim().length > 0
    );
    if (!hasUserPrompt) {
      alert('Please describe your video idea in the chat');
      return;
    }

    setIsGenerateButtonLocked(true); // disable immediately to prevent double click
    setReadyToGenerate(false); // Reset the highlight after clicking
    // Fire off generation (status will move to queued/in_progress soon after)
    generateVideo();
  };

  return (
    <main className="h-screen flex flex-col bg-paper-white paper-texture">
      {/* Privacy Banner */}
      <div className="bg-teal-600 text-white text-center py-2 px-4 text-sm">
        <p>🔒 All data is saved in the browser, we don&apos;t collect any data</p>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6">
          {/* First Row - Title */}
          <div className="py-4 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-teal-700">Sora Video Studio</h1>
          </div>

          {/* Second Row - Controls */}
          <div className="flex items-center justify-between py-3">
            {/* Left Side - New Conversation Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => useAppStore.getState().newConversation()}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="New Conversation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">New Chat</span>
              </button>
            </div>

            {/* Right Side - Settings and Model Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Model Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <span className="text-sm font-medium text-gray-600 pl-2">Sora 2</span>
                <button
                  onClick={() => setSelectedModel('sora-2')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedModel === 'sora-2'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Base
                </button>
                <button
                  onClick={() => setSelectedModel('sora-2-pro')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedModel === 'sora-2-pro'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Videos and Chats Tabs */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setLeftPanelTab('videos')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${leftPanelTab === 'videos'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Videos
              </div>
            </button>
            <button
              onClick={() => setLeftPanelTab('chats')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${leftPanelTab === 'chats'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chats
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {leftPanelTab === 'videos' && <VideoHistoryContent />}
            {leftPanelTab === 'chats' && <ChatHistoryContent />}
          </div>
        </div>

        {/* Center Column - Chat and Generate Button */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            <ChatPanel />
          </div>
          <div className="p-6 border-t border-gray-200">
            <Button
              onClick={handleGenerateVideo}
              disabled={
                isGenerateButtonLocked ||
                videoGeneration.status === 'in_progress' ||
                videoGeneration.status === 'queued'
              }
              className={`w-full transition-all ${readyToGenerate ? 'animate-pulse ring-4 ring-teal-300 shadow-lg scale-105' : ''}`}
              size="lg"
            >
              {(videoGeneration.status === 'in_progress' || videoGeneration.status === 'queued') ? (
                <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Generating Video ({videoGeneration.progress}%)</div>
              ) : (
                'Generate Video'
              )}
            </Button>
          </div>
        </div>

        {/* Right Column - Config Panel */}
        <ConfigPanel />
      </div>

      {/* Modals */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={setApiKey}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Library Panel */}
      <LibraryPanel />

      {/* Video Player */}
      <VideoPlayer />

      {/* Bottom Banner */}
      <div className="bg-gray-50 border-t border-gray-200 py-3 px-6">
        <div className="flex items-center justify-center gap-4">
          <p className="text-sm text-gray-600">
            Built by{' '}
            <a
              href="https://x.com/ananddtyagi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 underline font-medium"
            >
              Anand
            </a>
          </p>
          <span className="text-gray-300">•</span>
          <a
            href="https://github.com/sponsors/ananddtyagi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium rounded-lg transition-colors hover:border-teal-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Support this project
          </a>
        </div>
      </div>
    </main>
  );
}
