import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { MobileSyncService } from "../app/mobileServices";

export function SyncScreen({ syncService }: { syncService: MobileSyncService }) {
  const [statusMessage, setStatusMessage] = useState("Loading sync status...");
  const [rev, setRev] = useState(0);

  const refresh = useCallback(async () => {
    const status = await syncService.getStatus();
    setRev(status.serverRev);
    setStatusMessage(status.dirty ? "Local changes pending sync." : "Synced.");
  }, [syncService]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runSync = async () => {
    const result = await syncService.sync();
    if (result.status === "success") {
      setStatusMessage(`Synced successfully at ${result.updatedAt}`);
      setRev(result.serverRev);
      return;
    }

    if (result.status === "conflict") {
      setStatusMessage("Conflict detected. Resolving with server...");
      await syncService.resolve("fetch-server");
      await refresh();
      return;
    }

    setStatusMessage(`Sync failed: ${result.message}`);
  };

  return (
    <View style={{ display: "flex", gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>Sync status</Text>
      <Text>{statusMessage}</Text>
      <Text>Server revision: {rev}</Text>
      <Pressable
        onPress={() => {
          void runSync();
        }}
        style={{
          borderRadius: 8,
          backgroundColor: "#0d6efd",
          paddingVertical: 10,
          paddingHorizontal: 14,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Run sync</Text>
      </Pressable>
    </View>
  );
}
