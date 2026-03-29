import { requireUserId } from "@/lib/auth";
import { getUsers, getTrustConnections, getFriendRequestsForUser, getMachines, getAllMachineModels } from "@/lib/db";
import { AddFriendButton, RemoveFriendButton, InviteByEmail, PendingRequests } from "./NetworkActions";
import TopologyMap from "./TopologyMap";

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

  // Build set of user ids connected to current user
  const directTrustedIds = new Set(connections.map((c) => c.trustedUserId));
  const trustedByIds = new Set(
    allConnections
      .filter((c) => c.trustedUserId === userId)
      .map((c) => c.userId)
  );

  // Users in the trust network (for topology)
  const relevantIds = new Set([userId, ...directTrustedIds, ...trustedByIds]);
  const networkUsers = allUsers.filter((u) => relevantIds.has(u.id));
  const networkMachines = allMachines.filter((m) => relevantIds.has(m.ownerId));
  const networkMachineIds = new Set(networkMachines.map((m) => m.id));
  const networkModels = allModels.filter((m) => networkMachineIds.has(m.machineId));

  // Compute "other users" not in network
  const trustedIds = new Set(connections.map((c) => c.trustedUserId));
  // Only exclude users with INCOMING pending requests (shown in pending section)
  // Users with OUTGOING requests stay here — AddFriendButton shows "Pending" badge
  const incomingPendingUserIds = new Set(
    friendRequests
      .filter((fr) => fr.toUserId === userId && fr.status === "pending")
      .map((fr) => fr.fromUserId)
  );
  const otherUsers = allUsers.filter(
    (u) => u.id !== userId && !trustedIds.has(u.id) && !incomingPendingUserIds.has(u.id)
  );
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Trust Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your GPU sharing network — machines, models, and trust connections. Scroll to zoom, drag to pan.
        </p>
      </div>

      {/* Interactive Topology Map */}
      <TopologyMap
        currentUserId={userId}
        users={networkUsers}
        machines={networkMachines}
        models={networkModels}
        connections={allConnections.filter(
          (c) => relevantIds.has(c.userId) && relevantIds.has(c.trustedUserId)
        )}
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">{directTrustedIds.size}</div>
          <div className="text-xs text-muted-foreground mt-0.5">You trust</div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">{trustedByIds.size}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Trust you</div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 ring-1 ring-foreground/5 text-center">
          <div className="text-xl font-semibold font-mono tabular-nums">
            {[...directTrustedIds].filter((id) => trustedByIds.has(id)).length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Mutual</div>
        </div>
      </div>

      {/* Your Trusted People */}
      <div className="mt-10">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Your Trusted People ({connections.length})
        </h2>
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one in your network yet.</p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => {
              const trusted = userMap.get(conn.trustedUserId);
              return (
                <div key={conn.id} className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5">
                  <div>
                    <div className="font-medium text-sm text-foreground">{trusted?.name ?? conn.trustedUserId}</div>
                    {trusted?.email && <div className="text-xs text-muted-foreground">{trusted.email}</div>}
                  </div>
                  <RemoveFriendButton connectionId={conn.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>

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
