import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Client } from 'pg';
import React from 'react';
import EventsTableClient from './EventsTableClient';

interface Event {
    id: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    created_at: string;
}

async function getEventsWithAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get('chronos_session');
    if (!session) {
        redirect('/login');
    }
    let events: Event[] = [];
    try {
        const client = new Client({
            connectionString: process.env.NEON_POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const result = await client.query<Event>('SELECT * FROM events ORDER BY created_at DESC');
        events = result.rows;
        await client.end();
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null) {
            console.error('EventsPage error:', err);
        } else {
            console.error('EventsPage error:', err);
        }
    }
    return events;
}

export default async function EventsPage() {
    const events = await getEventsWithAuth();
    return (
        <div>
            <h1 className="dashboard-title">Events</h1>
            <EventsTableClient events={events} />
        </div>
    );
} 