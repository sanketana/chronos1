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
    start_time?: string;
    end_time?: string;
    available_slots?: string;
    min_faculty?: number;
    max_faculty?: number;
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
        const result = await client.query<Event>('SELECT id, name, to_char(date, \'YYYY-MM-DD\') as date, slot_len, status, start_time, end_time, available_slots, min_faculty, max_faculty, created_at FROM events ORDER BY created_at DESC');
        events = result.rows;

        // Process the available_slots to handle both old and new JSON formats
        events = events.map(event => {
            if (event.available_slots) {
                try {
                    const parsed = JSON.parse(event.available_slots);
                    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slots)) {
                        // New format: extract just the slots for backward compatibility
                        event.available_slots = JSON.stringify(parsed.slots);
                    }
                    // If parsing fails or it's the old format, keep as is
                } catch {
                    // Keep the original format if parsing fails
                }
            }
            return event;
        });

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