import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const SESSION_COOKIE = 'chronos_session';

export async function POST(req: NextRequest) {
    const { newPassword } = await req.json();
    const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
    let session = null;
    try {
        session = sessionCookie ? JSON.parse(sessionCookie) : null;
    } catch {
        session = null;
    }
    const userId = session?.userId;
    if (!userId || !newPassword) {
        return NextResponse.json({ error: 'Missing userId (session) or newPassword' }, { status: 400 });
    }
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
    await client.end();
    // Update session cookie to clear mustChangePassword
    session.mustChangePassword = false;
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return res;
} 