# Conversations Feature Design

## Overview

Add a ChatGPT/LM Studio-style conversation interface. Sidebar lists conversations, right panel shows chat. Each conversation is tied to a machine + model. Each user message creates a job for billing. Full history sent to Ollama for context. Auto-truncation at context window limits.

## Database

- conversations: id, user_id, machine_id, request_id, model, title, created_at, updated_at
- conversation_messages: id, conversation_id, role (user/assistant), content, job_id, tokens, created_at

## Key Behaviors

- Each user message = one job record (for billing/auditing)
- Full message history sent to Ollama via daemon
- Token counter visible in UI
- Auto-truncate at ~80% of model context window with warning
- "Start fresh context" button for manual reset
- Jobs page remains as audit/billing log
