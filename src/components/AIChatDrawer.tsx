import React, { useState } from "react";
import { ChatMessage } from "../types/studio";

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  apiKey: string;
  onChangeApiKey: (key: string) => void;
  onSendCommand: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  apiKey,
  onChangeApiKey,
  onSendCommand,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const text = prompt.trim();
    setPrompt("");
    await onSendCommand(text);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h3 className="font-bold">AI কোড অ্যাসিস্ট্যান্ট</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="border-b border-slate-800 p-3">
        <label className="mb-1 block text-xs text-slate-400">Gemini API Key (ঐচ্ছিক)</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onChangeApiKey(e.target.value)}
          placeholder="AIza..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 text-sm ${
              m.role === "user"
                ? "ml-8 bg-blue-600/30 border border-blue-500/40"
                : "mr-8 bg-slate-800 border border-slate-700"
            }`}
          >
            <div className="mb-1 text-[11px] text-slate-400">
              {m.role === "user" ? "আপনি" : "AI"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="rounded-lg bg-slate-800 p-3 text-xs text-emerald-400">
            ফাইলগুলোতে কোড জেনারেট হচ্ছে...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-800 p-3">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="যেমন: চ্যাট স্ক্রিন ও কল বাটন যুক্ত করো..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            পাঠান
          </button>
        </div>
      </form>
    </div>
  );
};
