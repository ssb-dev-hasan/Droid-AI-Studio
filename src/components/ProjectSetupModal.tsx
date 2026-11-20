import React, { useState } from "react";
import { CreateProjectInput } from "../templates/androidProject";

interface ProjectSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (input: CreateProjectInput) => void;
}

export const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState("IMO Pro");
  const [packageName, setPackageName] = useState("com.example.imopro");
  const [description, setDescription] = useState("Android Messaging & Calling App");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [logoFileName, setLogoFileName] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject({
      name,
      packageName,
      description,
      logoDataUrl,
      logoFileName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">নতুন Android প্রজেক্ট</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-300">অ্যাপের নাম</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">Package Name</label>
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">বিবরণ</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-300">অ্যাপ লোগো আপলোড</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300"
            />
            {logoDataUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={logoDataUrl}
                  alt="App Logo Preview"
                  className="h-12 w-12 rounded-lg border border-slate-700 object-cover"
                />
                <span className="text-xs text-emerald-400">{logoFileName}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              প্রজেক্ট তৈরি করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
