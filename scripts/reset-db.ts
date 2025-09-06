import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Resetting database using Prisma...');
    
    // Drop all tables using Prisma's raw SQL (PostgreSQL specific)
    console.log('🗑️  Dropping all tables...');
    
    // Get all table names from information_schema
    const tableNamesResult = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `;
    
    const tableNames = tableNamesResult as { tablename: string }[];
    
    if (tableNames.length > 0) {
      // Drop foreign key constraints first
      for (const table of tableNames) {
        await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "public"."${table.tablename}" DROP CONSTRAINT IF EXISTS CASCADE;`);
      }
      
      // Drop tables
      for (const table of tableNames) {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE;`);
        console.log(`  🗑️  Dropped table: ${table.tablename}`);
      }
    }
    
    // Drop enum types (PostgreSQL specific)
    console.log('🗑️  Dropping enum types...');
    const enumTypes = ['TicketStatus', 'TicketPriority'];
    for (const enumType of enumTypes) {
      try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
        console.log(`  🗑️  Dropped enum: ${enumType}`);
      } catch (error) {
        console.log(`  ⚠️  Enum ${enumType} doesn't exist, skipping`);
      }
    }
    
    console.log('✅ All tables and types dropped');
    
    // Run migrations to recreate schema
    console.log('🔄 Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ Migrations complete');
    
    // Run seed
    console.log('🌱 Running seed...');
    const seedPath = path.join(__dirname, '..', 'prisma', 'seed.ts');
    execSync(`npx tsx ${seedPath}`, { stdio: 'inherit' });
    
    console.log('✅ Seed complete');
    
    console.log('🎉 Database reset and seeded successfully!');
    console.log(`👤 Admin user: admin@example.com / admin123`);
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();