'use client';

import { useAppStore } from '@/store/useAppStore';
import React, { useState } from 'react';
import { Button } from './Button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useAppStore();
  const [newApiKey, setNewApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  };

  const handleSave = () => {
    if (newApiKey.trim()) {
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    setApiKey(null);
    setNewApiKey('');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="relative bg-white shadow-xl h-full w-full max-w-md overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">OpenAI API Key</h3>

              {!isEditing && apiKey ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 px-4 py-3 rounded-lg font-mono text-sm text-gray-600">
                    {maskApiKey(apiKey)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Key
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Clear Key
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                    >
                      Save Key
                    </Button>
                    {isEditing && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setNewApiKey('');
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Your API key is stored locally in your browser.{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 underline"
                >
                  Get your key here
                </a>
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
              <p className="text-sm text-gray-600">
                Create stunning videos with AI-powered conversations and Sora 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
