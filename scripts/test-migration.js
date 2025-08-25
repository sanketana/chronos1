#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testMigrationSystem() {
    const connectionString = process.env.NEON_POSTGRES_URL;
    
    if (!connectionString) {
        console.error('❌ NEON_POSTGRES_URL environment variable is required');
        process.exit(1);
    }

    console.log('🔍 Testing migration system...');

    // Test 1: Check if migration files exist
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    console.log(`📁 Checking migrations directory: ${migrationsDir}`);
    
    if (!fs.existsSync(migrationsDir)) {
        console.error('❌ Migrations directory does not exist');
        process.exit(1);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    console.log(`✅ Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Test 2: Check database connection
    console.log('\n🔌 Testing database connection...');
    
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Database connection successful');

        // Test 3: Check if we can query the database
        const result = await client.query('SELECT version()');
        console.log('✅ Database query successful');
        console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);

        // Test 4: Check if schema_migrations table exists (optional)
        try {
            const migrationResult = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = 'schema_migrations'
            `);
            
            if (parseInt(migrationResult.rows[0].count) > 0) {
                console.log('✅ Migration tracking table exists');
                
                // Check executed migrations
                const executedResult = await client.query('SELECT filename FROM schema_migrations ORDER BY id');
                console.log(`   Executed migrations: ${executedResult.rows.length}`);
                executedResult.rows.forEach(row => console.log(`     - ${row.filename}`));
                
                // Check if default superadmin exists
                const superadminResult = await client.query("SELECT name, email FROM users WHERE role = 'superadmin'");
                if (superadminResult.rows.length > 0) {
                    console.log('✅ Default superadmin user exists');
                    superadminResult.rows.forEach(row => console.log(`     - ${row.name} (${row.email})`));
                } else {
                    console.log('ℹ️  No superadmin user found (will be created by migration)');
                }
            } else {
                console.log('ℹ️  Migration tracking table does not exist (will be created on first run)');
            }
        } catch (error) {
            console.log('ℹ️  Could not check migration tracking table (normal for new databases)');
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }

    console.log('\n🎉 Migration system test completed successfully!');
    console.log('📋 Ready to run migrations with: npm run migrate');
}

// Run test if this script is executed directly
if (require.main === module) {
    testMigrationSystem().catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testMigrationSystem }; 