import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const SESSION_COOKIE = 'chronos_session';
const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'welcome123';

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();
    if (!email || !password) {
        return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const result = await client.query('SELECT id, email, password, role FROM users WHERE email = $1 LIMIT 1', [email]);
    await client.end();
    if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const user = result.rows[0];

    // Only allow login with the actual database password, not default password fallback
    if (user.password !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Set session cookie (simple, not secure for production)
    const sessionValue = JSON.stringify({ userId: user.id, email: user.email, role: user.role, mustChangePassword: user.password === DEFAULT_USER_PASSWORD });
    const res = NextResponse.json({
        success: true,
        role: user.role,
        mustChangePassword: user.password === DEFAULT_USER_PASSWORD
    });
    res.cookies.set(SESSION_COOKIE, sessionValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return res;
} 