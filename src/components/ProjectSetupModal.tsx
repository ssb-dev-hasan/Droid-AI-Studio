import { useState } from "react";
import { ProjectMeta } from "../types/studio";

interface Props {
  initialMeta: ProjectMeta;
  onSave: (meta: ProjectMeta) => void;
  onClose: () => void;
}

export function ProjectSetupModal({ initialMeta, onSave, onClose }: Props) {
  const [projectName, setProjectName] = useState(initialMeta.projectName);
  const [packageName, setPackageName] = useState(initialMeta.packageName);
  const [logoBase64, setLogoBase64] = useState(initialMeta.logoBase64);
  const [logoMimeType, setLogoMimeType] = useState(initialMeta.logoMimeType || "image/png");

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoMimeType(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim() || !packageName.trim()) return;
    onSave({
      projectName: projectName.trim(),
      packageName: packageName.trim(),
      logoBase64,
      logoMimeType,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-3 text-white"
      >
        <h2 className="text-base font-bold">নতুন প্রজেক্ট তৈরি / সেটআপ</h2>

        <div>
          <label className="text-xs text-slate-300 block mb-1">প্রজেক্ট নাম</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="যেমন: BanglaNotes"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">প্যাকেজ নাম</label>
          <input
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="যেমন: com.example.banglanotes"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 block mb-1">অ্যাপ লোগো আপলোড</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full text-xs text-slate-300"
          />
          {logoBase64 && (
            <img
              src={logoBase64}
              alt="Logo preview"
              className="mt-2 w-14 h-14 rounded-xl object-cover border border-slate-600"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs"
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold"
          >
            প্রজেক্ট তৈরি করুন
          </button>
        </div>
      </form>
    </div>
  );
}
