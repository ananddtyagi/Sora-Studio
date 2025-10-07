'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setError('API key should start with "sk-"');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Basic validation - just save it for now
      // In a real app, you might want to test it with a simple API call
      onSave(apiKey.trim());
      setApiKey('');
      onClose();
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter OpenAI API Key">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You'll need an OpenAI API key to generate images and videos. Your key is stored locally in your browser and never sent to our servers.
        </p>

        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            Get your API key from OpenAI
          </a>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isValidating}
            className="flex-1"
          >
            {isValidating ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
