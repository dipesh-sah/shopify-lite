
// Mock Timestamp class to replace Firebase Timestamp
// Safe for Client Components (no Node.js dependencies)

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) { }

  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }

  toMillis() {
    return this.seconds * 1000 + this.nanoseconds / 1000000;
  }

  static now() {
    const now = Date.now();
    return new Timestamp(Math.floor(now / 1000), (now % 1000) * 1000000);
  }

  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1000000);
  }
}

export function serverTimestamp() {
  return Timestamp.now();
}
