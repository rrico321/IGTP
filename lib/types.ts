export interface Machine {
  id: string;
  name: string;
  description: string;
  gpuModel: string;
  vramGb: number;
  cpuModel: string;
  ramGb: number;
  status: "available" | "busy" | "offline";
  ownerId: string;
  lastHeartbeatAt?: string | null;
  a1111Enabled: boolean;
  a1111Available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "request_approved" | "request_denied" | "request_submitted" | "friend_request";
  title: string;
  message: string;
  requestId: string | null;
  friendRequestId: string | null;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  machineId: string;
  requesterId: string;
  purpose: string;
  estimatedHours: number;
  status: "pending" | "approved" | "denied" | "completed" | "cancelled" | "expired";
  ownerNote?: string;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TrustConnection {
  id: string;
  userId: string;
  trustedUserId: string;
  createdAt: string;
}

export type GpuJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "timed_out";

export interface GpuJob {
  id: string;
  machineId: string;
  requesterId: string;
  requestId: string;
  command: string;
  dockerImage: string;
  priority: number;
  status: GpuJobStatus;
  maxRuntimeSec: number;
  vramLimitGb: number | null;
  cpuLimitCores: number | null;
  ramLimitGb: number | null;
  exitCode: number | null;
  outputLogUrl: string | null;
  outputLog: string | null;
  model: string | null;
  prompt: string | null;
  jobType: "chat" | "embedding";
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  conversationId: string | null;
  images: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobUsageSnapshot {
  id: string;
  jobId: string;
  sampledAt: string;
  gpuUtilPct: number | null;
  vramUsedGb: number | null;
  cpuUtilPct: number | null;
  ramUsedGb: number | null;
}

export interface Invite {
  id: string;
  token: string;
  inviterId: string;
  inviteeEmail: string;
  acceptedByUserId: string | null;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyPrefix: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface MachineModel {
  machineId: string;
  modelName: string;
  modelType: "chat" | "embedding";
  sizeBytes: number | null;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  machineId: string;
  requestId: string;
  model: string;
  title: string;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  jobId: string | null;
  tokens: number | null;
  tokensPerSec: number | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "denied";
  createdAt: string;
}

export interface A1111Session {
  id: string;
  machineId: string;
  requesterId: string;
  status: "pending" | "active" | "ended" | "failed" | "stop_requested";
  tunnelUrl: string | null;
  error: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  // KPI cards (always all-time, not filtered)
  networkSize: number;
  machinesOnline: number;
  totalModelsAvailable: number;

  // Time-filtered stats
  tokensUsed: number;
  tokensServed: number;
  conversationCount: number;
  jobsCompleted: number;

  // Your usage (time-filtered)
  topModelsUsed: Array<{
    model: string;
    jobCount: number;
    totalTokens: number;
  }>;

  // Your machines stats (time-filtered)
  myMachineStats: Array<{
    machineId: string;
    machineName: string;
    online: boolean;
    totalHoursServed: number;
    totalTokensProcessed: number;
    activeConnections: number;
    topModel: string | null;
  }>;

  // Network highlights (time-filtered)
  popularMachines: Array<{
    machineId: string;
    machineName: string;
    jobCount: number;
  }>;
  popularModels: Array<{
    model: string;
    jobCount: number;
  }>;

  // Pending actions (not filtered)
  pendingFriendRequests: Array<{
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserEmail: string;
    createdAt: string;
  }>;
  pendingAccessRequests: Array<{
    id: string;
    machineId: string;
    machineName: string;
    requesterId: string;
    requesterName: string;
    purpose: string;
    estimatedHours: number;
    createdAt: string;
  }>;

  // A1111 stats (time-filtered)
  a1111SessionCount: number;
  a1111TotalMinutes: number;

  // User's active connections (not filtered)
  activeConnections: Array<{
    requestId: string;
    machineId: string;
    machineName: string;
    expiresAt: string | null;
    approvedAt: string | null;
    purpose: string;
  }>;

  // User's pending outbound requests (not filtered)
  pendingOutboundRequests: Array<{
    requestId: string;
    machineId: string;
    machineName: string;
    purpose: string;
    estimatedHours: number;
    createdAt: string;
  }>;
}

export interface UsageReport {
  userId: string;
  from: string;
  to: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  timedOutJobs: number;
  totalRuntimeSec: number;
  avgGpuUtilPct: number | null;
  machineBreakdown: Array<{
    machineId: string;
    jobs: number;
    runtimeSec: number;
  }>;
}
