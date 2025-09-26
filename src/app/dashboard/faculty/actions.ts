'use server';
import { Client } from 'pg';

export async function createFaculty(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    if (!name || !email) throw new Error('Name and email are required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // Add default password from environment variable
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
    await client.query(
        'INSERT INTO users (name, email, department, role, status, password) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, email, department, 'faculty', 'active', defaultPassword]
    );
    await client.end();
}

export async function updateFaculty(formData: FormData) {
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
    await client.query(
        'UPDATE users SET name = $1, email = $2, department = $3, status = $4 WHERE id = $5 AND role = $6',
        [name, email, department, status, id, 'faculty']
    );
    await client.end();
}

export async function deleteFaculty(id: string) {
    if (!id) throw new Error('ID is required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'faculty']);
    await client.end();
}

export async function upsertAvailability({ facultyId, eventId, slots, preferences }: { facultyId: string; eventId: string; slots: string[]; preferences: string }) {
    if (!facultyId || !eventId || !slots) throw new Error('Missing required fields');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    // Sort slots before saving
    const sortedSlots = [...slots].sort();
    await client.query(
        `INSERT INTO availabilities (faculty_id, event_id, available_slots, preferences, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (faculty_id, event_id)
         DO UPDATE SET available_slots = $3, preferences = $4, updated_at = NOW()`,
        [facultyId, eventId, JSON.stringify(sortedSlots), preferences]
    );
    await client.end();
}

export async function getAllAvailabilities() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT a.id, a.faculty_id, u.name as faculty_name, u.email as faculty_email, u.department as faculty_department, a.event_id, e.name as event_name, COALESCE(to_char(e.date, 'YYYY-MM-DD'), '') as event_date, e.start_time, e.end_time, e.slot_len, a.available_slots, a.preferences, a.updated_at
        FROM availabilities a
        JOIN users u ON a.faculty_id = u.id
        JOIN events e ON a.event_id = e.id
        ORDER BY a.updated_at DESC
    `);

    // Process the available_slots to handle both old and new JSON formats
    const processedRows = result.rows.map(row => {
        if (row.available_slots) {
            try {
                const parsed = JSON.parse(row.available_slots);
                if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slots)) {
                    // New format: extract just the slots
                    row.available_slots = parsed.slots;
                }
                // If parsing fails or it's the old format, keep as is
            } catch {
                // Keep the original format if parsing fails
            }
        }
        return row;
    });

    await client.end();
    return processedRows;
}

export async function getAllAvailabilitiesForFaculty(facultyId: string) {
    if (!facultyId) throw new Error('Missing facultyId');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(
        `SELECT event_id, available_slots FROM availabilities WHERE faculty_id = $1`,
        [facultyId]
    );
    await client.end();
    return result.rows;
}

export async function getAvailableFacultyForEvent(eventId: string) {
    if (!eventId) throw new Error('Missing eventId');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT DISTINCT u.id, u.name
        FROM availabilities a
        JOIN users u ON a.faculty_id = u.id
        WHERE a.event_id = $1
        ORDER BY u.name ASC
    `, [eventId]);
    await client.end();
    return result.rows;
}

export async function getAllFaculty() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT id, name
        FROM users
        WHERE role = 'faculty' AND status = 'active'
        ORDER BY name ASC
    `);
    await client.end();
    return result.rows;
}

export async function getAvailability(facultyId: string, eventId: string) {
    if (!facultyId || !eventId) throw new Error('Missing facultyId or eventId');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(
        `SELECT available_slots, preferences, updated_at FROM availabilities WHERE faculty_id = $1 AND event_id = $2 LIMIT 1`,
        [facultyId, eventId]
    );
    await client.end();
    return result.rows[0] || null;
}

export async function bulkUploadFaculty(records: { name: string; email: string; department: string }[]) {
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
                // Check if faculty with this email already exists
                const existingFaculty = await client.query(
                    'SELECT id FROM users WHERE email = $1 AND role = $2',
                    [record.email, 'faculty']
                );

                if (existingFaculty.rows.length > 0) {
                    failedCount++;
                    errors.push(`Faculty with email ${record.email} already exists`);
                    continue;
                }

                // Insert new faculty member with default password
                const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
                await client.query(
                    'INSERT INTO users (name, email, department, role, status, password) VALUES ($1, $2, $3, $4, $5, $6)',
                    [record.name, record.email, record.department, 'faculty', 'active', defaultPassword]
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

    return {
        success: successCount,
        failed: failedCount,
        errors
    };
}

export async function resetFacultyPassword(id: string) {
    if (!id) throw new Error('Faculty ID is required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Check if faculty exists
        const facultyResult = await client.query(
            'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
            [id, 'faculty']
        );

        if (facultyResult.rows.length === 0) {
            throw new Error('Faculty member not found');
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