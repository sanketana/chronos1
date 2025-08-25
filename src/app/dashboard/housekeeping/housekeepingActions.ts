'use server';
import { Client } from 'pg';

export async function deleteAllMeetings(): Promise<number> {
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const res = await client.query('DELETE FROM meetings RETURNING id');
    await client.end();
    return res.rowCount || 0;
} 