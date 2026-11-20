import { CodeError } from "../types/studio";

export function detectProjectErrors(files: Record<string, string>): CodeError[] {
  const errors: CodeError[] = [];

  for (const [filePath, content] of Object.entries(files)) {
    const lines = content.split("\n");

    // ১. ব্র্যাকেট ব্যালেন্স চেক
    let curly = 0;
    let paren = 0;
    let bracket = 0;

    lines.forEach((rawLine, idx) => {
      const lineNum = idx + 1;
      const line = rawLine.trim();

      // পরপর দুটি কমা বা কমা ও সেমিকোলন পাশাপাশি ভুল (যেমন ",," বা ",;")
      if (/,,|,\s*;|;\s*,/.test(line)) {
        errors.push({
          id: `${filePath}-${lineNum}-punct`,
          filePath,
          line: lineNum,
          message: "কমা (,) বা সেমিকোলন (;) ব্যবহারে ভুল রয়েছে।",
        });
      }

      // Java/C/Gradle-এ কিছু সাধারণ স্টেটমেন্টের শেষে সেমিকোলন না থাকলে সতর্কতা
      if (
        filePath.endsWith(".java") &&
        line.length > 0 &&
        !line.endsWith(";") &&
        !line.endsWith("{") &&
        !line.endsWith("}") &&
        !line.startsWith("//") &&
        !line.startsWith("/*") &&
        !line.startsWith("*") &&
        !line.startsWith("@") &&
        !line.startsWith("package ") &&
        !line.startsWith("import ") &&
        !line.startsWith("if ") &&
        !line.startsWith("else") &&
        !line.startsWith("for ") &&
        !line.startsWith("while ")
      ) {
        errors.push({
          id: `${filePath}-${lineNum}-semi`,
          filePath,
          line: lineNum,
          message: "Java লাইনের শেষে সেমিকোলন (;) মিসিং থাকতে পারে।",
        });
      }

      // XML ফাইলে ভুল অ্যাট্রিবিউট বা অসমাপ্ত ট্যাগ
      if (filePath.endsWith(".xml") && line.startsWith("<") && !line.startsWith("<?")) {
        const openTags = (line.match(/<[a-zA-Z0-9_.:-]+/g) || []).length;
        const closeTags = (line.match(/>/g) || []).length;
        if (openTags > closeTags) {
          errors.push({
            id: `${filePath}-${lineNum}-xml`,
            filePath,
            line: lineNum,
            message: "XML ট্যাগ সঠিকভাবে বন্ধ করা হয়নি (> মিসিং)।",
          });
        }
      }

      for (const ch of line) {
        if (ch === "{") curly++;
        if (ch === "}") curly--;
        if (ch === "(") paren++;
        if (ch === ")") paren--;
        if (ch === "[") bracket++;
        if (ch === "]") bracket--;
      }
    });

    if (curly !== 0) {
      errors.push({
        id: `${filePath}-curly`,
        filePath,
        line: lines.length || 1,
        message: `Curly brace { } মিসম্যাচ (${curly > 0 ? `${curly}টি } বাকি` : `${Math.abs(curly)}টি } অতিরিক্ত`})।`,
      });
    }
    if (paren !== 0) {
      errors.push({
        id: `${filePath}-paren`,
        filePath,
        line: lines.length || 1,
        message: `Parenthesis ( ) মিসম্যাচ (${paren > 0 ? `${paren}টি ) বাকি` : `${Math.abs(paren)}টি ) অতিরিক্ত`})।`,
      });
    }
    if (bracket !== 0) {
      errors.push({
        id: `${filePath}-bracket`,
        filePath,
        line: lines.length || 1,
        message: `Bracket [ ] মিসম্যাচ (${bracket > 0 ? `${bracket}টি ] বাকি` : `${Math.abs(bracket)}টি ] অতিরিক্ত`})।`,
      });
    }
  }

  return errors;
}
