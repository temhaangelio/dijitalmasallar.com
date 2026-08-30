import "server-only";

export type AiScanState = {
  status: "idle" | "running" | "completed" | "failed";
  message: string;
  startedAt: string | null;
  finishedAt: string | null;
};

const jobKey = Symbol.for("diji.news/ai-news-scan-job");
type JobHolder = { [jobKey]?: AiScanState };

function holder() {
  return globalThis as JobHolder;
}

export function getAiScanState(): AiScanState {
  return holder()[jobKey] ?? { status: "idle", message: "", startedAt: null, finishedAt: null };
}

export function beginAiScan() {
  if (getAiScanState().status === "running") return false;
  holder()[jobKey] = { status: "running", message: "Resmî kaynaklar taranıyor…", startedAt: new Date().toISOString(), finishedAt: null };
  return true;
}

export function finishAiScan(status: "completed" | "failed", message: string) {
  const current = getAiScanState();
  holder()[jobKey] = { ...current, status, message, finishedAt: new Date().toISOString() };
}
