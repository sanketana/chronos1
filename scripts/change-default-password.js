#!/usr/bin/env node

const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function changeDefaultPassword() {
    const connectionString = process.env.NEON_POSTGRES_URL;
    
    if (!connectionString) {
        console.error('❌ NEON_POSTGRES_URL environment variable is required');
        process.exit(1);
    }

    console.log('🔐 Change Default Superadmin Password');
    console.log('=====================================\n');

    try {
        // Get new password from user
        const newPassword = await question('Enter new password for superadmin@northwestern.edu: ');
        
        if (!newPassword || newPassword.length < 8) {
            console.error('❌ Password must be at least 8 characters long');
            process.exit(1);
        }

        const confirmPassword = await question('Confirm new password: ');
        
        if (newPassword !== confirmPassword) {
            console.error('❌ Passwords do not match');
            process.exit(1);
        }

        // Connect to database
        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        console.log('✅ Connected to database');

        // Update the password
        const result = await client.query(
            "UPDATE users SET password = $1 WHERE email = 'superadmin@northwestern.edu' AND role = 'superadmin'",
            [newPassword]
        );

        if (result.rowCount === 0) {
            console.error('❌ No superadmin user found with email superadmin@northwestern.edu');
            process.exit(1);
        }

        console.log('✅ Password updated successfully!');
        console.log('📧 You can now log in with: superadmin@northwestern.edu');
        console.log('🔒 Remember to keep your new password secure');

        await client.end();

    } catch (error) {
        console.error('❌ Error changing password:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run if this script is executed directly
if (require.main === module) {
    changeDefaultPassword().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { changeDefaultPassword }; 