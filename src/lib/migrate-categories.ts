import { query } from './db'

export async function addCategoryImageColumn() {
  try {
    // Check if column exists
    const columns = await query(`SHOW COLUMNS FROM categories LIKE 'image'`) as any[]

    if (columns.length === 0) {
      // Add image column
      await query(`ALTER TABLE categories ADD COLUMN image VARCHAR(500) DEFAULT NULL`)
      console.log('✅ Image column added to categories table')
      return true
    } else {
      console.log('✅ Image column already exists')
      return true
    }
  } catch (error) {
    console.error('❌ Error adding image column:', error)
    return false
  }
}

// Run on server startup
addCategoryImageColumn()
