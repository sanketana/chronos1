import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import StudentsTabsClient from './StudentsTabsClient';

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

async function getStudentData(user: unknown) {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    let students = [];
    let preferences = [];
    let faculty = [];
    if (user && typeof user === 'object' && (user as { role?: string }).role === 'student') {
        // Only fetch this student's data and preferences, with joins for names/emails
        const studentRes = await client.query('SELECT * FROM users WHERE id = $1', [(user as { userId: string }).userId]);
        students = studentRes.rows;
        const prefRes = await client.query(`
            SELECT p.*, u.name as student_name, u.email as student_email, e.name as event_name, to_char(e.date, 'YYYY-MM-DD') as event_date
            FROM preferences p
            LEFT JOIN users u ON p.student_id = u.id
            LEFT JOIN events e ON p.event_id = e.id
            WHERE p.student_id = $1
        `, [(user as { userId: string }).userId]);
        preferences = prefRes.rows;
    } else {
        // Admin: fetch all, with joins for names/emails
        const studentRes = await client.query('SELECT * FROM users WHERE role = $1', ['student']);
        students = studentRes.rows;
        const prefRes = await client.query(`
            SELECT p.*, u.name as student_name, u.email as student_email, e.name as event_name, to_char(e.date, 'YYYY-MM-DD') as event_date
            FROM preferences p
            LEFT JOIN users u ON p.student_id = u.id
            LEFT JOIN events e ON p.event_id = e.id
        `);
        preferences = prefRes.rows;
    }
    // Faculty list for preferences modal
    const facultyRes = await client.query('SELECT id, name FROM users WHERE role = $1', ['faculty']);
    faculty = facultyRes.rows;
    await client.end();
    return { students, preferences, faculty };
}

export default async function StudentsDashboard() {
    const user = await getSessionUser();
    if (!user) redirect('/login');
    const { students, preferences, faculty } = await getStudentData(user);
    return <StudentsTabsClient students={students} preferences={preferences} faculty={faculty} />;
} 