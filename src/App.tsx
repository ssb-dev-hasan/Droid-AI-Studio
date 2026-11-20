import { useEffect, useMemo, useState } from "react";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { GitHubPushModal } from "./components/GitHubPushModal";
import { ProjectSetupModal } from "./components/ProjectSetupModal";
import { ReviewPage } from "./components/ReviewPage";
import { runAIStudioTask } from "./services/aiService";
import { pushAllFilesToGitHub } from "./services/githubService";
import { createInitialProjectFiles } from "./templates/androidProject";
import { AIProvider, ChatMessage, ProjectMeta, StudioUserConfig } from "./types/studio";
import { detectProjectErrors } from "./utils/errorChecker";

const DEFAULT_META: ProjectMeta = {
  projectName: "MyDroidApp",
  packageName: "com.example.mydroidapp",
  logoBase64: "",
  logoMimeType: "image/png",
};

const DEFAULT_USER_CONFIG: StudioUserConfig = {
  userId: "user_default",
  aiProvider: "gemini",
  apiKey: "",
  repoUrl: "https://github.com/your-username/Droid-AI-Studio.git",
  githubToken: "",
  branch: "main",
};

export function App() {
  const [userId, setUserId] = useState("user_default");
  const storageKey = `droid_ai_studio_${userId}`;

  const [projectMeta, setProjectMeta] = useState<ProjectMeta>(DEFAULT_META);
  const [files, setFiles] = useState<Record<string, string>>(() =>
    createInitialProjectFiles(DEFAULT_META)
  );
  const [activeFile, setActiveFile] = useState<string>(
    "app/src/main/java/com/example/mydroidapp/MainActivity.kt"
  );
  const [userConfig, setUserConfig] = useState<StudioUserConfig>(DEFAULT_USER_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "ড্রয়িড এআই স্টুডিওতে স্বাগতম! প্রজেক্ট তৈরি করে বাংলায় বা যেকোনো ভাষায় চ্যাট করে কোড লিখুন বা এররের স্ক্রিনশট দিন।",
    },
  ]);

  const [view, setView] = useState<"editor" | "review">("editor");
  const [showSetup, setShowSetup] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");

  // ইউজার বদলালে আলাদা স্টোরেজ লোড হবে (একজনের ডেটা অন্যজনের সাথে মিশবে না)
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.projectMeta) setProjectMeta(parsed.projectMeta);
        if (parsed.files) {
          setFiles(parsed.files);
          const keys = Object.keys(parsed.files);
          if (keys.length > 0 && !parsed.files[activeFile]) {
            setActiveFile(keys[0]);
          }
        }
        if (parsed.userConfig) setUserConfig(parsed.userConfig);
        if (parsed.messages) setMessages(parsed.messages);
        return;
      } catch {
        // fallback below
      }
    }
    const freshFiles = createInitialProjectFiles(DEFAULT_META);
    setProjectMeta(DEFAULT_META);
    setFiles(freshFiles);
    setActiveFile(Object.keys(freshFiles).find((k) => k.endsWith("MainActivity.kt")) || "");
    setUserConfig({ ...DEFAULT_USER_CONFIG, userId });
  }, [storageKey, userId]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ projectMeta, files, userConfig, messages })
    );
  }, [storageKey, projectMeta, files, userConfig, messages]);

  const errors = useMemo(() => detectProjectErrors(files), [files]);
  const filePaths = Object.keys(files);

  function handleCreateProject(meta: ProjectMeta) {
    const newFiles = createInitialProjectFiles(meta);
    const pkgPath = meta.packageName.replace(/\./g, "/");
    setProjectMeta(meta);
    setFiles(newFiles);
    setActiveFile(`app/src/main/java/${pkgPath}/MainActivity.kt`);
    setShowSetup(false);
    setBannerMsg(`"${meta.projectName}" প্রজেক্ট ও .github/workflows/android.yml তৈরি হয়েছে।`);
  }

  function handleCodeChange(newContent: string) {
    if (!activeFile) return;
    setFiles((prev) => ({ ...prev, [activeFile]: newContent }));
  }

  async function handleAISend(
    instruction: string,
    screenshotBase64?: string,
    mimeType?: string
  ) {
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: instruction,
      imagePreview: screenshotBase64,
    };
    setMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const result = await runAIStudioTask({
        provider: userConfig.aiProvider,
        apiKey: userConfig.apiKey,
        projectMeta,
        files,
        errors,
        chatHistory: [...messages, userMsg],
        instruction,
        screenshotBase64,
        screenshotMimeType: mimeType,
      });

      setFiles(result.updatedFiles);
      const updatedPaths = Object.keys(result.updatedFiles);
      if (updatedPaths.length > 0 && !result.updatedFiles[activeFile]) {
        setActiveFile(updatedPaths[0]);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "assistant",
          content: `❌ ${err instanceof Error ? err.message : "AI এরর"}`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePushGitHub(
    repoUrl: string,
    token: string,
    branch: string,
    message: string
  ) {
    setUserConfig((prev) => ({ ...prev, repoUrl, githubToken: token, branch }));
    const res = await pushAllFilesToGitHub({
      repoUrl,
      token,
      branch,
      files,
      commitMessage: message,
    });
    setBannerMsg(`${res.pushedCount}টি ফাইল GitHub-এ পুশ হয়েছে এবং বিল্ড শুরু হয়েছে।`);
  }

  if (view === "review") {
    return (
      <>
        <ReviewPage
          projectMeta={projectMeta}
          files={files}
          errors={errors}
          onBackToEditor={() => setView("editor")}
          onJumpToError={(filePath) => {
            setActiveFile(filePath);
            setView("editor");
          }}
          onAutoFixErrors={() => {
            setView("editor");
            setShowAI(true);
            handleAISend("সব এরর ঠিক করো এবং সংশ্লিষ্ট সব ফাইল আপডেট করো।");
          }}
          onOpenPush={() => setShowPush(true)}
        />
        {showPush && (
          <GitHubPushModal
            repoUrl={userConfig.repoUrl}
            githubToken={userConfig.githubToken}
            branch={userConfig.branch}
            fileCount={filePaths.length}
            onPush={handlePushGitHub}
            onClose={() => setShowPush(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Studio Bar */}
      <header className="p-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-emerald-400">ড্রয়িড এআই স্টুডিও</span>
          <span className="text-xs text-slate-400">({projectMeta.projectName})</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value.trim() || "user_default")}
            title="User ID"
            className="w-24 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px]"
          />
          <button
            onClick={() => setShowSetup(true)}
            className="px-2.5 py-1.5 rounded bg-slate-800 text-xs"
          >
            + প্রজেক্ট
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="px-2.5 py-1.5 rounded bg-purple-600 text-xs font-medium"
          >
            AI চ্যাট
          </button>
          <button
            onClick={() => setView("review")}
            className="px-2.5 py-1.5 rounded bg-emerald-600 text-xs font-semibold"
          >
            Review {errors.length > 0 ? `(${errors.length} Err)` : ""}
          </button>
          <button
            onClick={() => setShowPush(true)}
            className="px-2.5 py-1.5 rounded bg-blue-600 text-xs font-semibold"
          >
            Push
          </button>
        </div>
      </header>

      {bannerMsg && (
        <div className="px-3 py-1.5 bg-emerald-950/50 border-b border-emerald-700/40 text-xs text-emerald-300 flex justify-between">
          <span>{bannerMsg}</span>
          <button onClick={() => setBannerMsg("")}>✕</button>
        </div>
      )}

      {/* ফাইল সিলেক্টর */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
        {filePaths.map((path) => {
          const hasErr = errors.some((e) => e.filePath === path);
          return (
            <button
              key={path}
              onClick={() => setActiveFile(path)}
              className={`shrink-0 px-2.5 py-1 rounded text-xs font-mono ${
                activeFile === path
                  ? "bg-blue-600 text-white"
                  : hasErr
                  ? "bg-red-950 text-red-300 border border-red-500/50"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {path.split("/").pop()}
            </button>
          );
        })}
      </div>

      {/* কোড এডিটর */}
      <main className="flex-1 flex flex-col p-2.5 gap-2">
        <div className="text-[11px] font-mono text-slate-400 truncate">{activeFile}</div>
        <textarea
          value={files[activeFile] || ""}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-[320px] w-full rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-xs leading-relaxed text-slate-100 focus:outline-none focus:border-blue-500"
        />

        {/* এরর কনসোল */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/50 bg-red-950/30 p-2.5 space-y-1">
            <p className="text-xs font-bold text-red-300">এররসমূহ ({errors.length}):</p>
            {errors.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveFile(e.filePath)}
                className="block text-left text-xs text-red-200 hover:underline"
              >
                {e.filePath.split("/").pop()} : লাইন {e.line} — {e.message}
              </button>
            ))}
          </div>
        )}
      </main>

      {showSetup && (
        <ProjectSetupModal
          initialMeta={projectMeta}
          onSave={handleCreateProject}
          onClose={() => setShowSetup(false)}
        />
      )}

      {showAI && (
        <AIChatDrawer
          provider={userConfig.aiProvider}
          apiKey={userConfig.apiKey}
          onChangeProvider={(aiProvider) => setUserConfig((p) => ({ ...p, aiProvider }))}
          onChangeApiKey={(apiKey) => setUserConfig((p) => ({ ...p, apiKey }))}
          messages={messages}
          loading={aiLoading}
          onSend={handleAISend}
          onClose={() => setShowAI(false)}
        />
      )}

      {showPush && (
        <GitHubPushModal
          repoUrl={userConfig.repoUrl}
          githubToken={userConfig.githubToken}
          branch={userConfig.branch}
          fileCount={filePaths.length}
          onPush={handlePushGitHub}
          onClose={() => setShowPush(false)}
        />
      )}
    </div>
  );
}

export default App;
