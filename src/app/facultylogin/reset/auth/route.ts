import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    // In a real app, you would get the user from the session. For now, get email from query param or session (not secure, placeholder only)
    const email = req.cookies.get('reset_email')?.value;
    if (!email || typeof password !== 'string' || password.length < 6 || password !== confirmPassword) {
        return new NextResponse('Invalid request', { status: 400 });
    }
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query('UPDATE users SET password = $1 WHERE email = $2 AND role = $3', [password, email, 'faculty']);
    await client.end();
    return new NextResponse('OK', { status: 200 });
} 