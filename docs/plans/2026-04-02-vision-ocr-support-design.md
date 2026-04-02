# Vision/OCR Support for IGTP API

**Date:** 2026-04-02
**Status:** Approved

## Problem

IGTP is text-only. Vision models like `chandra-ocr-2` need images as input. Users cannot submit PDFs or images through the API for OCR processing.

## Design

### API contract

`POST /api/jobs` accepts an optional `images` field:

```json
{
  "requestId": "...",
  "model": "ahmgam/chandra-ocr-2",
  "prompt": "Extract all text from this document",
  "jobType": "chat",
  "images": ["data:image/png;base64,iVBOR...", "data:application/pdf;base64,JVBERi..."]
}
```

- Images: base64 data URIs or raw base64 strings (PNG, JPG, WEBP)
- PDFs: auto-detected by data URI prefix or magic bytes, converted to per-page PNG images server-side
- Max size: 20MB per image, 50MB per PDF
- Response unchanged — text output from the model

### Changes

| File | Change |
|------|--------|
| `app/api/jobs/route.ts` | Accept `images` field, handle PDF-to-image conversion, store in DB |
| `lib/db.ts` | Add `images` column to `createJob`, update schema |
| `igtp-daemon/index.ts` | Include `images` array in Ollama payload when present |
| `lib/schema.sql` | Add `images TEXT` column to `gpu_jobs` table |

### PDF conversion

Use `pdf-to-img` (pure JS, no native dependencies) to convert PDF pages to PNG base64 strings before storing in the job record.

### Backward compatibility

- Existing text-only jobs: no change, `images` field is optional
- Web UI: no changes
- Conversations API: no changes
