import { requireUserId } from "@/lib/auth";
import { getUsers, getTrustConnections } from "@/lib/db";
import { AddFriendButton, RemoveFriendButton, InviteByEmail } from "./NetworkActions";

const W = 560;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const R = 160; // radius for outer nodes
const NODE_R = 22;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Assign a deterministic hue per user id
function nodeHue(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return hash % 360;
}

export default async function NetworkPage() {
  const userId = await requireUserId();
  const [allUsers, allConnections] = await Promise.all([
    getUsers(),
    getTrustConnections(),
  ]);

  // Current user's outgoing trust connections
  const connections = allConnections.filter((c) => c.userId === userId);

  // Build set of user ids connected (directly or indirectly) to the current user
  const directTrustedIds = new Set(
    connections.map((c) => c.trustedUserId)
  );
  const trustedByIds = new Set(
    allConnections
      .filter((c) => c.trustedUserId === userId)
      .map((c) => c.userId)
  );

  // Nodes: current user + everyone in their direct network
  const relevantIds = new Set([userId, ...directTrustedIds, ...trustedByIds]);
  const nodes = allUsers.filter((u) => relevantIds.has(u.id));

  // Position: current user at center, others in a circle
  const others = nodes.filter((u) => u.id !== userId);
  const positions = new Map<string, { x: number; y: number }>();
  positions.set(userId, { x: CX, y: CY });
  others.forEach((u, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2;
    positions.set(u.id, {
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    });
  });

  // Edges: only between relevant nodes
  const edges = allConnections.filter(
    (c) => relevantIds.has(c.userId) && relevantIds.has(c.trustedUserId)
  );

  // Deduplicate bidirectional edges for drawing
  const drawnEdges = new Set<string>();
  const uniqueEdges = edges.filter((c) => {
    const key = [c.userId, c.trustedUserId].sort().join("|");
    if (drawnEdges.has(key)) return false;
    drawnEdges.add(key);
    return true;
  });

  const isMutual = (a: string, b: string) =>
    allConnections.some((c) => c.userId === a && c.trustedUserId === b) &&
    allConnections.some((c) => c.userId === b && c.trustedUserId === a);

  // Compute "other users" not in network
  const trustedIds = new Set(connections.map((c) => c.trustedUserId));
  const otherUsers = allUsers.filter((u) => u.id !== userId && !trustedIds.has(u.id));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Trust Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your GPU sharing network — solid lines are mutual trust, dashed lines are one-way.
        </p>
      </div>

      {nodes.length <= 1 ? (
        <div className="text-center px-8 py-16 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground text-sm mb-3">
            Your network is empty. Invite friends or add trusted users to see the graph here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden ring-1 ring-foreground/5">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            className="block"
            aria-label="Trust network graph"
          >
            {/* Edges */}
            {uniqueEdges.map((edge) => {
              const from = positions.get(edge.userId);
              const to = positions.get(edge.trustedUserId);
              if (!from || !to) return null;
              const mutual = isMutual(edge.userId, edge.trustedUserId);
              return (
                <line
                  key={`${edge.userId}-${edge.trustedUserId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={mutual ? "hsl(var(--foreground) / 0.4)" : "hsl(var(--foreground) / 0.2)"}
                  strokeWidth={mutual ? 2 : 1.5}
                  strokeDasharray={mutual ? undefined : "4 3"}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((user) => {
              const pos = positions.get(user.id);
              if (!pos) return null;
              const isMe = user.id === userId;
              const hue = nodeHue(user.id);

              return (
                <g key={user.id} transform={`translate(${pos.x},${pos.y})`}>
                  {/* Glow for current user */}
                  {isMe && (
                    <circle
                      r={NODE_R + 6}
                      fill={`hsl(${hue} 60% 50% / 0.08)`}
                      stroke={`hsl(${hue} 60% 60% / 0.3)`}
                      strokeWidth={1}
                    />
                  )}
                  <circle
                    r={NODE_R}
                    fill={`hsl(${hue} 50% 20%)`}
                    stroke={`hsl(${hue} 60% 50% / ${isMe ? "0.8" : "0.4"})`}
                    strokeWidth={isMe ? 2 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isMe ? 11 : 10}
                    fontWeight={isMe ? "700" : "500"}
                    fill={`hsl(${hue} 70% 80%)`}
                    fontFamily="var(--font-geist-sans), sans-serif"
                    pointerEvents="none"
                  >
                    {getInitials(user.name)}
                  </text>
                  {/* Name label below node */}
                  <text
                    y={NODE_R + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="hsl(var(--muted-foreground))"
                    fontFamily="var(--font-geist-sans), sans-serif"
                    pointerEvents="none"
                  >
                    {isMe ? `${user.name} (you)` : user.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

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
                <AddFriendButton userId={user.id} />
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
