'use server';
import { Client } from 'pg';

export async function createStudent(formData: FormData) {
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
        [name, email, department, 'student', 'active', defaultPassword]
    );
    await client.end();
}

export async function updateStudent(formData: FormData) {
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
        [name, email, department, status, id, 'student']
    );
    await client.end();
}

export async function deleteStudent(id: string) {
    if (!id) throw new Error('ID is required');
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'student']);
    await client.end();
}

export async function upsertPreference({ studentId, eventId, professorIds, preferences, unavailableSlots }: { studentId: string; eventId: string; professorIds: string[]; preferences: string; unavailableSlots: string[] }) {
    if (!studentId || !eventId || !professorIds) throw new Error('Missing required fields');

    // Get the event to check faculty limits
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        // Get event details to check faculty limits
        const eventResult = await client.query('SELECT min_faculty, max_faculty FROM events WHERE id = $1', [eventId]);
        if (eventResult.rows.length === 0) {
            throw new Error('Event not found');
        }

        const event = eventResult.rows[0];
        const minFaculty = event.min_faculty || 3; // default
        const maxFaculty = event.max_faculty || 5; // default

        // Validate based on event's faculty limits
        if (professorIds.length < minFaculty) {
            throw new Error(`Must select at least ${minFaculty} professor${minFaculty > 1 ? 's' : ''}`);
        }
        if (professorIds.length > maxFaculty) {
            throw new Error(`Cannot select more than ${maxFaculty} professor${maxFaculty > 1 ? 's' : ''}`);
        }

        // Check for duplicates
        if (new Set(professorIds).size !== professorIds.length) {
            throw new Error('No duplicate professors allowed');
        }

        await client.query(
            `INSERT INTO preferences (student_id, event_id, professor_ids, preferences, available_slots, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (student_id, event_id)
             DO UPDATE SET professor_ids = $3, preferences = $4, available_slots = $5, updated_at = NOW()`,
            [studentId, eventId, JSON.stringify(professorIds), preferences, JSON.stringify(unavailableSlots)]
        );
    } finally {
        await client.end();
    }
}

export async function getAllPreferences() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(`
        SELECT p.id, p.student_id, s.name as student_name, s.email as student_email, s.department as student_department, p.event_id, e.name as event_name, e.date as event_date, p.professor_ids, p.preferences, p.available_slots, p.updated_at
        FROM preferences p
        JOIN users s ON p.student_id = s.id
        JOIN events e ON p.event_id = e.id
        ORDER BY p.updated_at DESC
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

export async function bulkUploadStudent(records: { name: string; email: string; department: string }[]) {
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
                // Check if student with this email already exists
                const existingStudent = await client.query(
                    'SELECT id FROM users WHERE email = $1 AND role = $2',
                    [record.email, 'student']
                );

                if (existingStudent.rows.length > 0) {
                    failedCount++;
                    errors.push(`Student with email ${record.email} already exists`);
                    continue;
                }

                // Insert new student with default password
                const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'welcome123';
                await client.query(
                    'INSERT INTO users (name, email, department, role, status, password) VALUES ($1, $2, $3, $4, $5, $6)',
                    [record.name, record.email, record.department, 'student', 'active', defaultPassword]
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

export async function resetStudentPassword(id: string) {
    if (!id) throw new Error('Student ID is required');

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        // Check if student exists
        const studentResult = await client.query(
            'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
            [id, 'student']
        );

        if (studentResult.rows.length === 0) {
            throw new Error('Student not found');
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