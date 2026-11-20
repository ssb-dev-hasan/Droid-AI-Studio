import { useState } from "react";

interface Props {
  repoUrl: string;
  githubToken: string;
  branch: string;
  fileCount: number;
  onPush: (repoUrl: string, token: string, branch: string, message: string) => Promise<void>;
  onClose: () => void;
}

export function GitHubPushModal({
  repoUrl: initialUrl,
  githubToken: initialToken,
  branch: initialBranch,
  fileCount,
  onPush,
  onClose,
}: Props) {
  const [repoUrl, setRepoUrl] = useState(initialUrl);
  const [token, setToken] = useState(initialToken);
  const [branch, setBranch] = useState(initialBranch || "main");
  const [message, setMessage] = useState("Update Android project from Droid AI Studio");
  const [pushing, setPushing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPushing(true);
    setStatusMsg("");
    try {
      await onPush(repoUrl, token, branch, message);
      setStatusMsg("✅ সব ফাইল GitHub-এ পুশ হয়েছে! বিল্ড শুরু হয়েছে।");
    } catch (err) {
      setStatusMsg(`❌ ${err instanceof Error ? err.message : "পুশ ব্যর্থ হয়েছে"}`);
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-3 text-white"
      >
        <h2 className="text-base font-bold">Push to GitHub ({fileCount}টি ফাইল)</h2>

        <div>
          <label className="text-xs text-slate-300 block mb-1">Repository URL</label>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/Droid-AI-Studio.git"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">GitHub Personal Access Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Branch</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1">Commit Message</label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs"
            />
          </div>
        </div>

        {statusMsg && <p className="text-xs text-amber-300">{statusMsg}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs"
          >
            বন্ধ
          </button>
          <button
            type="submit"
            disabled={pushing}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold disabled:opacity-50"
          >
            {pushing ? "পুশ হচ্ছে..." : "এখনই পুশ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}
