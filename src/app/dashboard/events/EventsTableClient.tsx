"use client";
import React from 'react';
import EventModalButton from '../EventModalButton';
import EventModal from '../EventModal';
import DeleteEventButton from './DeleteEventButton';
import { updateEvent } from '../actions';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    created_at: string;
    start_time?: string;
    end_time?: string;
    available_slots?: unknown;
    min_faculty?: number;
    max_faculty?: number;
}

// Helper function to extract minPreferences from available_slots JSON
function extractMinPreferences(availableSlots: unknown): number {
    if (!availableSlots) return 1;
    try {
        if (typeof availableSlots === 'string') {
            const parsed = JSON.parse(availableSlots);
            if (parsed && typeof parsed === 'object' && typeof (parsed as { minPreferences?: unknown }).minPreferences === 'number') {
                return (parsed as { minPreferences: number }).minPreferences;
            }
        } else if (typeof availableSlots === 'object' && availableSlots !== null) {
            const maybe = availableSlots as { minPreferences?: unknown };
            if (typeof maybe.minPreferences === 'number') return maybe.minPreferences;
        }
    } catch {
        // ignore and use default
    }
    return 1;
}

// Helper function to extract slots from available_slots in any supported shape
function extractSlots(availableSlots: unknown): string[] {
    if (!availableSlots) return [];

    // Already an array (from server normalization)
    if (Array.isArray(availableSlots)) {
        return availableSlots.map(v => String(v).trim()).filter(Boolean);
    }

    // Object with slots property
    if (typeof availableSlots === 'object' && availableSlots !== null) {
        const maybe = availableSlots as { slots?: unknown };
        if (Array.isArray(maybe.slots)) {
            return maybe.slots.map(v => String(v).trim()).filter(Boolean);
        }
    }

    // String forms: JSON object, JSON array, or comma-separated string
    if (typeof availableSlots === 'string') {
        const str = availableSlots.trim();
        if (str.startsWith('{') || str.startsWith('[')) {
            try {
                const parsed = JSON.parse(str);
                if (Array.isArray(parsed)) {
                    return parsed.map(v => String(v).trim()).filter(Boolean);
                }
                if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { slots?: unknown[] }).slots)) {
                    return ((parsed as { slots: unknown[] }).slots).map(v => String(v).trim()).filter(Boolean);
                }
            } catch {
                // fall through to comma-splitting
            }
        }
        return str.split(',').map(s => s.trim()).filter(Boolean);
    }

    return [];
}

// Helper: format sessions to a comma-separated string regardless of input shape
function formatSessionsDisplay(availableSlots: unknown): string {
    const slots = extractSlots(availableSlots);
    if (slots.length > 0) return slots.join(', ');

    if (typeof availableSlots === 'string') {
        const str = availableSlots.trim();
        if (str.startsWith('{') || str.startsWith('[')) {
            try {
                const parsed = JSON.parse(str);
                if (Array.isArray(parsed)) return parsed.join(', ');
                if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { slots?: unknown[] }).slots)) {
                    return ((parsed as { slots: unknown[] }).slots).map(v => String(v)).join(', ');
                }
            } catch {
                // fall through
            }
        }
        return str;
    }

    return '';
}

// Add a helper function to format time to AM/PM
function formatTimeAMPM(timeStr?: string) {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let h = parseInt(hour, 10);
    const m = minute;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
}

export default function EventsTableClient({ events }: { events: Event[] }) {
    const [editEvent, setEditEvent] = React.useState<{
        id?: string;
        name: string;
        date: string;
        slot_len: number;
        status: string;
        start_time?: string;
        end_time?: string;
        available_slots?: string;
        min_faculty?: number;
        max_faculty?: number;
    } | null>(null);
    const router = useRouter();

    async function handleEditSubmit(formData: FormData) {
        await updateEvent(formData);
        setEditEvent(null);
        router.refresh();
    }

    return (
        <div>
            <EventModalButton />
            {editEvent && (
                <EventModal
                    isOpen={!!editEvent}
                    onClose={() => setEditEvent(null)}
                    onSubmit={handleEditSubmit}
                    initialValues={editEvent}
                    submitLabel="Update"
                />
            )}

            {/* Event Lifecycle Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 Event Lifecycle</h3>
                <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">CREATED</span>
                        <span className="text-blue-600">→ Event is created and configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">COLLECTING_AVAIL</span>
                        <span className="text-blue-600">→ Faculty and students submit availability</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800">SCHEDULING</span>
                        <span className="text-blue-600">→ Algorithm runs to create meetings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">PUBLISHED</span>
                        <span className="text-green-600">→ Meetings are visible to participants</span>
                    </div>
                </div>
                <p className="text-xs text-blue-600 mt-3 italic">
                    💡 Tip: Use the &quot;Edit&quot; button to change an event&apos;s status and move it through the lifecycle
                </p>
            </div>

            {events.length === 0 ? (
                <div>No events found or error loading events. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Event Timings</th>
                            <th>Sessions</th>
                            <th>Slot Length</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: Event) => {
                            let dateStr = '';
                            // Format date for display - handle YYYY-MM-DD format directly
                            try {
                                if (event.date && typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
                                    // Parse YYYY-MM-DD format directly to avoid timezone issues
                                    const [year, month, day] = event.date.split('-').map(Number);
                                    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
                                    dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                                } else {
                                    const dateObj = new Date(event.date ?? '');
                                    dateStr = isNaN(dateObj.getTime())
                                        ? String(event.date)
                                        : dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                                }
                            } catch {
                                dateStr = String(event.date);
                            }

                            // Format date for edit (YYYY-MM-DD format for HTML date input)
                            let dateForEdit = '';
                            try {
                                if (event.date && typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
                                    // Already in YYYY-MM-DD format
                                    dateForEdit = event.date;
                                } else {
                                    const dateObj = new Date(event.date ?? '');
                                    if (!isNaN(dateObj.getTime())) {
                                        // Use local date methods to avoid timezone issues
                                        const year = dateObj.getFullYear();
                                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                        const day = String(dateObj.getDate()).padStart(2, '0');
                                        dateForEdit = `${year}-${month}-${day}`;
                                    } else {
                                        dateForEdit = event.date || '';
                                    }
                                }
                            } catch {
                                dateForEdit = event.date || '';
                            }

                            // Extract slots and minPreferences for display and editing
                            const slots = extractSlots(event.available_slots);
                            const minPrefs = extractMinPreferences(event.available_slots);
                            const slotsForEdit = slots.join(', ');
                            const sessionsDisplay = formatSessionsDisplay(event.available_slots);

                            return (
                                <tr key={event.id}>
                                    <td>{event.name}</td>
                                    <td>{dateStr}</td>
                                    <td>{formatTimeAMPM(event.start_time)} - {formatTimeAMPM(event.end_time)}</td>
                                    <td>{sessionsDisplay}</td>
                                    <td>{event.slot_len} min</td>
                                    <td>{event.status}</td>
                                    <td>
                                        <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => setEditEvent({
                                            ...event,
                                            date: dateForEdit,
                                            available_slots: slotsForEdit,
                                            min_faculty: event.min_faculty || 3,
                                            max_faculty: event.max_faculty || 5
                                        })}>Edit</button>
                                        <DeleteEventButton eventId={event.id} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
} 
