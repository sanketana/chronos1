import { NextRequest, NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // plain text for now
const SESSION_COOKIE = 'chronos_session';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const email = formData.get('email');
    const password = formData.get('password');

    // Debug logs (commented out)
    // console.log('ALL ENV:', process.env);
    // console.log('EMAIL:', email, 'ADMIN_EMAIL:', ADMIN_EMAIL);
    // console.log('PASSWORD:', password, 'ADMIN_PASSWORD:', ADMIN_PASSWORD);

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !ADMIN_EMAIL ||
        !ADMIN_PASSWORD
    ) {
        // console.log('Invalid input or missing env vars');
        return NextResponse.redirect(new URL('/login?error=invalid', req.nextUrl.origin), { status: 302 });
    }

    if (email !== ADMIN_EMAIL) {
        // console.log('Email does not match');
        return NextResponse.redirect(new URL('/login?error=invalid', req.nextUrl.origin), { status: 302 });
    }

    if (password !== ADMIN_PASSWORD) {
        // console.log('Password does not match');
        return NextResponse.redirect(new URL('/login?error=invalid', req.nextUrl.origin), { status: 302 });
    }

    // Set a secure, httpOnly session cookie (simple random string for now)
    const sessionValue = Math.random().toString(36).slice(2) + Date.now();
    const res = NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin), { status: 302 });
    res.cookies.set(SESSION_COOKIE, sessionValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return res;
} 