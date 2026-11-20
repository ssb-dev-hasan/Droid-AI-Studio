import { ProjectFile, ValidationIssue } from "../types/studio";

export function checkProjectErrors(files: ProjectFile[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!files || files.length === 0) {
    issues.push({
      filePath: "project",
      message: "প্রজেক্টে কোনো ফাইল পাওয়া যায়নি।",
      severity: "error",
    });
    return issues;
  }

  for (const file of files) {
    if (!file.content.trim()) {
      issues.push({
        filePath: file.path,
        message: "এই ফাইলটি খালি রয়েছে।",
        severity: "warning",
      });
    }

    if (file.path.endsWith(".xml") && !file.content.includes("<?xml")) {
      issues.push({
        filePath: file.path,
        message: "XML ফাইলে <?xml version=\"1.0\" encoding=\"utf-8\"?> হেডার রাখা ভালো।",
        severity: "warning",
      });
    }
  }

  return issues;
}
