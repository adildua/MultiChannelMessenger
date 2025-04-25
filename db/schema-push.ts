import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

async function main() {
  // Connect to the database
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  // Execute schema creation
  try {
    console.log('Creating tables...');
    
    // Drop all existing tables first (be careful with this in production!)
    console.log('Checking for existing tables...');
    
    // Get list of all tables
    const tableQuery = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);
    
    // Check if any tables exist
    const resultArray = tableQuery.rows || [];
    if (resultArray.length > 0) {
      console.log('Found existing tables. Dropping them...');
      for (const row of resultArray) {
        const tableName = row.table_name;
        console.log(`Dropping table: ${tableName}`);
        await db.execute(sql`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      }
      console.log('All existing tables dropped successfully.');
    } else {
      console.log('No existing tables found.');
    }

    // Create schema using drizzle
    // This will generate SQL from our schema definitions and execute it
    const results = await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tenant_levels" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(255),
        "address" TEXT,
        "country" VARCHAR(255),
        "timezone" VARCHAR(255) DEFAULT 'UTC',
        "status" VARCHAR(255) DEFAULT 'active',
        "level_id" INTEGER REFERENCES "tenant_levels"("id"),
        "parent_id" INTEGER REFERENCES "tenants"("id"),
        "balance" DECIMAL(12, 2) DEFAULT 0,
        "currency_code" VARCHAR(3) DEFAULT 'USD',
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(255) NOT NULL UNIQUE,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(255),
        "last_name" VARCHAR(255),
        "role" VARCHAR(255) DEFAULT 'user',
        "status" VARCHAR(255) DEFAULT 'active',
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "user_tenants" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE NOT NULL,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "role" VARCHAR(255) DEFAULT 'member',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP,
        UNIQUE ("user_id", "tenant_id")
      );

      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "first_name" VARCHAR(255),
        "last_name" VARCHAR(255),
        "email" VARCHAR(255),
        "phone" VARCHAR(255),
        "whatsapp" VARCHAR(255),
        "status" VARCHAR(255) DEFAULT 'active',
        "attributes" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "contact_lists" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "contact_list_members" (
        "id" SERIAL PRIMARY KEY,
        "contact_id" INTEGER REFERENCES "contacts"("id") ON DELETE CASCADE NOT NULL,
        "list_id" INTEGER REFERENCES "contact_lists"("id") ON DELETE CASCADE NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE ("contact_id", "list_id")
      );

      CREATE TABLE IF NOT EXISTS "channels" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "api_integrations" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "provider" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) DEFAULT 'active',
        "api_key" VARCHAR(255),
        "credentials" JSONB,
        "config" JSONB,
        "channels" VARCHAR(255)[] DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "templates" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "channel" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "flows" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "nodes" JSONB,
        "edges" JSONB,
        "status" VARCHAR(255) DEFAULT 'draft',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "flow_id" INTEGER REFERENCES "flows"("id"),
        "contact_list_ids" INTEGER[] DEFAULT '{}',
        "status" VARCHAR(255) DEFAULT 'draft',
        "schedule" JSONB,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "messages" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "campaign_id" INTEGER REFERENCES "campaigns"("id"),
        "contact_id" INTEGER REFERENCES "contacts"("id"),
        "template_id" INTEGER REFERENCES "templates"("id"),
        "channel" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "status" VARCHAR(255) DEFAULT 'pending',
        "sent_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "read_at" TIMESTAMP,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "contact_id" INTEGER REFERENCES "contacts"("id") ON DELETE CASCADE NOT NULL,
        "channel" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) DEFAULT 'active',
        "last_message_at" TIMESTAMP,
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "conversation_messages" (
        "id" SERIAL PRIMARY KEY,
        "conversation_id" INTEGER REFERENCES "conversations"("id") ON DELETE CASCADE NOT NULL,
        "message_id" INTEGER REFERENCES "messages"("id"),
        "direction" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" SERIAL PRIMARY KEY,
        "tenant_id" INTEGER REFERENCES "tenants"("id") ON DELETE CASCADE NOT NULL,
        "type" VARCHAR(255) NOT NULL,
        "amount" DECIMAL(12, 2) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'USD',
        "status" VARCHAR(255) DEFAULT 'completed',
        "description" TEXT,
        "reference" VARCHAR(255),
        "metadata" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "channel_rates" (
        "id" SERIAL PRIMARY KEY,
        "channel_id" INTEGER REFERENCES "channels"("id") ON DELETE CASCADE NOT NULL,
        "country_code" VARCHAR(2),
        "rate" DECIMAL(10, 5) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'USD',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP
      );
    `);

    console.log('Tables created successfully!');
    
    console.log('Database schema creation completed.');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Schema push completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema push failed:', error);
    process.exit(1);
  });