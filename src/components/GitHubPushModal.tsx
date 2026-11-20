import React, { useState } from "react";
import { ProjectFile } from "../types/studio";
import { pushProjectFilesToGitHub } from "../services/githubService";

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  defaultProjectName: string;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({
  isOpen,
  onClose,
  files,
  defaultProjectName,
}) => {
  const [owner, setOwner] = useState("ssb-dev-hasan");
  const [repo, setRepo] = useState("Droid-AI-Studio");
  const [branch, setBranch] = useState("main");
  const [pathPrefix, setPathPrefix] = useState(`generated-projects/${defaultProjectName.toLowerCase().replace(/\s+/g, "-")}`);
  const [token, setToken] = useState("");
  const [commitMessage, setCommitMessage] = useState(
    `Push ${defaultProjectName} via Droid AI Studio`
  );
  const [statusText, setStatusText] = useState("");
  const [isPushing, setIsPushing] = useState(false);

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setStatusText("GitHub Personal Access Token দিন।");
      return;
    }

    setIsPushing(true);
    setStatusText("পুশ শুরু হচ্ছে...");
    try {
      const res = await pushProjectFilesToGitHub(
        {
          owner: owner.trim(),
          repo: repo.trim(),
          branch: branch.trim() || "main",
          token: token.trim(),
          commitMessage: commitMessage.trim(),
          pathPrefix: pathPrefix.trim(),
          files,
        },
        (current, total, filePath) => {
          setStatusText(`পুশ হচ্ছে (${current}/${total}): ${filePath}`);
        }
      );
      setStatusText(`সফলভাবে ${res.pushedCount}টি ফাইল GitHub-এ পুশ হয়েছে!`);
    } catch (err) {
      setStatusText(`পুশ ব্যর্থ: ${String(err)}`);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">সরাসরি GitHub-এ পুশ</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handlePush} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Owner</label>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Repository</label>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Branch</label>
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">Target Folder</label>
              <input
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">GitHub Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">Commit Message</label>
            <input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
            />
          </div>

          {statusText && (
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-emerald-300">
              {statusText}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300"
            >
              বন্ধ
            </button>
            <button
              type="submit"
              disabled={isPushing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {isPushing ? "পুশ হচ্ছে..." : "GitHub Push"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
