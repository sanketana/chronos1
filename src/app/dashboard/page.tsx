import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import React from 'react';

async function getStats() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }
    const stats = { events: 0, faculty: 0, students: 0, meetings: 0 };
    try {
        const client = new Client({
            connectionString: process.env.NEON_POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const [events, faculty, students, meetings] = await Promise.all([
            client.query('SELECT COUNT(*) FROM events'),
            client.query("SELECT COUNT(*) FROM users WHERE role = 'faculty'"),
            client.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
            client.query('SELECT COUNT(*) FROM meetings'),
        ]);
        stats.events = Number(events.rows[0].count);
        stats.faculty = Number(faculty.rows[0].count);
        stats.students = Number(students.rows[0].count);
        stats.meetings = Number(meetings.rows[0].count);
        await client.end();
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
    return stats;
}

export default async function DashboardPage() {
    const stats = await getStats();
    return (
        <div className="dashboard-page">
            <h1 className="dashboard-title">Welcome to Chronos</h1>
            <p className="dashboard-welcome">Northwestern University Scheduling Portal</p>
            <div className="dashboard-stats-row">
                <div className="dashboard-stat-card">
                    <span className="stat-icon" aria-label="Events">
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="5" width="18" height="16" rx="2" stroke="#4E2A84" strokeWidth="1.5" fill="#E4E0EE" />
                            <path d="M3 9h18" stroke="#4E2A84" strokeWidth="1.5" />
                            <rect x="7" y="13" width="3" height="3" rx="1" fill="#4E2A84" />
                        </svg>
                    </span>
                    <div className="stat-label">Upcoming Events</div>
                    <div className="stat-value">{stats.events}</div>
                </div>
                <div className="dashboard-stat-card">
                    <span className="stat-icon" aria-label="Faculty">
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 8l9-4 9 4-9 4-9-4z" fill="#E4E0EE" stroke="#4E2A84" strokeWidth="1.5" />
                            <path d="M12 12v8" stroke="#4E2A84" strokeWidth="1.5" />
                            <path d="M7 16c0-1.657 2.239-3 5-3s5 1.343 5 3" stroke="#4E2A84" strokeWidth="1.5" />
                        </svg>
                    </span>
                    <div className="stat-label">Faculty</div>
                    <div className="stat-value">{stats.faculty}</div>
                </div>
                <div className="dashboard-stat-card">
                    <span className="stat-icon" aria-label="Attendees">
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="8" cy="10" r="3" fill="#E4E0EE" stroke="#4E2A84" strokeWidth="1.5" />
                            <circle cx="16" cy="10" r="3" fill="#E4E0EE" stroke="#4E2A84" strokeWidth="1.5" />
                            <path d="M2 20c0-2.5 3-4.5 6-4.5s6 2 6 4.5" stroke="#4E2A84" strokeWidth="1.5" />
                            <path d="M14 20c0-2 2.5-3.5 5-3.5s3 1.5 3 3.5" stroke="#4E2A84" strokeWidth="1.5" />
                        </svg>
                    </span>
                    <div className="stat-label">Attendees</div>
                    <div className="stat-value">{stats.students}</div>
                </div>
                <div className="dashboard-stat-card">
                    <span className="stat-icon" aria-label="Meetings">
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M8 13l-4 4a2 2 0 002.8 2.8l4-4" stroke="#4E2A84" strokeWidth="1.5" />
                            <path d="M16 13l4 4a2 2 0 01-2.8 2.8l-4-4" stroke="#4E2A84" strokeWidth="1.5" />
                            <rect x="8" y="8" width="8" height="6" rx="2" fill="#E4E0EE" stroke="#4E2A84" strokeWidth="1.5" />
                        </svg>
                    </span>
                    <div className="stat-label">Meetings</div>
                    <div className="stat-value">{stats.meetings}</div>
                </div>
            </div>
        </div>
    );
} 