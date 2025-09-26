'use server';
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

export async function createAdmin(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    if (!name || !email) throw new Error('Name and email are required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        // Check if admin with this email already exists
        const existingAdmin = await client.query(
            'SELECT id FROM users WHERE email = $1 AND role = $2',
            [email, 'admin']
        );

        if (existingAdmin.rows.length > 0) {
            throw new Error(`Admin with email ${email} already exists`);
        }

        // Insert new admin with default password
        const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
        await client.query(
            'INSERT INTO users (name, email, department, role, status, password) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, email, department, 'admin', 'active', defaultPassword]
        );
    } finally {
        await client.end();
    }

    revalidatePath('/dashboard/administration');
}

export async function updateAdmin(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    const status = formData.get('status') as string;
    if (!id || !name || !email) throw new Error('ID, name, and email are required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        // Check if email is already taken by another admin
        const existingAdmin = await client.query(
            'SELECT id FROM users WHERE email = $1 AND role = $2 AND id != $3',
            [email, 'admin', id]
        );

        if (existingAdmin.rows.length > 0) {
            throw new Error(`Admin with email ${email} already exists`);
        }

        await client.query(
            'UPDATE users SET name = $1, email = $2, department = $3, status = $4 WHERE id = $5 AND role = $6',
            [name, email, department, status, id, 'admin']
        );
    } finally {
        await client.end();
    }

    revalidatePath('/dashboard/administration');
}

export async function deleteAdmin(id: string) {
    if (!id) throw new Error('ID is required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'admin']);
    } finally {
        await client.end();
    }

    revalidatePath('/dashboard/administration');
}

export async function getAllAdmins() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        const result = await client.query(`
            SELECT id, name, email, department, status, created_at 
            FROM users 
            WHERE role = 'admin' 
            ORDER BY created_at DESC
        `);
        return result.rows;
    } finally {
        await client.end();
    }
}

export async function bulkUploadAdmins(records: { name: string; email: string; department: string }[]) {
    if (!records || records.length === 0) {
        throw new Error('No records provided for bulk upload');
    }

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
        await client.query('BEGIN');

        for (const record of records) {
            try {
                // Check if admin with this email already exists
                const existingAdmin = await client.query(
                    'SELECT id FROM users WHERE email = $1 AND role = $2',
                    [record.email, 'admin']
                );

                if (existingAdmin.rows.length > 0) {
                    failedCount++;
                    errors.push(`Admin with email ${record.email} already exists`);
                    continue;
                }

                // Insert new admin with default password
                const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
                await client.query(
                    'INSERT INTO users (name, email, department, role, status, password) VALUES ($1, $2, $3, $4, $5, $6)',
                    [record.name, record.email, record.department, 'admin', 'active', defaultPassword]
                );

                successCount++;
            } catch (error) {
                failedCount++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to import ${record.email}: ${errorMessage}`);
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }

    revalidatePath('/dashboard/administration');

    return {
        success: successCount,
        failed: failedCount,
        errors
    };
}

export async function resetAdminPassword(id: string) {
    if (!id) throw new Error('Admin ID is required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Check if admin exists
        const adminResult = await client.query(
            'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
            [id, 'admin']
        );

        if (adminResult.rows.length === 0) {
            throw new Error('Admin not found');
        }

        // Reset password to default
        const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
        await client.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [defaultPassword, id]
        );

        return { success: true, message: 'Password reset successfully' };
    } finally {
        await client.end();
    }
} 