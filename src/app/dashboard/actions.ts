"use server";
import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const slotLen = Number(formData.get('slotLen'));
  const status = formData.get('status') as string;
  const startTime = formData.get('start_time') as string; // time string
  const endTime = formData.get('end_time') as string; // time string
  const availableSlots = formData.get('available_slots') as string;
  // Pattern: 09:00 - 13:00, 15:00 - 17:00
  const slotPattern = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d(,\s*([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)*$/;
  if (!name || !date || !slotLen || !status || !startTime || !endTime || !availableSlots) {
    throw new Error('Missing required fields');
  }
  if (!slotPattern.test(availableSlots)) {
    throw new Error('Available slots format is invalid. Use HH:MM - HH:MM, ...');
  }
  // Convert availableSlots to JSON array
  const availableSlotsJson = JSON.stringify(availableSlots.split(',').map(s => s.replace(/\s+/g, '')));
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query(
    'INSERT INTO events (name, date, slot_len, status, start_time, end_time, available_slots) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [name, date, slotLen, status, startTime, endTime, availableSlotsJson]
  );
  await client.end();
  revalidatePath('/dashboard');
}

export async function deleteEvent(id: string) {
  if (!id) throw new Error('Missing event id');
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query('DELETE FROM events WHERE id = $1', [id]);
  await client.end();
  revalidatePath('/dashboard/events');
}

export async function updateEvent(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const slotLen = Number(formData.get('slotLen'));
  const status = formData.get('status') as string;
  const startTime = formData.get('start_time') as string; // time string
  const endTime = formData.get('end_time') as string; // time string
  const availableSlots = formData.get('available_slots') as string;
  const slotPattern = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d(,\s*([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)*$/;
  if (!id || !name || !date || !slotLen || !status || !startTime || !endTime || !availableSlots) {
    throw new Error('Missing required fields');
  }
  if (!slotPattern.test(availableSlots)) {
    throw new Error('Available slots format is invalid. Use HH:MM - HH:MM, ...');
  }
  // Convert availableSlots to JSON array
  const availableSlotsJson = JSON.stringify(availableSlots.split(',').map(s => s.replace(/\s+/g, '')));
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  await client.query(
    'UPDATE events SET name = $1, date = $2, slot_len = $3, status = $4, start_time = $5, end_time = $6, available_slots = $7 WHERE id = $8',
    [name, date, slotLen, status, startTime, endTime, availableSlotsJson, id]
  );
  await client.end();
  revalidatePath('/dashboard/events');
}

export async function getAllEvents() {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date::text as date, slot_len, status, start_time, end_time, available_slots FROM events ORDER BY date DESC');
  await client.end();
  return result.rows;
}

export async function getEventsForInputCollection() {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date::text as date, slot_len, status, start_time, end_time, available_slots FROM events WHERE status = $1 ORDER BY date DESC', ['COLLECTING_AVAIL']);
  await client.end();
  return result.rows;
}

export async function getEventsByStatus(status: string) {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date::text as date, slot_len, status, start_time, end_time, available_slots FROM events WHERE status = $1 ORDER BY date DESC', [status]);
  await client.end();
  return result.rows;
}

export async function getEventsForScheduling() {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date::text as date, slot_len, status, start_time, end_time, available_slots FROM events WHERE status = $1 ORDER BY date DESC', ['SCHEDULING']);
  await client.end();
  return result.rows;
}

export async function getEventsForMeetings() {
  const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
  await client.connect();
  const result = await client.query('SELECT id, name, date::text as date, slot_len, status, start_time, end_time, available_slots FROM events WHERE status = $1 ORDER BY date DESC', ['PUBLISHED']);
  await client.end();
  return result.rows;
} 