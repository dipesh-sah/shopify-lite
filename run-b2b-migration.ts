import { readFileSync } from 'fs';
import { pool } from './src/lib/db';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running B2B Customer Accounts migration...');

    const sqlFile = join(__dirname, 'migrations', 'b2b_customer_accounts.sql');
    const sql = readFileSync(sqlFile, 'utf-8');

    // Split by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'USE shopify_lite');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and USE statements
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.includes('USE shopify_lite')) {
        continue;
      }

      try {
        await pool.query(statement);

        // Log progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+`?(\w+)`?/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE\s+`?(\w+)`?/i)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO\s+`?(\w+)`?/i)?.[1];
          console.log(`✅ Inserted data into: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          console.log(`✅ Created index`);
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === 'ER_DUP_FIELDNAME' ||
          error.code === 'ER_TABLE_EXISTS_ERROR' ||
          error.code === 'ER_DUP_KEYNAME' ||
          error.message.includes('Duplicate')) {
          console.log(`⚠️  Skipping (already exists): ${error.message.substring(0, 80)}...`);
        } else {
          console.error(`❌ Error executing statement:`, error.message);
          console.error(`Statement: ${statement.substring(0, 200)}...`);
        }
      }
    }

    console.log('\n✨ Migration completed successfully!');

    // Verify the migration
    console.log('\n📊 Verifying new tables...');
    const [tables] = await pool.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'shopify_lite' 
        AND TABLE_NAME IN (
          'b2b_applications',
          'b2b_product_pricing',
          'minimum_order_quantities',
          'customer_price_groups',
          'customer_price_group_members',
          'b2b_approval_logs'
        )
    `);

    console.table(tables);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
