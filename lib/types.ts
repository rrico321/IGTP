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
