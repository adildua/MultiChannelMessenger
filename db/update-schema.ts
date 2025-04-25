import { db } from '.';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Starting schema update...');
    
    // Create template_folders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_folders (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Created template_folders table');
    
    // Add folder_id, status, current_version_id, created_by_id, last_modified_by_id, tags columns to templates
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES template_folders(id),
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS current_version_id INTEGER,
      ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS last_modified_by_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS tags TEXT[];
    `);
    
    console.log('Updated templates table with new columns');
    
    // Create template_versions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_versions (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        variables JSONB,
        preview_data JSONB,
        metadata JSONB,
        created_by_id INTEGER REFERENCES users(id),
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Created template_versions table');
    
    // Create template_approvals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_approvals (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        version_id INTEGER NOT NULL REFERENCES template_versions(id),
        requested_by_id INTEGER NOT NULL REFERENCES users(id),
        reviewed_by_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        comments TEXT,
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMP
      );
    `);
    
    console.log('Created template_approvals table');
    
    // Create template_media table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_media (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        metadata JSONB,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Created template_media table');
    
    // Create template_audit_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_audit_logs (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Created template_audit_logs table');
    
    // Create template_analytics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_analytics (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        campaign_id INTEGER REFERENCES campaigns(id),
        sent_count INTEGER NOT NULL DEFAULT 0,
        delivered_count INTEGER NOT NULL DEFAULT 0,
        open_count INTEGER NOT NULL DEFAULT 0,
        click_count INTEGER NOT NULL DEFAULT 0,
        response_count INTEGER NOT NULL DEFAULT 0,
        bounce_count INTEGER NOT NULL DEFAULT 0,
        period TEXT NOT NULL,
        stats_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Created template_analytics table');
    
    // Update templates table for self-reference in current_version_id
    await db.execute(sql`
      ALTER TABLE templates 
      ADD CONSTRAINT templates_current_version_id_fkey 
      FOREIGN KEY (current_version_id) REFERENCES template_versions(id);
    `);
    
    // Update template_folders table for self-reference in parent_id
    await db.execute(sql`
      ALTER TABLE template_folders 
      ADD CONSTRAINT template_folders_parent_id_fkey 
      FOREIGN KEY (parent_id) REFERENCES template_folders(id);
    `);
    
    console.log('Added missing foreign key constraints');
    
    console.log('Schema update complete!');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

main();