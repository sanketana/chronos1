"use client";
import React from 'react';
import EventModalButton from '../EventModalButton';
import EventModal from '../EventModal';
import DeleteEventButton from './DeleteEventButton';
import EventProgressStepper from './EventProgressStepper';
import SmartActionButtons from './SmartActionButtons';
import { getStatusInfo } from './EventStatusHelpers';
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

            {/* Show progress stepper for individual events or general guidance */}
            {events.length === 1 ? (
                <EventProgressStepper
                    currentStatus={events[0].status}
                    eventName={events[0].name}
                    eventDate={events[0].date}
                />
            ) : (
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Event Workflow Stages</h3>

                    {/* Simple Text Flow */}
                    <div className="text-center text-lg font-mono">
                        Setup &nbsp;&nbsp; ➡️ &nbsp;&nbsp; Collecting Inputs &nbsp;&nbsp; ➡️ &nbsp;&nbsp; Generating Schedule &nbsp;&nbsp; ➡️ &nbsp;&nbsp; Published
                    </div>
                    <br />
                    <div className="text-center text-xs text-gray-600">
                        💡 Use smart action buttons to move between stages in any direction
                    </div>
                </div>
            )}

            {events.length === 0 ? (
                <div>No events found or error loading events. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Event Details</th>
                            <th>Date & Time</th>
                            <th>Sessions</th>
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

                            const statusDisplay = getStatusInfo(event.status);

                            return (
                                <tr key={event.id}>
                                    <td>
                                        <div>
                                            <div className="font-semibold text-gray-900">{event.name}</div>
                                            <div className="text-sm text-gray-600">{event.slot_len} min slots</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="font-medium text-gray-900">{dateStr}</div>
                                            <div className="text-sm text-gray-600">
                                                {formatTimeAMPM(event.start_time)} - {formatTimeAMPM(event.end_time)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-700">
                                            {sessionsDisplay}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                                            <span>{statusDisplay.icon}</span>
                                            <span>{statusDisplay.label}</span>
                                        </span>
                                    </td>
                                    <td>
                                        <SmartActionButtons
                                            event={event}
                                            onEdit={(editEventData) => setEditEvent({
                                                ...editEventData,
                                                date: dateForEdit,
                                                available_slots: slotsForEdit,
                                                min_faculty: event.min_faculty || 3,
                                                max_faculty: event.max_faculty || 5
                                            })}
                                            onDelete={() => {
                                                if (confirm("Are you sure you want to delete this event?")) {
                                                    // Use the existing delete functionality
                                                    const deleteBtn = document.querySelector(`[data-event-id="${event.id}"]`) as HTMLButtonElement;
                                                    if (deleteBtn) {
                                                        deleteBtn.click();
                                                    }
                                                }
                                            }}
                                        />
                                        {/* Hidden delete button for functionality */}
                                        <div style={{ display: 'none' }}>
                                            <DeleteEventButton eventId={event.id} />
                                        </div>
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
