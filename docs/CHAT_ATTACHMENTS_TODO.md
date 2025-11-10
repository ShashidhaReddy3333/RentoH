# Chat Attachments - Implementation Guide

## ✅ Completed

1. **Storage Utilities** - `lib/storage/attachments.ts`
   - `uploadMessageAttachment()` - Upload files with validation
   - `deleteMessageAttachment()` - Remove uploaded files
   - Helper functions for file type detection and formatting
   - Max file size: 10MB
   - Allowed types: Images, PDFs, Word docs, Excel sheets

2. **Database Migration** - `supabase/migrations/20251110110000_message_attachments_storage.sql`
   - Storage bucket creation for 'message-attachments'
   - RLS policies for secure file access
   - Added columns to messages table:
     - `attachment_url` - URL to the file
     - `attachment_name` - Original filename
     - `attachment_size` - File size in bytes
     - `attachment_type` - MIME type

3. **Type Updates** - `components/messages/Composer.tsx`
   - Imported attachment utilities
   - Updated `ComposerProps` to accept attachments in `onSend`

## 🚧 Remaining Work

### 1. Complete Composer UI

Add to `components/messages/Composer.tsx`:

```tsx
// Add file upload handler
const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentUserId) return;

  setUploadError(null);
  setIsSending(true);

  const result = await uploadMessageAttachment(file, currentUserId);
  
  if (result.success) {
    setAttachment(result);
  } else {
    setUploadError(result.error || 'Failed to upload file');
  }
  
  setIsSending(false);
  // Reset file input
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}, [currentUserId]);

// Update handleSend to include attachment
const handleSend = useCallback(async () => {
  if ((!value.trim() && !attachment) || disabled || isSending) return;
  setIsSending(true);
  try {
    await onSend(value.trim(), attachment || undefined);
    setValue("");
    setAttachment(null);
    setUploadError(null);
  } finally {
    setIsSending(false);
  }
}, [value, attachment, disabled, isSending, onSend]);

// Add file input and attachment preview to JSX
```

### 2. Update Message Display

Create `components/messages/MessageAttachment.tsx`:

```tsx
type MessageAttachmentProps = {
  url: string;
  name: string;
  size: number;
  type: string;
};

export function MessageAttachment({ url, name, size, type }: MessageAttachmentProps) {
  const isImage = type.startsWith('image/');
  
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={name} className="max-w-sm rounded-lg" />
      </a>
    );
  }
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border p-3"
    >
      <span>{getFileIcon(type)}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-neutral-500">{formatFileSize(size)}</p>
      </div>
    </a>
  );
}
```

### 3. Update Message API

Modify `app/api/messages/route.ts` POST handler:

```tsx
const MessagePayload = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  attachmentType: z.string().optional(),
});

// In insert:
const { error: insertError } = await supabase.from("messages").insert({
  thread_id: payload.threadId,
  sender_id: userId,
  body: payload.body,
  attachment_url: payload.attachmentUrl,
  attachment_name: payload.attachmentName,
  attachment_size: payload.attachmentSize,
  attachment_type: payload.attachmentType,
});
```

### 4. Update MessagesClient

Modify `app/(app)/messages/MessagesClient.tsx`:

```tsx
const handleSend = useCallback(
  async (text: string, attachment?: UploadResult) => {
    if (!currentThreadId) return;
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      threadId: currentThreadId,
      senderId: currentUserId ?? "self",
      text,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.fileName,
      attachmentSize: attachment?.fileSize,
      attachmentType: attachment?.mimeType,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await sendMessageAction(
        currentThreadId, 
        text,
        attachment
      );
      // ... rest of logic
    }
  },
  [currentThreadId, currentUserId, router]
);
```

### 5. Create Supabase Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `message-attachments`
3. Set to Public
4. Run the RLS migration to set up policies

### 6. Test Coverage

Add tests in `tests/unit/storage/attachments.test.ts`:
- File size validation
- File type validation
- Upload success/failure
- URL generation

Add E2E test in `tests/e2e/message-attachments.spec.ts`:
- Upload image
- Upload document
- Display attachments
- Download attachments

## Security Considerations

✅ **Already Implemented:**
- File size limits (10MB)
- MIME type validation
- User-scoped storage (files stored in user's folder)
- RLS policies prevent unauthorized access

⚠️ **Additional Recommendations:**
- Add virus scanning for production (ClamAV or external service)
- Implement file content validation (not just extension)
- Add rate limiting to upload endpoint
- Set up CDN for better delivery (Cloudflare, CloudFront)

## Estimated Completion Time

- UI Updates: 2-3 hours
- API Integration: 1 hour
- Testing: 1-2 hours
- **Total: 4-6 hours**

## Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [File Upload Best Practices](https://web.dev/file-upload-best-practices/)
- [React File Upload Tutorial](https://react.dev/reference/react-dom/components/input#reading-the-files-information-without-uploading)
