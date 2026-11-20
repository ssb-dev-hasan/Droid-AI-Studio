import React from "react";
import { ProjectFile, ValidationIssue } from "../types/studio";

interface ReviewPageProps {
  files: ProjectFile[];
  issues: ValidationIssue[];
  onClose: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  files,
  issues,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950 p-5 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold">প্রজেক্ট কোড ও ইস্যু রিভিউ</h2>
            <p className="text-xs text-slate-400">
              মোট ফাইল: {files.length} | ইস্যু: {issues.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            এডিটরে ফিরুন
          </button>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-semibold text-amber-400">ভ্যালিডেশন চেক</h3>
          {issues.length === 0 ? (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">
              কোনো গুরুতর সমস্যা পাওয়া যায়নি।
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm"
              >
                <span className="font-mono text-xs text-amber-300">
                  {issue.filePath}
                </span>
                <p className="mt-1">{issue.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-sky-400">সকল ফাইল</h3>
          {files.map((file) => (
            <div
              key={file.path}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="mb-2 font-mono text-xs text-emerald-400">
                {file.path}
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
                <code>{file.content}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
