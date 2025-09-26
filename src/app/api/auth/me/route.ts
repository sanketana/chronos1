import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'chronos_session';

export async function GET(req: NextRequest) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
    let session = null;
    try {
        session = sessionCookie ? JSON.parse(sessionCookie) : null;
    } catch {
        session = null;
    }
    if (!session || !session.userId || !session.role) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({
        userId: session.userId,
        email: session.email,
        role: session.role,
        mustChangePassword: !!session.mustChangePassword,
        defaultPassword: process.env.DEFAULT_USER_PASSWORD || 'welcome123'
    });
} 