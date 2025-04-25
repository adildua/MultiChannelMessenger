import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Define the tenant table with the proper balance type
const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  levelId: integer("level_id"),
  parentId: integer("parent_id"),
  balance: text("balance").notNull().default("0"),
  currencyCode: text("currency_code").notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define the proper insert schema
export const correctedTenantSchema = createInsertSchema(tenants, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  balance: (schema) => schema.optional(),
  currencyCode: (schema) => schema.optional()
});

async function main() {
  // Connect to the database
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  // Execute schema update
  try {
    console.log('Checking tenants table...');
    
    // Check if the balance column needs to be updated
    const columnCheck = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'balance';
    `);

    const resultArray = columnCheck.rows || [];
    if (resultArray.length > 0) {
      const row = resultArray[0];
      const dataType = row.data_type;
      console.log(`Current balance column type: ${dataType}`);
      
      if (dataType !== 'character varying' && dataType !== 'text') {
        console.log('Altering balance column type to text...');
        await db.execute(sql`
          ALTER TABLE tenants 
          ALTER COLUMN balance TYPE TEXT USING balance::TEXT;
        `);
        console.log('Balance column type updated to text successfully!');
      } else {
        console.log('Balance column is already the correct type.');
      }
    } else {
      console.log('Balance column not found in tenants table. It may not exist yet.');
    }
    
    console.log('Schema correction completed.');
  } catch (error) {
    console.error('Error correcting schema:', error);
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Schema fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema fix failed:', error);
    process.exit(1);
  });