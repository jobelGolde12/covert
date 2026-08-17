import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { env } from "@/lib/env";

/**
 * LibreOffice headless conversions — documentation/architecture.md §3.2.
 * Each job gets an isolated user profile to avoid profile-lock contention
 * between concurrent conversions. Engine version pinned by the base image.
 */

export class OfficeError extends Error {
  constructor(
    message: string,
    public readonly code: string = "CONVERSION_FAILED"
  ) {
    super(message);
    this.name = "OfficeError";
  }
}

const FILTERS: Record<string, string> = {
  pdf: "pdf",
  docx: "docx:MS Word 2007 XML",
  xlsx: "xlsx:Calc MS Excel 2007 XML",
  pptx: "pptx:Impress MS PowerPoint 2007 XML",
  html: "html:HTML (StarWriter)",
  txt: "txt:Text (encoded):UTF8",
};

export function sofficeFilterFor(target: string): string {
  const f = FILTERS[target];
  if (!f) throw new OfficeError(`Unsupported LibreOffice target: ${target}`, "UNSUPPORTED_FORMAT");
  return f;
}

export interface ConvertResult {
  outputPath: string;
  stdout: string;
  stderr: string;
}

export async function convertWithSoffice(
  inputPath: string,
  outDir: string,
  target: string,
  opts: { profileDir?: string; timeoutMs?: number } = {}
): Promise<ConvertResult> {
  const profileDir = opts.profileDir ?? path.join(env.lo.profileRoot, `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const timeoutMs = opts.timeoutMs ?? env.lo.timeoutMs;
  // Plain filter names (e.g. "pdf"); LibreOffice auto-selects the right exporter
  // (writer_pdf_Export vs writer_web_pdf_Export) from the input type.
  const filter = sofficeFilterFor(target);

  await fs.mkdir(outDir, { recursive: true });

  const args = [
    "--headless",
    "--norestore",
    "--nolockcheck",
    "--nodefault",
    `-env:UserInstallation=file://${profileDir}`,
    "--convert-to",
    filter,
    "--outdir",
    outDir,
    inputPath,
  ];

  const result = await new Promise<ConvertResult>((resolve, reject) => {
    const child = spawn("soffice", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        reject(new OfficeError(`LibreOffice timed out after ${Math.round(timeoutMs / 1000)}s`, "TIMEOUT"));
      }
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new OfficeError(`Failed to launch soffice: ${err.message}`, "ENGINE_UNAVAILABLE"));
      }
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new OfficeError(`LibreOffice exited with code ${code}: ${stderr.slice(0, 500)}`, "CONVERSION_FAILED"));
      } else {
        resolve({ outputPath: "", stdout, stderr });
      }
    });
  });

  // Locate the produced file (basename of input, target extension)
  const base = path.basename(inputPath, path.extname(inputPath));
  const outExt = target === "html" ? "html" : target === "txt" ? "txt" : target;
  const candidate = path.join(outDir, `${base}.${outExt}`);
  if (!(await exists(candidate))) {
    const files = await fs.readdir(outDir);
    if (files.length === 0) {
      throw new OfficeError("LibreOffice produced no output file", "CONVERSION_FAILED");
    }
    return { outputPath: path.join(outDir, files[0]), stdout: result.stdout, stderr: result.stderr };
  }
  return { outputPath: candidate, stdout: result.stdout, stderr: result.stderr };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Minimal Markdown → HTML renderer (for md → pdf with editorial typography). */
export function markdownToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const inline = (s: string) =>
      s
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[(.+?)\]\((https?:\/\/.+?)\)/g, '<a href="$2">$1</a>');

    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      html.push(`<h${level}>${inline(esc(h[2]))}</h${level}>`);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      if (inList !== "ul") {
        closeList();
        html.push("<ul>");
        inList = "ul";
      }
      html.push(`<li>${inline(esc(ul[1]))}</li>`);
      continue;
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      if (inList !== "ol") {
        closeList();
        html.push("<ol>");
        inList = "ol";
      }
      html.push(`<li>${inline(esc(ol[1]))}</li>`);
      continue;
    }
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      closeList();
      html.push(`<blockquote>${inline(esc(q[1]))}</blockquote>`);
      continue;
    }
    const hr = /^\s*([-*_])\1{2,}\s*$/.test(line);
    if (hr) {
      closeList();
      html.push("<hr />");
      continue;
    }
    closeList();
    html.push(`<p>${inline(esc(line))}</p>`);
  }
  closeList();

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif;
         font-size: 11pt; line-height: 1.55; color: #171717; margin: 2.2cm 2.4cm; }
  h1 { font-size: 22pt; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 0.4em; }
  h2 { font-size: 15pt; font-weight: 500; margin: 1.2em 0 0.3em; }
  h3 { font-size: 12.5pt; font-weight: 600; margin: 1em 0 0.2em; }
  p { margin: 0.5em 0; }
  ul, ol { margin: 0.4em 0; padding-left: 1.4em; }
  li { margin: 0.15em 0; }
  blockquote { border-left: 2px solid #C8102E; margin: 0.6em 0; padding-left: 1em; color: #6B6B6B; }
  code { background: #F7F7F5; padding: 0.1em 0.3em; border-radius: 2px; font-size: 0.92em; }
  hr { border: none; border-top: 1px solid #DCDCDC; margin: 1.2em 0; }
  a { color: #C8102E; }
</style></head>
<body>
${html.join("\n")}
</body></html>`;
}
