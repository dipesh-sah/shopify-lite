
import { query } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

export interface ChatThread {
  id: string;
  title: string;
  updated_at: Date;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_system: boolean;
  created_at: Date;
  senderName?: string;
}

// Get all threads for a user
export async function getThreads(currentUserId: string): Promise<ChatThread[]> {
  // Join with messages to get last message? 
  // For simplicity, just get threads joined with participants
  // And maybe a subquery for last message
  const sql = `
    SELECT t.*, 
    (SELECT content FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT COUNT(*) FROM chat_messages m 
      WHERE m.thread_id = t.id 
      AND m.created_at > COALESCE((SELECT last_read_at FROM chat_participants WHERE thread_id = t.id AND user_id = ?), '1970-01-01')
    ) as unread_count
    FROM chat_threads t
    JOIN chat_participants p ON t.id = p.thread_id
    WHERE p.user_id = ?
    ORDER BY t.updated_at DESC
  `;
  const rows = await query(sql, [currentUserId, currentUserId]);
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    updated_at: r.updated_at,
    lastMessage: r.last_message,
    unreadCount: Number(r.unread_count)
  }));
}

// Get messages for a thread
export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  // We might want to join with users to get sender names
  // Assuming users table has id, first_name, last_name, email
  const sql = `
    SELECT m.*, u.first_name, u.last_name, u.email
    FROM chat_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.thread_id = ?
    ORDER BY m.created_at ASC
  `;
  const rows = await query(sql, [threadId]);
  return rows.map((r: any) => ({
    id: r.id,
    thread_id: r.thread_id,
    sender_id: r.sender_id,
    content: r.content,
    is_system: Boolean(r.is_system),
    created_at: r.created_at,
    senderName: r.first_name ? `${r.first_name} ${r.last_name}` : (r.email || 'Unknown')
  }));
}

// Create new thread
export async function createThread(title: string, participantIds: string[]) {
  const threadId = uuidv4();

  await query("INSERT INTO chat_threads (id, title) VALUES (?, ?)", [threadId, title]);

  for (const uid of participantIds) {
    await query("INSERT INTO chat_participants (thread_id, user_id) VALUES (?, ?)", [threadId, uid]);
  }

  return threadId;
}

// Send message
export async function sendMessage(threadId: string, senderId: string, content: string, isSystem = false) {
  const msgId = uuidv4();
  await query(
    "INSERT INTO chat_messages (id, thread_id, sender_id, content, is_system) VALUES (?, ?, ?, ?, ?)",
    [msgId, threadId, senderId, content, isSystem]
  );

  // Update thread timestamp
  await query("UPDATE chat_threads SET updated_at = NOW() WHERE id = ?", [threadId]);

  // Mark read for sender
  await markRead(threadId, senderId);

  return msgId;
}

// Mark thread as read
export async function markRead(threadId: string, userId: string) {
  await query(
    "UPDATE chat_participants SET last_read_at = NOW() WHERE thread_id = ? AND user_id = ?",
    [threadId, userId]
  );
}
