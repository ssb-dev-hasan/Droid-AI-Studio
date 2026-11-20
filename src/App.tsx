import React, { useMemo, useState } from "react";
import { ChatMessage, ProjectFile, StudioProject } from "./types/studio";
import {
  createAndroidProjectTemplate,
  CreateProjectInput,
} from "./templates/androidProject";
import { generateCodeFromPrompt } from "./services/aiService";
import { checkProjectErrors } from "./utils/errorChecker";
import { ProjectSetupModal } from "./components/ProjectSetupModal";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { ReviewPage } from "./components/ReviewPage";
import { GitHubPushModal } from "./components/GitHubPushModal";

export default function App() {
  const [project, setProject] = useState<StudioProject>(() =>
    createAndroidProjectTemplate({
      name: "IMO Studio App",
      packageName: "com.example.imostudio",
      description: "Android Messaging & Voice/Video App",
    })
  );

  const [selectedPath, setSelectedPath] = useState<string>(
    project.files[0]?.path || ""
  );
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPushOpen, setIsPushOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "নতুন Android প্রজেক্ট খুলুন, লোগো আপলোড করুন, নিচে কমান্ড দিন আমি ফাইলগুলোতে কোড লিখব, তারপর সরাসরি GitHub-এ পুশ করুন।",
      timestamp: Date.now(),
    },
  ]);

  const activeFile = useMemo(
    () => project.files.find((f) => f.path === selectedPath) || project.files[0],
    [project.files, selectedPath]
  );

  const issues = useMemo(() => checkProjectErrors(project.files), [project.files]);

  const handleCreateProject = (input: CreateProjectInput) => {
    const newProj = createAndroidProjectTemplate(input);
    setProject(newProj);
    setSelectedPath(newProj.files[0]?.path || "");
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: "assistant",
        content: `"${newProj.name}" (${newProj.packageName}) প্রজেক্ট তৈরি হয়েছে।${
          newProj.logoFileName ? ` লোগো যুক্ত হয়েছে: ${newProj.logoFileName}` : ""
        }`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleEditorChange = (newContent: string) => {
    if (!activeFile) return;
    setProject((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.path === activeFile.path ? { ...f, content: newContent } : f
      ),
    }));
  };

  const handleAICommand = async (prompt: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAILoading(true);

    try {
      const result = await generateCodeFromPrompt({
        prompt,
        project,
        activeFile,
        history: [...messages, userMsg],
        apiKey,
      });

      setProject((prev) => {
        const fileMap = new Map<string, ProjectFile>();
        for (const f of prev.files) {
          fileMap.set(f.path, f);
        }
        for (const updated of result.updatedFiles) {
          fileMap.set(updated.path, updated);
        }
        return {
          ...prev,
          files: Array.from(fileMap.values()),
        };
      });

      if (result.updatedFiles[0]?.path) {
        setSelectedPath(result.updatedFiles[0].path);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          {project.logoDataUrl ? (
            <img
              src={project.logoDataUrl}
              alt="Logo"
              className="h-9 w-9 rounded-lg object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold">
              AI
            </div>
          )}
          <div>
            <h1 className="text-base font-bold">{project.name}</h1>
            <p className="text-xs text-slate-400">{project.packageName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSetupOpen(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500"
          >
            + নতুন প্রজেক্ট / লোগো
          </button>
          <button
            onClick={() => setIsReviewOpen(true)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700"
          >
            রিভিউ ({issues.length})
          </button>
          <button
            onClick={() => setIsChatOpen((v) => !v)}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold hover:bg-purple-500"
          >
            AI কমান্ড
          </button>
          <button
            onClick={() => setIsPushOpen(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-500"
          >
            GitHub Push
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 md:grid-cols-12">
        <aside className="border-b border-slate-800 bg-slate-900/60 p-3 md:col-span-3 md:border-b-0 md:border-r">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            প্রজেক্ট ফাইলসমূহ
          </div>
          <div className="space-y-1">
            {project.files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedPath(file.path)}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left font-mono text-xs ${
                  activeFile?.path === file.path
                    ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {file.path}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex flex-col p-3 md:col-span-9">
          <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <span className="font-mono text-xs text-emerald-400">
              {activeFile?.path || "কোনো ফাইল সিলেক্ট করা নেই"}
            </span>
            <span className="text-[11px] text-slate-400">লাইভ এডিটর</span>
          </div>

          <textarea
            value={activeFile?.content || ""}
            onChange={(e) => handleEditorChange(e.target.value)}
            spellCheck={false}
            className="min-h-[65vh] w-full flex-1 rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </main>
      </div>

      <ProjectSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        apiKey={apiKey}
        onChangeApiKey={setApiKey}
        onSendCommand={handleAICommand}
        isLoading={isAILoading}
      />

      {isReviewOpen && (
        <ReviewPage
          files={project.files}
          issues={issues}
          onClose={() => setIsReviewOpen(false)}
        />
      )}

      <GitHubPushModal
        isOpen={isPushOpen}
        onClose={() => setIsPushOpen(false)}
        files={project.files}
        defaultProjectName={project.name}
      />
    </div>
  );
}
