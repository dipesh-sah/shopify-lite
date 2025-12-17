
import { execute } from './db';

export async function logAudit(entry: {
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  details?: any;
  [key: string]: any;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  console.log(`[AUDIT]`, JSON.stringify(logEntry));

  // DB Insert (Mocked/Commented until table exists)
  /*
  const userId = entry.actorId || 'system';
  const detailStr = JSON.stringify(entry);
  await execute(
      'INSERT INTO audit_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [userId, entry.action, detailStr]
  );
  */
}

// Keep for backward compatibility if I used it anywhere (I didn't, but safe practice)
export async function logAdminAction(userId: string, action: string, details: any) {
  return logAudit({
    actorId: userId,
    action,
    details
  });
}
