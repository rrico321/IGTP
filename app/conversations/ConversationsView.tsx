"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Trash2, Send, Loader2, Lock } from "lucide-react";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import type { Conversation, ConversationMessage } from "@/lib/types";

interface ApprovedMachine {
  id: string;
  name: string;
  requestId: string;
}

interface Props {
  initialConversations: Conversation[];
  approvedMachines: ApprovedMachine[];
  modelsByMachine: Record<string, Array<{ modelName: string; modelType: string }>>;
  activeMachineIds: string[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


export function ConversationsView({
  initialConversations,
  approvedMachines,
  modelsByMachine,
  activeMachineIds,
}: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newMachineId, setNewMachineId] = useState(approvedMachines[0]?.id ?? "");
  const [newModel, setNewModel] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const accessExpired = activeConversation
    ? !activeMachineIds.includes(activeConversation.machineId)
    : false;

  // Auto-select first model when machine changes
  useEffect(() => {
    const models = modelsByMachine[newMachineId] ?? [];
    setNewModel(models[0]?.modelName ?? "");
  }, [newMachineId, modelsByMachine]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setSendError(null);
    fetch(`/api/conversations/${activeId}/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(() => {});
  }, [activeId]);

  // Poll for assistant response when waiting
  useEffect(() => {
    if (!waitingForResponse || !activeId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${activeId}/messages`);
      const msgs: ConversationMessage[] = await res.json();
      setMessages(msgs);
      // Check if we got an assistant response
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === "assistant") {
        setWaitingForResponse(false);
        // Refresh conversation list for updated token count
        const convRes = await fetch("/api/conversations");
        const convs = await convRes.json();
        setConversations(convs);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [waitingForResponse, activeId]);

  async function createConversation() {
    if (!newMachineId || !newModel) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId: newMachineId, model: newModel }),
    });
    if (!res.ok) {
      const data = await res.json();
      setSendError(data.error || "Failed to create conversation");
      setShowNewDialog(false);
      return;
    }
    const conv = await res.json();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMessages([]);
    setShowNewDialog(false);
    setSendError(null);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || sending || accessExpired) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setSendError(null);

    // Optimistically add user message
    const tempMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeId,
      role: "user",
      content,
      jobId: null,
      tokens: null,
      tokensPerSec: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      } else {
        setWaitingForResponse(true);
      }
    } catch {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function deleteConv(convId: string) {
    if (!confirm("Delete this conversation?")) return;
    await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeId === convId) {
      setActiveId(null);
      setMessages([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col shrink-0 bg-card/50">
        <div className="p-3 border-b border-border">
          <button
            onClick={() => setShowNewDialog(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No conversations yet. Click &quot;New Chat&quot; to start.
            </p>
          )}
          {conversations.map((conv) => {
            const expired = !activeMachineIds.includes(conv.machineId);
            return (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${
                  activeId === conv.id ? "bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => setActiveId(conv.id)}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${expired ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${expired ? "text-muted-foreground/50" : "text-foreground"}`}>{conv.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {conv.model} · {conv.totalTokens.toLocaleString()} tokens
                    {expired && <span className="text-red-400 ml-1">· expired</span>}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConv(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeId ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground mb-2">Start a conversation</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Chat with Ollama models running on machines in your trust network.
              </p>
              {approvedMachines.length > 0 ? (
                <button
                  onClick={() => setShowNewDialog(true)}
                  className="px-4 py-2 text-sm bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
                >
                  New Chat
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  You need approved access to a machine first. Go to Browse to request access.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-foreground truncate">{activeConversation?.title}</h2>
                  {accessExpired && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Access expired
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeConversation?.model} · {activeConversation?.totalTokens.toLocaleString()} tokens used
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Send a message to start the conversation.
                </p>
              )}
              {messages.map((msg) => {
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-foreground text-background"
                          : "bg-card border border-border"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <MarkdownContent content={msg.content} />
                      )}
                      <div className={`flex items-center gap-2 mt-1 text-[10px] ${
                        msg.role === "user" ? "text-background/50" : "text-muted-foreground"
                      }`}>
                        {msg.tokens != null && (
                          <span>{msg.tokens.toLocaleString()} tokens</span>
                        )}
                        {msg.tokensPerSec != null && (
                          <span>· {msg.tokensPerSec} tok/s</span>
                        )}
                        {msg.createdAt && !msg.id.startsWith("temp-") && (
                          <span>· {formatTime(msg.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {waitingForResponse && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{activeConversation?.model} is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {sendError && (
              <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
                <p className="text-xs text-red-400">{sendError}</p>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              {accessExpired ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Your access to this machine has expired. Request new access to continue chatting.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    className="flex-1 bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
                    disabled={sending || waitingForResponse}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending || waitingForResponse}
                    className="px-3 py-2.5 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewDialog(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">New Conversation</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Machine</label>
                <select
                  value={newMachineId}
                  onChange={(e) => setNewMachineId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                >
                  {approvedMachines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Model</label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                >
                  {(modelsByMachine[newMachineId] ?? []).map((m) => (
                    <option key={m.modelName} value={m.modelName}>{m.modelName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={createConversation}
                  disabled={!newModel}
                  className="flex-1 bg-foreground text-background py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                  Start Chat
                </button>
                <button
                  onClick={() => setShowNewDialog(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
