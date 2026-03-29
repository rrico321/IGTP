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
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "request_approved" | "request_denied" | "request_submitted";
  title: string;
  message: string;
  requestId: string | null;
  read: boolean;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  machineId: string;
  requesterId: string;
  purpose: string;
  estimatedHours: number;
  status: "pending" | "approved" | "denied" | "completed" | "cancelled";
  ownerNote?: string;
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
