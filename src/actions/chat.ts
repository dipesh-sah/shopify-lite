
'use server'

import { verifySession } from "@/lib/auth";
import * as chatService from "@/lib/chat";
import { revalidatePath } from "next/cache";

export async function getThreadsAction() {
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  return await chatService.getThreads(user.id);
}

export async function getMessagesAction(threadId: string) {
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  // TODO: Check if user is participant? 
  // For now, assuming admin can see all or just filtered by UI

  return await chatService.getMessages(threadId);
}

export async function createThreadAction(title: string, participantIds: string[]) {
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  // Ensure creator is participant
  if (!participantIds.includes(user.id)) {
    participantIds.push(user.id);
  }

  const threadId = await chatService.createThread(title, participantIds);
  revalidatePath('/admin');
  return threadId;
}

export async function sendMessageAction(threadId: string, content: string) {
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  const msgId = await chatService.sendMessage(threadId, user.id, content);
  revalidatePath('/admin'); // Revalidate to update unread counts potentially
  return msgId;
}

export async function markReadAction(threadId: string) {
  const user = await verifySession();
  if (!user) return; // fail silently

  await chatService.markRead(threadId, user.id);
  // No need to revalidate immediately if UI handles it optimistic
}
