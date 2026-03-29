"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Trash2, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
}

export function ConversationsView({ initialConversations, approvedMachines, modelsByMachine }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newMachineId, setNewMachineId] = useState(approvedMachines[0]?.id ?? "");
  const [newModel, setNewModel] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

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
    const conv = await res.json();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMessages([]);
    setShowNewDialog(false);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeId,
      role: "user",
      content,
      jobId: null,
      tokens: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setWaitingForResponse(true);
    } catch {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
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
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${
                activeId === conv.id ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => setActiveId(conv.id)}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{conv.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {conv.model} · {conv.totalTokens.toLocaleString()} tokens
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConv(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
                <h2 className="text-sm font-medium text-foreground truncate">{activeConversation?.title}</h2>
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
              {messages.map((msg) => (
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
                      <div className="prose prose-sm prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:bg-black/40 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_code]:text-green-300 [&_code]:text-xs [&_pre_code]:text-green-300 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_blockquote]:border-foreground/20 [&_blockquote]:text-muted-foreground [&_a]:text-blue-400 [&_hr]:border-foreground/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.tokens != null && (
                      <p className={`text-[10px] mt-1 ${
                        msg.role === "user" ? "text-background/50" : "text-muted-foreground"
                      }`}>
                        {msg.tokens.toLocaleString()} tokens
                      </p>
                    )}
                  </div>
                </div>
              ))}
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

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
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
