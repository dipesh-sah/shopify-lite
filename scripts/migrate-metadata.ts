import { execute } from '../src/lib/db';

export async function migrateMetadata() {
  console.log('Migrating Metadata Tables...');

  // 1. Metafield Definitions
  // Defines the schema for metafields attached to resources
  await execute(`
    CREATE TABLE IF NOT EXISTS metafield_definitions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      namespace VARCHAR(255) NOT NULL,
      \`key\` VARCHAR(255) NOT NULL,
      owner_type VARCHAR(50) NOT NULL COMMENT 'e.g., product, variant, order, customer',
      type VARCHAR(50) NOT NULL COMMENT 'e.g., single_line_text_field, number_integer',
      name VARCHAR(255) NOT NULL,
      description TEXT,
      validation JSON COMMENT 'Validation rules',
      access JSON COMMENT 'Admin/Storefront access settings',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_namespace_key_owner (namespace, \`key\`, owner_type)
    )
  `);

  // 2. Metafields
  // Stores the actual metadata values
  await execute(`
    CREATE TABLE IF NOT EXISTS metafields (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_type VARCHAR(50) NOT NULL,
      owner_id VARCHAR(255) NOT NULL COMMENT 'ID of the resource',
      namespace VARCHAR(255) NOT NULL,
      \`key\` VARCHAR(255) NOT NULL,
      value LONGTEXT,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_owner (owner_type, owner_id),
      INDEX idx_lookup (namespace, \`key\`)
    )
  `);

  // 3. Metaobject Definitions
  // Defines structured object types (like Custom Types)
  await execute(`
    CREATE TABLE IF NOT EXISTS metaobject_definitions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(255) NOT NULL UNIQUE COMMENT 'The handle/type of the metaobject',
      name VARCHAR(255) NOT NULL,
      field_definitions JSON COMMENT 'Array of field definitions similar to metafield_defs',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 4. Metaobjects
  // Instances of the custom types
  await execute(`
    CREATE TABLE IF NOT EXISTS metaobjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      definition_id INT NOT NULL,
      handle VARCHAR(255) NOT NULL UNIQUE,
      display_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (definition_id) REFERENCES metaobject_definitions(id) ON DELETE CASCADE
    )
  `);

  // Note: Fields for metaobjects are stored in the 'metafields' table 
  // with owner_type = 'metaobject' and owner_id = metaobject.id

  // 5. Metafield History (Audit Log)
  await execute(`
    CREATE TABLE IF NOT EXISTS metafield_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      metafield_id INT NOT NULL,
      previous_value LONGTEXT,
      new_value LONGTEXT,
      changed_by VARCHAR(255) COMMENT 'User or System ID',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (metafield_id) REFERENCES metafields(id) ON DELETE CASCADE
    )
  `);

  console.log('Metadata Migration Completed.');
}
