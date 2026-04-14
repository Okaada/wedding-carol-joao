import { getMongoClient } from "@/lib/mongodb";
import { getTodayMpErrorCount } from "@/lib/mp-errors";

const ERROR_THRESHOLD = 3;

export interface PanicModeStatus {
  active: boolean;
  manualEnabled: boolean;
  enabledAt: string | null;
  todayErrorCount: number;
  autoTriggered: boolean;
}

export async function getPanicModeStatus(): Promise<PanicModeStatus> {
  const client = await getMongoClient();
  const doc = await client
    .db("carol-joao")
    .collection("settings")
    .findOne({ key: "panic_mode" });

  const manualEnabled = doc?.value?.enabled === true;
  const enabledAt = doc?.value?.enabledAt ?? null;
  const todayErrorCount = await getTodayMpErrorCount();
  const autoTriggered = todayErrorCount >= ERROR_THRESHOLD;

  return {
    active: manualEnabled || autoTriggered,
    manualEnabled,
    enabledAt,
    todayErrorCount,
    autoTriggered,
  };
}

export async function isPanicModeActive(): Promise<boolean> {
  const status = await getPanicModeStatus();
  return status.active;
}
