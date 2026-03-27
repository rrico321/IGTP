import fs from "fs";
import path from "path";
import type { Machine, AccessRequest, User, TrustConnection } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readFile<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw) as T[];
}

function writeFile<T>(filename: string, data: T[]): void {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

// Machines
export function getMachines(): Machine[] {
  return readFile<Machine>("machines.json");
}

export function getMachineById(id: string): Machine | undefined {
  return getMachines().find((m) => m.id === id);
}

export function createMachine(data: Omit<Machine, "id" | "createdAt" | "updatedAt">): Machine {
  const machines = getMachines();
  const machine: Machine = {
    ...data,
    id: `machine-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  machines.push(machine);
  writeFile("machines.json", machines);
  return machine;
}

export function updateMachine(id: string, updates: Partial<Omit<Machine, "id" | "createdAt">>): Machine | null {
  const machines = getMachines();
  const idx = machines.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  machines[idx] = { ...machines[idx], ...updates, updatedAt: new Date().toISOString() };
  writeFile("machines.json", machines);
  return machines[idx];
}

// Access Requests
export function getRequests(): AccessRequest[] {
  return readFile<AccessRequest>("requests.json");
}

export function getRequestById(id: string): AccessRequest | undefined {
  return getRequests().find((r) => r.id === id);
}

export function getRequestsByMachine(machineId: string): AccessRequest[] {
  return getRequests().filter((r) => r.machineId === machineId);
}

export function getRequestsByRequester(requesterId: string): AccessRequest[] {
  return getRequests().filter((r) => r.requesterId === requesterId);
}

export function createRequest(data: Omit<AccessRequest, "id" | "status" | "createdAt" | "updatedAt">): AccessRequest {
  const requests = getRequests();
  const request: AccessRequest = {
    ...data,
    id: `request-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.push(request);
  writeFile("requests.json", requests);
  return request;
}

export function updateRequest(
  id: string,
  updates: Partial<Omit<AccessRequest, "id" | "machineId" | "requesterId" | "createdAt">>
): AccessRequest | null {
  const requests = getRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], ...updates, updatedAt: new Date().toISOString() };
  writeFile("requests.json", requests);
  return requests[idx];
}

// Users
export function getUsers(): User[] {
  return readFile<User>("users.json");
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(name: string): User {
  const users = getUsers();
  const slug = name.toLowerCase().replace(/\s+/g, ".");
  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email: `${slug}@example.com`,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeFile("users.json", users);
  return user;
}

// Trust Connections
export function getTrustConnections(): TrustConnection[] {
  return readFile<TrustConnection>("trust.json");
}

export function getTrustedUserIds(userId: string): string[] {
  return getTrustConnections()
    .filter((t) => t.userId === userId)
    .map((t) => t.trustedUserId);
}

export function isTrusted(userId: string, trustedUserId: string): boolean {
  return getTrustConnections().some(
    (t) => t.userId === userId && t.trustedUserId === trustedUserId
  );
}

export function addTrustConnection(userId: string, trustedUserId: string): TrustConnection | null {
  if (userId === trustedUserId) return null;
  if (isTrusted(userId, trustedUserId)) return null;
  const connections = getTrustConnections();
  const connection: TrustConnection = {
    id: `trust-${Date.now()}`,
    userId,
    trustedUserId,
    createdAt: new Date().toISOString(),
  };
  connections.push(connection);
  writeFile("trust.json", connections);
  return connection;
}

export function removeTrustConnection(id: string, userId: string): boolean {
  const connections = getTrustConnections();
  const idx = connections.findIndex((t) => t.id === id && t.userId === userId);
  if (idx === -1) return false;
  connections.splice(idx, 1);
  writeFile("trust.json", connections);
  return true;
}
