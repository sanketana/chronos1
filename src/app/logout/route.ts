import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'chronos_session';

export async function POST(req: NextRequest) {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl.origin), { status: 302 });
    res.cookies.set(SESSION_COOKIE, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return res;
} 