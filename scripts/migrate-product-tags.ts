
import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrateTags() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }
  const pool = createPool({ uri: dbUrl });

  try {
    console.log("Dropping tables...");
    await pool.query("DROP TABLE IF EXISTS product_tags");
    await pool.query("DROP TABLE IF EXISTS tags");

    console.log("Creating 'tags' table...");
    await pool.query(`
      CREATE TABLE tags (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log("Creating 'product_tags' table...");
    try {
      await pool.query(`
        CREATE TABLE product_tags (
            product_id INT NOT NULL,
            tag_id VARCHAR(50) NOT NULL,
            PRIMARY KEY (product_id, tag_id),
            KEY product_idx (product_id),
            KEY tag_idx (tag_id),
            CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
    } catch (e) {
      console.error("Failed to create product_tags with FKs. Reverting to separate table.");
      console.error(e);
      await pool.query(`
            CREATE TABLE product_tags (
                product_id INT NOT NULL,
                tag_id VARCHAR(50) NOT NULL,
                PRIMARY KEY (product_id, tag_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
      console.log("Created product_tags WITHOUT FKs (fallback).");
    }

    console.log("Migration completed successfully.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrateTags();
