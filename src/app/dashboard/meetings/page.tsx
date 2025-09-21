import MeetingsTabsClient from './MeetingsTabsClient';
import { Client } from 'pg';
import { cookies } from 'next/headers';

type User = { userId?: string; id?: string; role?: string | null };

async function getSessionUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) return null;
    try {
        return JSON.parse(session.value);
    } catch {
        return null;
    }
}

async function getMeetings(user: User, latestRunId: number | null) {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    let result;
    if (user && user.role === 'student' && latestRunId) {
        result = await client.query(`
            SELECT m.*, e.name as event_name, u1.name as faculty_name, u1.email as faculty_email, u2.name as student_name, u2.email as student_email
            FROM meetings m
            JOIN events e ON m.event_id = e.id
            JOIN users u1 ON m.faculty_id = u1.id
            JOIN users u2 ON m.student_id = u2.id
            WHERE m.student_id = $1 AND m.run_id = $2 AND e.status = 'PUBLISHED'
            ORDER BY m.start_time, m.event_id
        `, [user.userId || user.id, latestRunId]);
    } else if (user && user.role === 'student') {
        result = await client.query(`
            SELECT m.*, e.name as event_name, u1.name as faculty_name, u1.email as faculty_email, u2.name as student_name, u2.email as student_email
            FROM meetings m
            JOIN events e ON m.event_id = e.id
            JOIN users u1 ON m.faculty_id = u1.id
            JOIN users u2 ON m.student_id = u2.id
            WHERE m.student_id = $1 AND e.status = 'PUBLISHED'
            ORDER BY m.start_time, m.event_id
        `, [user.userId || user.id]);
    } else if (user && user.role === 'faculty' && latestRunId) {
        result = await client.query(`
            SELECT m.*, e.name as event_name, u1.name as faculty_name, u1.email as faculty_email, u2.name as student_name, u2.email as student_email
            FROM meetings m
            JOIN events e ON m.event_id = e.id
            JOIN users u1 ON m.faculty_id = u1.id
            JOIN users u2 ON m.student_id = u2.id
            WHERE m.faculty_id = $1 AND m.run_id = $2 AND e.status = 'PUBLISHED'
            ORDER BY m.start_time, m.event_id
        `, [user.userId || user.id, latestRunId]);
    } else if (user && user.role === 'faculty') {
        result = await client.query(`
            SELECT m.*, e.name as event_name, u1.name as faculty_name, u1.email as faculty_email, u2.name as student_name, u2.email as student_email
            FROM meetings m
            JOIN events e ON m.event_id = e.id
            JOIN users u1 ON m.faculty_id = u1.id
            JOIN users u2 ON m.student_id = u2.id
            WHERE m.faculty_id = $1 AND e.status = 'PUBLISHED'
            ORDER BY m.start_time, m.event_id
        `, [user.userId || user.id]);
    } else {
        result = await client.query(`
            SELECT m.*, e.name as event_name, u1.name as faculty_name, u1.email as faculty_email, u2.name as student_name, u2.email as student_email
            FROM meetings m
            JOIN events e ON m.event_id = e.id
            JOIN users u1 ON m.faculty_id = u1.id
            JOIN users u2 ON m.student_id = u2.id
            ORDER BY m.start_time, m.event_id
        `);
    }
    await client.end();
    return result.rows.map(row => ({
        ...row,
        professor_id: row.faculty_id, // for compatibility with frontend
        professor_name: row.faculty_name,
    }));
}

async function getProfessors() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
    await client.end();
    return result.rows;
}

async function getStudents() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, name FROM users WHERE role = $1', ['student']);
    await client.end();
    return result.rows;
}

async function getEvents(user: User) {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    let result;
    if (user && (user.role === 'faculty' || user.role === 'student')) {
        // Faculty and students can only see published events
        result = await client.query('SELECT id, name, to_char(date, \'YYYY-MM-DD\') as date FROM events WHERE status = $1', ['PUBLISHED']);
    } else {
        // Admins can see all events
        result = await client.query('SELECT id, name, to_char(date, \'YYYY-MM-DD\') as date FROM events');
    }
    await client.end();
    return result.rows;
}

async function getRuns() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, run_time, algorithm, triggered_by FROM scheduler_runs ORDER BY run_time DESC');
    await client.end();
    return result.rows;
}

export default async function MeetingsPage() {
    const user = await getSessionUser();
    const runs = await getRuns();
    const latestRunId = runs.length > 0 ? runs[0].id : null;
    const [meetings, professors, students, events] = await Promise.all([
        getMeetings(user, latestRunId),
        getProfessors(),
        getStudents(),
        getEvents(user)
    ]);
    return <MeetingsTabsClient meetings={meetings} professors={professors} students={students} events={events} runs={runs} />;
} 