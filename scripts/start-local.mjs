/**
 * Local dev: optional STT (Whisper on :8001) + Next.js (:3000).
 * Usage: node scripts/start-local.mjs
 *         node scripts/start-local.mjs --no-stt   # only Next (no microphone pipeline)
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sttDir = path.join(root, "stt-service");
const isWin = process.platform === "win32";
const noStt = process.argv.includes("--no-stt");

function findPython() {
  const candidates = isWin ? ["py -3", "python", "python3"] : ["python3", "python"];
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe", shell: true });
      return cmd;
    } catch {
      /* try next */
    }
  }
  return null;
}

function venvPythonPath() {
  return isWin
    ? path.join(sttDir, ".venv", "Scripts", "python.exe")
    : path.join(sttDir, ".venv", "bin", "python");
}

function ensureSttVenv(pythonCmd) {
  const py = venvPythonPath();
  if (fs.existsSync(py)) return py;

  console.info("[start-local] Creating Python venv in stt-service/ …");
  execSync(`${pythonCmd} -m venv .venv`, { cwd: sttDir, stdio: "inherit", shell: true });
  if (!fs.existsSync(py)) {
    throw new Error(`Expected venv python at ${py}`);
  }
  const req = path.join(sttDir, "requirements.txt");
  console.info("[start-local] pip install -r stt-service/requirements.txt (first run can take a while) …");
  execSync(`"${py}" -m pip install -r "${req}"`, { cwd: sttDir, stdio: "inherit", shell: true });
  return py;
}

function main() {
  if (!fs.existsSync(path.join(root, "package.json"))) {
    console.error("[start-local] Run from repo root (package.json not found).");
    process.exit(1);
  }

  let sttProc = null;

  const shutdown = () => {
    if (sttProc && !sttProc.killed) {
      sttProc.kill("SIGTERM");
      sttProc = null;
    }
  };

  if (!noStt) {
    if (!fs.existsSync(path.join(sttDir, "main.py"))) {
      console.warn("[start-local] stt-service/main.py missing — skipping STT.");
    } else {
      const pythonCmd = findPython();
      if (!pythonCmd) {
        console.warn(
          "[start-local] Python 3 not found on PATH — start with --no-stt or install Python. See README.",
        );
        process.exit(1);
      }
      try {
        const py = ensureSttVenv(pythonCmd);
        console.info("[start-local] STT: uvicorn on http://127.0.0.1:8001 …");
        sttProc = spawn(py, ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"], {
          cwd: sttDir,
          stdio: "inherit",
          shell: false,
          env: process.env,
        });
        sttProc.on("error", (err) => {
          console.error("[start-local] STT process error:", err.message);
        });
        sttProc.on("exit", (code, sig) => {
          if (code && code !== 0 && sig == null) {
            console.error(`[start-local] STT exited with code ${code}. Mic may not work; Next.js keeps running.`);
          }
        });
      } catch (e) {
        console.error("[start-local] STT setup failed:", e instanceof Error ? e.message : e);
        process.exit(1);
      }
    }
  } else {
    console.info("[start-local] --no-stt: skipping Whisper service (mic → transcribe will fail until STT is up).");
  }

  const npmCmd = isWin ? "npm.cmd" : "npm";
  console.info("[start-local] Next.js: http://localhost:3000 (Ctrl+C stops dev server" + (sttProc ? " and STT" : "") + ") …\n");

  const next = spawn(npmCmd, ["run", "dev"], {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    env: process.env,
  });

  next.on("error", (err) => {
    console.error("[start-local] npm run dev failed:", err.message);
    shutdown();
    process.exit(1);
  });

  const onExit = () => {
    shutdown();
    try {
      next.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);

  next.on("close", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });
}

main();
