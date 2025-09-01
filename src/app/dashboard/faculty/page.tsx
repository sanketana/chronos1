import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import FacultyTabsClient from './FacultyTabsClient';

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

async function getFacultyData(user: unknown) {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    let faculty = [];
    let availabilities = [];
    if ((user as unknown as { role: string })?.role === 'faculty') {
        // Only fetch this professor's data and availabilities, with joins for event/faculty info
        const facultyRes = await client.query('SELECT * FROM users WHERE id = $1', [(user as unknown as { userId: string }).userId]);
        faculty = facultyRes.rows;
        const availRes = await client.query(`
            SELECT a.*, u.name as faculty_name, u.email as faculty_email, u.department as faculty_department, e.name as event_name, COALESCE(to_char(e.date, 'YYYY-MM-DD'), '') as event_date, e.start_time, e.end_time, e.slot_len
            FROM availabilities a
            LEFT JOIN users u ON a.faculty_id = u.id
            LEFT JOIN events e ON a.event_id = e.id
            WHERE a.faculty_id = $1
            ORDER BY a.updated_at DESC
        `, [(user as unknown as { userId: string }).userId]);
        availabilities = availRes.rows;
    } else {
        // Admin: fetch all
        const facultyRes = await client.query('SELECT * FROM users WHERE role = $1', ['faculty']);
        faculty = facultyRes.rows;
        const availRes = await client.query(`
            SELECT a.*, u.name as faculty_name, u.email as faculty_email, u.department as faculty_department, e.name as event_name, COALESCE(to_char(e.date, 'YYYY-MM-DD'), '') as event_date, e.start_time, e.end_time, e.slot_len
            FROM availabilities a
            LEFT JOIN users u ON a.faculty_id = u.id
            LEFT JOIN events e ON a.event_id = e.id
            ORDER BY a.updated_at DESC
        `);
        availabilities = availRes.rows;
    }
    await client.end();
    return { faculty, availabilities };
}

export default async function FacultyPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');
    const { faculty, availabilities } = await getFacultyData(user);
    return <FacultyTabsClient faculty={faculty} availabilities={availabilities} />;
} 