"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { User, Machine, MachineModel, TrustConnection } from "@/lib/types";

interface TopologyProps {
  currentUserId: string;
  users: User[];
  machines: Machine[];
  models: MachineModel[];
  connections: TrustConnection[];
}

// Layout constants
const USER_R = 26;
const MACHINE_W = 150;
const MACHINE_H = 44;
const MODEL_LINE_H = 18;
const LEVEL_GAP = 100;
const USER_GAP = 220;
const MACHINE_GAP = 170;
const PADDING = 60;

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function nodeHue(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return hash % 360;
}

function isOnline(machine: Machine): boolean {
  if (!machine.lastHeartbeatAt) return false;
  const diff = Date.now() - new Date(machine.lastHeartbeatAt).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

interface LayoutNode {
  type: "user" | "machine";
  id: string;
  label: string;
  x: number;
  y: number;
  parentId?: string;
  user?: User;
  machine?: Machine;
  models?: MachineModel[];
  isCurrentUser?: boolean;
  online?: boolean;
  hue: number;
}

function computeLayout(props: TopologyProps): { nodes: LayoutNode[]; edges: Array<{ from: string; to: string; mutual: boolean }>; width: number; height: number } {
  const { currentUserId, users, machines, models, connections } = props;
  const nodes: LayoutNode[] = [];
  const edges: Array<{ from: string; to: string; mutual: boolean }> = [];

  // Build model map
  const modelsByMachine = new Map<string, MachineModel[]>();
  for (const m of models) {
    if (!modelsByMachine.has(m.machineId)) modelsByMachine.set(m.machineId, []);
    modelsByMachine.get(m.machineId)!.push(m);
  }

  // Build machine map by owner
  const machinesByOwner = new Map<string, Machine[]>();
  for (const m of machines) {
    if (!machinesByOwner.has(m.ownerId)) machinesByOwner.set(m.ownerId, []);
    machinesByOwner.get(m.ownerId)!.push(m);
  }

  // Find connected user IDs
  const outgoing = new Set(connections.filter((c) => c.userId === currentUserId).map((c) => c.trustedUserId));
  const incoming = new Set(connections.filter((c) => c.trustedUserId === currentUserId).map((c) => c.userId));
  const connectedIds = new Set([...outgoing, ...incoming]);

  const currentUser = users.find((u) => u.id === currentUserId);
  if (!currentUser) return { nodes: [], edges: [], width: 400, height: 300 };

  const connectedUsers = users.filter((u) => connectedIds.has(u.id));

  // Compute width needed per user (based on their machines)
  function userWidth(u: User): number {
    const userMachines = machinesByOwner.get(u.id) || [];
    if (userMachines.length === 0) return MACHINE_GAP;
    return userMachines.length * MACHINE_GAP;
  }

  // Layout level 0: current user
  const totalConnectedWidth = connectedUsers.length > 0
    ? connectedUsers.reduce((acc, u) => acc + Math.max(userWidth(u), USER_GAP), 0)
    : 0;
  const currentUserWidth = userWidth(currentUser);
  const totalWidth = Math.max(totalConnectedWidth, currentUserWidth, 400);

  const centerX = totalWidth / 2 + PADDING;

  // Current user at top
  nodes.push({
    type: "user",
    id: currentUser.id,
    label: currentUser.name,
    x: centerX,
    y: PADDING + USER_R,
    user: currentUser,
    isCurrentUser: true,
    hue: nodeHue(currentUser.id),
  });

  // Current user's machines
  const myMachines = machinesByOwner.get(currentUserId) || [];
  const myMachineY = PADDING + USER_R + LEVEL_GAP;
  const myMachineStartX = centerX - ((myMachines.length - 1) * MACHINE_GAP) / 2;
  myMachines.forEach((machine, i) => {
    const mx = myMachineStartX + i * MACHINE_GAP;
    const mModels = modelsByMachine.get(machine.id) || [];
    nodes.push({
      type: "machine",
      id: machine.id,
      label: machine.name,
      x: mx,
      y: myMachineY,
      parentId: currentUserId,
      machine,
      models: mModels,
      online: isOnline(machine),
      hue: nodeHue(currentUserId),
    });
  });

  // Level 1: connected users
  const connectedY = PADDING + USER_R + LEVEL_GAP * (myMachines.length > 0 ? 2.5 : 1.5);
  let connectedX = centerX - totalConnectedWidth / 2;

  connectedUsers.forEach((user) => {
    const w = Math.max(userWidth(user), USER_GAP);
    const ux = connectedX + w / 2;
    connectedX += w;

    const mutual = outgoing.has(user.id) && incoming.has(user.id);

    nodes.push({
      type: "user",
      id: user.id,
      label: user.name,
      x: ux,
      y: connectedY,
      user,
      isCurrentUser: false,
      hue: nodeHue(user.id),
    });

    edges.push({ from: currentUserId, to: user.id, mutual });

    // This user's machines
    const userMachines = machinesByOwner.get(user.id) || [];
    const machineY = connectedY + LEVEL_GAP;
    const machineStartX = ux - ((userMachines.length - 1) * MACHINE_GAP) / 2;
    userMachines.forEach((machine, i) => {
      const mx = machineStartX + i * MACHINE_GAP;
      const mModels = modelsByMachine.get(machine.id) || [];
      nodes.push({
        type: "machine",
        id: machine.id,
        label: machine.name,
        x: mx,
        y: machineY,
        parentId: user.id,
        machine,
        models: mModels,
        online: isOnline(machine),
        hue: nodeHue(user.id),
      });
    });
  });

  // Compute max height from model lists
  let maxY = connectedY + LEVEL_GAP;
  for (const node of nodes) {
    if (node.type === "machine" && node.models) {
      const bottom = node.y + MACHINE_H / 2 + node.models.length * MODEL_LINE_H + 20;
      maxY = Math.max(maxY, bottom);
    }
  }

  return {
    nodes,
    edges,
    width: totalWidth + PADDING * 2,
    height: maxY + PADDING,
  };
}

export default function TopologyMap(props: TopologyProps) {
  const { nodes, edges, width, height } = computeLayout(props);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fit to container on mount
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const s = Math.min(scaleX, scaleY, 1);
    const tx = (rect.width - width * s) / 2;
    const ty = 0;
    setTransform({ x: tx, y: ty, scale: s });
  }, [width, height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.2), 3);
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
      };
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [transform.x, transform.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTransform((prev) => ({ ...prev, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Build a position map for edge drawing
  const posMap = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));

  if (nodes.length <= 1 && edges.length === 0) {
    return (
      <div className="text-center px-8 py-16 border border-border rounded-xl bg-card/30">
        <p className="text-muted-foreground text-sm mb-3">
          Your network is empty. Add trusted people to see the topology here.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-card border border-border rounded-xl overflow-hidden ring-1 ring-foreground/5 select-none"
      style={{ height: Math.min(height * 0.85, 600), minHeight: 320 }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Network topology"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Trust edges between users */}
          {edges.map((edge) => {
            const from = posMap.get(edge.from);
            const to = posMap.get(edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={`trust-${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.mutual ? "hsl(var(--foreground) / 0.3)" : "hsl(var(--foreground) / 0.15)"}
                strokeWidth={edge.mutual ? 2 : 1.5}
                strokeDasharray={edge.mutual ? undefined : "6 4"}
              />
            );
          })}

          {/* Machine-to-owner edges */}
          {nodes.filter((n) => n.type === "machine" && n.parentId).map((node) => {
            const parent = posMap.get(node.parentId!);
            if (!parent) return null;
            return (
              <line
                key={`link-${node.parentId}-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke={`hsl(${node.hue} 40% 40% / 0.4)`}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;

            if (node.type === "user") {
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onPointerEnter={() => setHoveredNode(node.id)}
                  onPointerLeave={() => setHoveredNode(null)}
                  style={{ cursor: "default" }}
                >
                  {/* Glow ring */}
                  {(node.isCurrentUser || isHovered) && (
                    <circle
                      r={USER_R + 6}
                      fill={`hsl(${node.hue} 60% 50% / 0.08)`}
                      stroke={`hsl(${node.hue} 60% 60% / 0.3)`}
                      strokeWidth={1}
                    />
                  )}
                  <circle
                    r={USER_R}
                    fill={`hsl(${node.hue} 50% 20%)`}
                    stroke={`hsl(${node.hue} 60% 50% / ${node.isCurrentUser ? "0.8" : "0.4"})`}
                    strokeWidth={node.isCurrentUser ? 2 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={node.isCurrentUser ? 12 : 11}
                    fontWeight={node.isCurrentUser ? "700" : "500"}
                    fill={`hsl(${node.hue} 70% 80%)`}
                    fontFamily="var(--font-geist-sans), sans-serif"
                    pointerEvents="none"
                  >
                    {getInitials(node.label)}
                  </text>
                  <text
                    y={USER_R + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fill="hsl(var(--foreground) / 0.7)"
                    fontFamily="var(--font-geist-sans), sans-serif"
                    pointerEvents="none"
                  >
                    {node.isCurrentUser ? `${node.label} (you)` : node.label}
                  </text>
                </g>
              );
            }

            // Machine node
            const mModels = node.models || [];
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onPointerEnter={() => setHoveredNode(node.id)}
                onPointerLeave={() => setHoveredNode(null)}
                style={{ cursor: "default" }}
              >
                {/* Machine rect */}
                <rect
                  x={-MACHINE_W / 2}
                  y={-MACHINE_H / 2}
                  width={MACHINE_W}
                  height={MACHINE_H}
                  rx={10}
                  fill={`hsl(${node.hue} 30% 14%)`}
                  stroke={`hsl(${node.hue} 40% 35% / ${isHovered ? "0.7" : "0.4"})`}
                  strokeWidth={1.5}
                />
                {/* Status dot */}
                <circle
                  cx={-MACHINE_W / 2 + 16}
                  cy={0}
                  r={4}
                  fill={node.online ? "#22c55e" : "#71717a"}
                />
                {/* Machine name */}
                <text
                  x={-MACHINE_W / 2 + 28}
                  y={1}
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight="600"
                  fill={`hsl(${node.hue} 50% 75%)`}
                  fontFamily="var(--font-geist-sans), sans-serif"
                  pointerEvents="none"
                >
                  {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                </text>

                {/* Models list below machine */}
                {mModels.length > 0 && (
                  <g>
                    {mModels.map((model, i) => (
                      <text
                        key={model.modelName}
                        x={0}
                        y={MACHINE_H / 2 + 14 + i * MODEL_LINE_H}
                        textAnchor="middle"
                        fontSize={10}
                        fill="hsl(var(--muted-foreground) / 0.7)"
                        fontFamily="var(--font-geist-mono), monospace"
                        pointerEvents="none"
                      >
                        {model.modelName.length > 20 ? model.modelName.slice(0, 19) + "…" : model.modelName}
                      </text>
                    ))}
                  </g>
                )}
                {mModels.length === 0 && (
                  <text
                    x={0}
                    y={MACHINE_H / 2 + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="hsl(var(--muted-foreground) / 0.4)"
                    fontFamily="var(--font-geist-sans), sans-serif"
                    fontStyle="italic"
                    pointerEvents="none"
                  >
                    no models
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
