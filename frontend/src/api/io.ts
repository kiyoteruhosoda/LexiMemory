// frontend/src/api/io.ts
/**
 * Import/Export API functions for backing up and restoring user data.
 */

import type { AppData, AppDataForImport } from "./types";
import { api } from "./client";

/**
 * Export all user data (words and memory states)
 */
export async function exportData(): Promise<AppData> {
  return api.get<AppData>("/io/export");
}

/**
 * Import user data from a backup file
 * Supports both complete exported data and manually-created files with optional fields.
 * 
 * @param data AppDataForImport object to import (flexible format)
 * @param mode "overwrite" to replace all data, "merge" to combine with existing data
 */
export async function importData(data: AppDataForImport, mode: "overwrite" | "merge" = "merge"): Promise<void> {
  await api.post<{ ok: boolean }>(`/io/import?mode=${mode}`, data);
}
