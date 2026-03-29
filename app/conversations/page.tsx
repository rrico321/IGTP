import { requireUserId } from "@/lib/auth";
import {
  getConversationsByUser,
  getRequestsByRequester,
  getMachineById,
  getModelsForMachine,
} from "@/lib/db";
import { ConversationsView } from "./ConversationsView";

export default async function ConversationsPage() {
  const userId = await requireUserId();
  const conversations = await getConversationsByUser(userId);

  // Get approved machines and their models for "new conversation" dialog
  const requests = await getRequestsByRequester(userId);
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const machineIds = [...new Set(approvedRequests.map((r) => r.machineId))];
  const machines = (await Promise.all(machineIds.map((id) => getMachineById(id)))).filter(Boolean);

  const modelsByMachine: Record<string, Array<{ modelName: string; modelType: string }>> = {};
  for (const id of machineIds) {
    const models = await getModelsForMachine(id);
    modelsByMachine[id] = models.filter((m) => m.modelType === "chat"); // Only chat models for conversations
  }

  const approvedMachines = machines.map((m) => ({
    id: m!.id,
    name: m!.name,
    requestId: approvedRequests.find((r) => r.machineId === m!.id)!.id,
  }));

  return (
    <ConversationsView
      initialConversations={conversations}
      approvedMachines={approvedMachines}
      modelsByMachine={modelsByMachine}
    />
  );
}
