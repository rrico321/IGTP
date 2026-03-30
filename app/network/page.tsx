import { requireUserId } from "@/lib/auth";
import { getUsers, getTrustConnections, getFriendRequestsForUser, getMachines, getAllMachineModels } from "@/lib/db";
import { AddFriendButton, RemoveFriendButton, InviteByEmail, PendingRequests } from "./NetworkActions";
import type { Machine, MachineModel } from "@/lib/types";

function isOnline(machine: Machine): boolean {
  if (!machine.lastHeartbeatAt) return false;
  return Date.now() - new Date(machine.lastHeartbeatAt).getTime() < 5 * 60 * 1000;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / 1e6).toFixed(0)}MB`;
}

export default async function NetworkPage() {
  const userId = await requireUserId();
  const [allUsers, allConnections, friendRequests, allMachines, allModels] = await Promise.all([
    getUsers(),
    getTrustConnections(),
    getFriendRequestsForUser(userId),
    getMachines(),
    getAllMachineModels(),
  ]);

  // Current user's outgoing trust connections
  const connections = allConnections.filter((c) => c.userId === userId);

  const directTrustedIds = new Set(connections.map((c) => c.trustedUserId));
  const trustedByIds = new Set(
    allConnections.filter((c) => c.trustedUserId === userId).map((c) => c.userId)
  );

  // Build lookup maps
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const machinesByOwner = new Map<string, Machine[]>();
  for (const m of allMachines) {
    if (!machinesByOwner.has(m.ownerId)) machinesByOwner.set(m.ownerId, []);
    machinesByOwner.get(m.ownerId)!.push(m);
  }
  const modelsByMachine = new Map<string, MachineModel[]>();
  for (const m of allModels) {
    if (!modelsByMachine.has(m.machineId)) modelsByMachine.set(m.machineId, []);
    modelsByMachine.get(m.machineId)!.push(m);
  }

  // Friends = users you trust (outgoing connections)
  const friends = connections.map((conn) => {
    const user = userMap.get(conn.trustedUserId);
    const mutual = trustedByIds.has(conn.trustedUserId);
    const machines = machinesByOwner.get(conn.trustedUserId) || [];
    return { conn, user, mutual, machines };
  });

  // Other users not in network
  const trustedIds = new Set(connections.map((c) => c.trustedUserId));
  const incomingPendingUserIds = new Set(
    friendRequests
      .filter((fr) => fr.toUserId === userId && fr.status === "pending")
      .map((fr) => fr.fromUserId)
  );
  const otherUsers = allUsers.filter(
    (u) => u.id !== userId && !trustedIds.has(u.id) && !incomingPendingUserIds.has(u.id)
  );

  // Incoming pending requests
  const incomingPending = friendRequests.filter(
    (fr) => fr.toUserId === userId && fr.status === "pending"
  );
  const pendingUsersMap = new Map(
    incomingPending.map((fr) => {
      const user = userMap.get(fr.fromUserId);
      return [fr.fromUserId, { name: user?.name ?? "Unknown", email: user?.email ?? "" }];
    })
  );

  // Total models across all friends' machines
  const totalModels = friends.reduce((acc, f) =>
    acc + f.machines.reduce((a, m) => a + (modelsByMachine.get(m.id)?.length || 0), 0), 0
  );
  const totalMachines = friends.reduce((acc, f) => acc + f.machines.length, 0);
  const onlineMachines = friends.reduce((acc, f) =>
    acc + f.machines.filter(isOnline).length, 0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Trust Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Friends in your network, their machines, and available models.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">{friends.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Friends</div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">{totalMachines}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Machines</div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums text-green-400">{onlineMachines}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Online</div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">{totalModels}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Models</div>
        </div>
      </div>

      {/* Network — friend cards with machines + models */}
      {friends.length === 0 ? (
        <div className="text-center px-8 py-16 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground text-sm">
            Your network is empty. Add people below or invite friends to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {friends.map(({ conn, user, mutual, machines }) => (
            <div key={conn.id} className="bg-card border border-border rounded-xl ring-1 ring-foreground/5 overflow-hidden">
              {/* Friend header */}
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-foreground">{user?.name ?? conn.trustedUserId}</div>
                  {user?.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
                  {mutual ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">Mutual</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground font-medium">One-way</span>
                  )}
                </div>
                <RemoveFriendButton connectionId={conn.id} />
              </div>

              {/* Machines */}
              {machines.length > 0 ? (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {machines.map((machine) => {
                    const online = isOnline(machine);
                    const models = modelsByMachine.get(machine.id) || [];
                    return (
                      <div key={machine.id} className="px-5 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-zinc-600"}`} />
                          <span className="text-sm font-medium text-foreground">{machine.name}</span>
                          <span className="text-xs text-muted-foreground">{machine.gpuModel} / {machine.vramGb}GB</span>
                          <span className={`text-[10px] ml-auto ${online ? "text-green-400" : "text-muted-foreground/50"}`}>
                            {online ? "online" : "offline"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-4">
                          {machine.a1111Enabled && (
                            <span className={`inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 font-medium ${
                              machine.a1111Available
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-purple-500/5 text-purple-400/50 border border-purple-500/10"
                            }`}>
                              A1111 {machine.a1111Available ? "available" : "at capacity"}
                            </span>
                          )}
                          {models.map((model) => (
                            <span
                              key={model.modelName}
                              className="inline-flex items-center gap-1 text-xs font-mono bg-foreground/5 text-foreground/70 rounded px-2 py-0.5"
                            >
                              {model.modelName}
                              {model.sizeBytes ? (
                                <span className="text-muted-foreground/50">{formatSize(model.sizeBytes)}</span>
                              ) : null}
                            </span>
                          ))}
                        </div>
                        {!machine.a1111Enabled && models.length === 0 && (
                          <p className="text-xs text-muted-foreground/40 italic ml-4 mt-1">No models synced</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-t border-border/50 px-5 py-3">
                  <p className="text-xs text-muted-foreground/40 italic">No machines registered</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pending Friend Requests */}
      {incomingPending.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Pending Friend Requests ({incomingPending.length})
          </h2>
          <PendingRequests requests={incomingPending} users={pendingUsersMap} />
        </div>
      )}

      {/* People on IGTP */}
      <div className="mt-10">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          People on IGTP
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Add people to your network so you can see their machines and they can see yours.
        </p>
        {otherUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone on IGTP is already in your network!</p>
        ) : (
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5">
                <div>
                  <div className="font-medium text-sm text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <AddFriendButton userId={user.id} friendRequests={friendRequests} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite by Email */}
      <div className="mt-10">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Invite Someone New
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Know someone who isn't on IGTP yet? Send them an email invite. When they join, you'll both be added to each other's network.
        </p>
        <InviteByEmail />
      </div>
    </div>
  );
}
