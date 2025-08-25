import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const SESSION_COOKIE = 'chronos_session';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const email = formData.get('email');
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.redirect(new URL('/facultylogin?error=invalid', req.nextUrl.origin), { status: 302 });
    }

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query('SELECT id, password FROM users WHERE email = $1 AND role = $2', [email, 'faculty']);
    await client.end();
    if (result.rows.length === 0) {
        return NextResponse.redirect(new URL('/facultylogin?error=invalid', req.nextUrl.origin), { status: 302 });
    }
    const user = result.rows[0];
    if (user.password !== password) {
        return NextResponse.redirect(new URL('/facultylogin?error=invalid', req.nextUrl.origin), { status: 302 });
    }
    if (user.password === 'welcome123') {
        // Redirect to password reset page (to be implemented)
        return NextResponse.redirect(new URL('/facultylogin/reset', req.nextUrl.origin), { status: 302 });
    }
    // Set session cookie
    const sessionValue = Math.random().toString(36).slice(2) + Date.now();
    const res = NextResponse.redirect(new URL('/dashboard/faculty', req.nextUrl.origin), { status: 302 });
    res.cookies.set(SESSION_COOKIE, sessionValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });
    return res;
} 