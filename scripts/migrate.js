#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const MIGRATION_TABLE = 'schema_migrations';

async function createMigrationTable(client) {
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✓ Migration table created/verified');
    } catch (error) {
        console.error('Error creating migration table:', error);
        throw error;
    }
}

async function getExecutedMigrations(client) {
    try {
        const result = await client.query(`SELECT filename FROM ${MIGRATION_TABLE} ORDER BY id`);
        return result.rows.map(row => row.filename);
    } catch (error) {
        console.error('Error getting executed migrations:', error);
        throw error;
    }
}

async function getMigrationFiles() {
    try {
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(file => file.endsWith('.sql'))
            .sort();
        return files;
    } catch (error) {
        console.error('Error reading migration files:', error);
        throw error;
    }
}

async function executeMigration(client, filename) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    
    try {
        console.log(`Executing migration: ${filename}`);
        
        // Read the migration file
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Execute the migration
        await client.query(sql);
        
        // Record the migration as executed
        await client.query(
            `INSERT INTO ${MIGRATION_TABLE} (filename) VALUES ($1)`,
            [filename]
        );
        
        console.log(`✓ Migration ${filename} executed successfully`);
    } catch (error) {
        console.error(`✗ Error executing migration ${filename}:`, error);
        throw error;
    }
}

async function runMigrations() {
    const connectionString = process.env.NEON_POSTGRES_URL;
    
    if (!connectionString) {
        console.error('NEON_POSTGRES_URL environment variable is required');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✓ Connected to database');

        // Create migration tracking table
        await createMigrationTable(client);

        // Get list of migration files and executed migrations
        const migrationFiles = await getMigrationFiles();
        const executedMigrations = await getExecutedMigrations(client);

        console.log(`Found ${migrationFiles.length} migration files`);
        console.log(`Already executed: ${executedMigrations.length} migrations`);

        // Find pending migrations
        const pendingMigrations = migrationFiles.filter(
            file => !executedMigrations.includes(file)
        );

        if (pendingMigrations.length === 0) {
            console.log('✓ No pending migrations');
            return;
        }

        console.log(`Pending migrations: ${pendingMigrations.length}`);

        // Execute pending migrations
        for (const filename of pendingMigrations) {
            await executeMigration(client, filename);
        }

        console.log('✓ All migrations completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations().catch(error => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
}

module.exports = { runMigrations }; 