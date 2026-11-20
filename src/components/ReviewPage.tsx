import { CodeError, ProjectMeta } from "../types/studio";

interface Props {
  projectMeta: ProjectMeta;
  files: Record<string, string>;
  errors: CodeError[];
  onBackToEditor: () => void;
  onJumpToError: (filePath: string, line: number) => void;
  onAutoFixErrors: () => void;
  onOpenPush: () => void;
}

export function ReviewPage({
  projectMeta,
  files,
  errors,
  onBackToEditor,
  onJumpToError,
  onAutoFixErrors,
  onOpenPush,
}: Props) {
  const allPaths = Object.keys(files);
  const errorFileSet = new Set(errors.map((e) => e.filePath));
  const sortedPaths = [
    ...allPaths.filter((p) => errorFileSet.has(p)),
    ...allPaths.filter((p) => !errorFileSet.has(p)),
  ];

  const mainXml = files["app/src/main/res/layout/activity_main.xml"] || "";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onBackToEditor}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs"
        >
          ← Editor
        </button>
        <h1 className="text-sm font-bold truncate">{projectMeta.projectName} - Review</h1>
        <button
          onClick={onOpenPush}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold"
        >
          GitHub Push →
        </button>
      </header>

      {/* এরর থাকা ফাইল সবার আগে সামনে আসবে */}
      {errors.length > 0 ? (
        <section className="m-3 p-3 rounded-xl border border-red-500/60 bg-red-950/35 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-red-300">
              ⚠️ {errors.length}টি এরর পাওয়া গেছে ({errorFileSet.size}টি ফাইলে)
            </h2>
            <button
              onClick={onAutoFixErrors}
              className="px-2.5 py-1 rounded bg-red-600 text-xs font-semibold"
            >
              AI দিয়ে ঠিক করুন
            </button>
          </div>
          {errors.map((err) => (
            <button
              key={err.id}
              onClick={() => onJumpToError(err.filePath, err.line)}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-red-500/30"
            >
              <p className="text-xs font-mono text-red-300">
                {err.filePath} : লাইন {err.line}
              </p>
              <p className="text-xs text-slate-200 mt-0.5">{err.message}</p>
            </button>
          ))}
        </section>
      ) : (
        <div className="m-3 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-xs text-emerald-300">
          ✅ কোনো এরর নেই। প্রিভিউ দেখে GitHub-এ পুশ করতে পারেন।
        </div>
      )}

      {/* মোবাইল প্রিভিউ ফ্রেম */}
      <section className="px-3 py-2 flex flex-col items-center">
        <div className="w-full max-w-xs rounded-3xl border-4 border-slate-700 bg-white text-slate-900 p-4 shadow-xl">
          <div className="flex flex-col items-center text-center py-6">
            {projectMeta.logoBase64 && (
              <img
                src={projectMeta.logoBase64}
                alt="App Icon"
                className="w-16 h-16 rounded-2xl mb-3 object-cover"
              />
            )}
            <p className="font-bold text-base">{projectMeta.projectName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{projectMeta.packageName}</p>
            <p className="text-[11px] text-slate-600 mt-3 line-clamp-3">
              {mainXml ? "Layout XML প্রস্তুত (activity_main.xml)" : "Preview Ready"}
            </p>
          </div>
        </div>
      </section>

      {/* ফাইল লিস্ট (এরর ফাইল উপরে) */}
      <section className="p-3 space-y-2">
        <h3 className="text-xs font-semibold text-slate-400">সব ফাইল ({sortedPaths.length})</h3>
        {sortedPaths.map((path) => {
          const hasErr = errorFileSet.has(path);
          const firstErr = errors.find((e) => e.filePath === path);
          return (
            <button
              key={path}
              onClick={() => onJumpToError(path, firstErr?.line || 1)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs ${
                hasErr
                  ? "border-red-500/60 bg-red-950/25"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <span className="font-mono truncate pr-2">{path}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] ${
                  hasErr ? "bg-red-600 text-white" : "bg-emerald-600/20 text-emerald-300"
                }`}
              >
                {hasErr ? "Error" : "OK"}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
