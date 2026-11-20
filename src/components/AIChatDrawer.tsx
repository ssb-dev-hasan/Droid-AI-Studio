import { useState } from "react";
import { AIProvider, ChatMessage } from "../types/studio";

interface Props {
  provider: AIProvider;
  apiKey: string;
  onChangeProvider: (p: AIProvider) => void;
  onChangeApiKey: (key: string) => void;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string, screenshotBase64?: string, mimeType?: string) => void;
  onClose: () => void;
}

export function AIChatDrawer({
  provider,
  apiKey,
  onChangeProvider,
  onChangeApiKey,
  messages,
  loading,
  onSend,
  onClose,
}: Props) {
  const [input, setInput] = useState("");
  const [imgBase64, setImgBase64] = useState<string>("");
  const [imgMime, setImgMime] = useState<string>("image/png");

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgMime(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImgBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !imgBase64) return;
    onSend(
      input.trim() || "স্ক্রিনশটের এররটি ঠিক করে ফাইল আপডেট করো।",
      imgBase64 || undefined,
      imgMime
    );
    setInput("");
    setImgBase64("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-lg h-[88vh] sm:h-[78vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-700 flex flex-col text-white overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm">Droid AI Assistant (বাংলা / যেকোনো ভাষা)</span>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-slate-800">
            বন্ধ করুন
          </button>
        </div>

        {/* নিজস্ব AI Provider & API Key */}
        <div className="p-2.5 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-2">
          <select
            value={provider}
            onChange={(e) => onChangeProvider(e.target.value as AIProvider)}
            className="rounded bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
          </select>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onChangeApiKey(e.target.value)}
            placeholder="আপনার API Key"
            className="col-span-2 rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs"
          />
        </div>

        {/* চ্যাট মেসেজ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl p-2.5 text-xs whitespace-pre-wrap ${
                m.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {m.imagePreview && (
                <img
                  src={m.imagePreview}
                  alt="Screenshot"
                  className="mb-1.5 max-h-36 rounded-lg object-contain"
                />
              )}
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="text-xs text-emerald-400 animate-pulse">
              AI ফাইল বিশ্লেষণ ও আপডেট করছে...
            </div>
          )}
        </div>

        {/* স্ক্রিনশট প্রিভিউ ও ইনপুট */}
        {imgBase64 && (
          <div className="px-3 py-1.5 bg-slate-800/80 flex items-center justify-between text-xs">
            <span>স্ক্রিনশট যুক্ত করা হয়েছে</span>
            <button onClick={() => setImgBase64("")} className="text-red-400">
              সরান
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-2.5 border-t border-slate-800 flex items-center gap-2">
          <label className="px-2.5 py-2 rounded-lg bg-slate-800 text-xs cursor-pointer">
            📷
            <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="বাংলায় বা যেকোনো ভাষায় লিখুন..."
            className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-xs font-semibold disabled:opacity-50"
          >
            পাঠান
          </button>
        </form>
      </div>
    </div>
  );
}
