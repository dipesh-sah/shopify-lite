
import { createPool } from 'mysql2/promise';

async function setupChatDB() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Connecting to DB...', dbUrl ? 'Using DATABASE_URL' : 'Using individual vars');

  const config = dbUrl ? { uri: dbUrl } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const pool = createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Creating Chat Tables...');

    // Chat Threads
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Chat Participants
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        thread_id VARCHAR(36),
        user_id VARCHAR(36),
        last_read_at TIMESTAMP NULL,
        PRIMARY KEY (thread_id, user_id),
        FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
      )
    `);

    // Chat Messages
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        thread_id VARCHAR(36),
        sender_id VARCHAR(36),
        content TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
      )
    `);

    console.log('Chat Tables Created Successfully!');
  } catch (error) {
    console.error('Error creating chat tables:', error);
  } finally {
    await pool.end();
  }
}

setupChatDB();
