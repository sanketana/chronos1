import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import React from 'react';
import AdministrationTableClient from './AdministrationTableClient';

async function getAdminData() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }

    let sessionData;
    try {
        sessionData = JSON.parse(session.value);
    } catch {
        redirect('/login');
    }

    // Only superadmin can access this page
    if (sessionData.role !== 'superadmin') {
        redirect('/dashboard');
    }

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    
    try {
        const result = await client.query(`
            SELECT id, name, email, department, status, created_at 
            FROM users 
            WHERE role = 'admin' 
            ORDER BY created_at DESC
        `);
        return result.rows;
    } finally {
        await client.end();
    }
}

export default async function AdministrationPage() {
    const admins = await getAdminData();

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1 className="page-title">Administration</h1>
                <p className="page-description">Manage system administrators</p>
            </div>
            
            <AdministrationTableClient admins={admins} />
        </div>
    );
} 