
import fs from 'fs';
import path from 'path';

export function logDebug(message: string, data?: any) {
  try {
    const logPath = path.join(process.cwd(), 'debug_output.log');
    const timestamp = new Date().toISOString();
    const dataStr = data ? JSON.stringify(data, null, 2) : '';
    const logLine = `[${timestamp}] ${message} ${dataStr}\n`;
    fs.appendFileSync(logPath, logLine);
  } catch (err) {
    // ignore logging errors
  }
}
