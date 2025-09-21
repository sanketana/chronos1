"use client";
import React, { useState, useEffect } from "react";

interface Meeting {
    id: string;
    event_id: string;
    event_name: string;
    faculty_id: string;
    faculty_name: string;
    faculty_email: string;
    student_id: string;
    student_name: string;
    student_email: string;
    start_time: string;
    end_time: string;
    run_id: number;
}

interface Event {
    id: string;
    name: string;
    date: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    meetings: Meeting[];
    events: Event[];
}

export default function MeetingInvitationModal({ isOpen, onClose, meetings, events }: Props) {
    const [selectedEventId, setSelectedEventId] = useState("");
    const [facultyEmail, setFacultyEmail] = useState("");
    const [attendeeEmail, setAttendeeEmail] = useState("");

    // Helper to format date and slot
    function formatDate(dateStr?: string) {
        if (!dateStr) {
            console.log('[DEBUG] formatDate: No dateStr provided');
            return '';
        }

        console.log(`[DEBUG] formatDate input: "${dateStr}" (type: ${typeof dateStr})`);

        try {
            // Handle different date formats
            let dateToFormat;

            // If it's already a Date object
            if (dateStr instanceof Date) {
                dateToFormat = dateStr;
            }
            // If it's a string, try to parse it
            else if (typeof dateStr === 'string') {
                // Handle YYYY-MM-DD format specifically
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dateToFormat = new Date(dateStr + 'T00:00:00');
                } else {
                    dateToFormat = new Date(dateStr);
                }
            } else {
                console.log('[DEBUG] formatDate: Invalid date type');
                return '';
            }

            // Check if date is valid
            if (isNaN(dateToFormat.getTime())) {
                console.log('[DEBUG] formatDate: Invalid date after parsing');
                return '';
            }

            const result = dateToFormat.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            console.log(`[DEBUG] formatDate result: "${result}"`);
            return result;
        } catch (error) {
            console.log('[DEBUG] formatDate error:', error);
            return '';
        }
    }

    function formatDateForSubject(dateStr?: string) {
        if (!dateStr) {
            console.log('[DEBUG] formatDateForSubject: No dateStr provided');
            return '';
        }

        try {
            let dateToFormat;

            if (dateStr instanceof Date) {
                dateToFormat = dateStr;
            } else if (typeof dateStr === 'string') {
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dateToFormat = new Date(dateStr + 'T00:00:00');
                } else {
                    dateToFormat = new Date(dateStr);
                }
            } else {
                return '';
            }

            if (isNaN(dateToFormat.getTime())) {
                console.log('[DEBUG] formatDateForSubject: Invalid date after parsing');
                return '';
            }

            const result = dateToFormat.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            console.log(`[DEBUG] formatDateForSubject result: "${result}"`);
            return result;
        } catch (error) {
            console.log('[DEBUG] formatDateForSubject error:', error);
            return '';
        }
    }

    function formatSlot(startStr?: string, endStr?: string) {
        if (!startStr || !endStr) return '';
        const start = new Date(startStr);
        const end = new Date(endStr);
        const formatTime = (d: Date) => d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        return `${formatTime(start)} - ${formatTime(end)} CT`;
    }

    // Get published events with meetings
    const publishedEvents = events.filter(event => {
        const eventMeetings = meetings.filter(m => m.event_id === event.id);
        return eventMeetings.length > 0;
    });

    // Generate email content when event is selected
    useEffect(() => {
        if (!selectedEventId) {
            setFacultyEmail("");
            setAttendeeEmail("");
            return;
        }

        const selectedEvent = events.find(e => e.id === selectedEventId);
        const allEventMeetings = meetings.filter(m => m.event_id === selectedEventId);

        if (!selectedEvent || allEventMeetings.length === 0) return;

        // Get the latest run_id for this event to avoid duplicates from multiple scheduler runs
        const latestRunId = Math.max(...allEventMeetings.map(m => m.run_id || 0));
        const eventMeetings = allEventMeetings.filter(m => m.run_id === latestRunId);

        console.log(`[DEBUG] Event: ${selectedEvent.name}`);
        console.log(`[DEBUG] Total meetings found: ${allEventMeetings.length}`);
        console.log(`[DEBUG] Latest run_id: ${latestRunId}`);
        console.log(`[DEBUG] Meetings from latest run: ${eventMeetings.length}`);
        console.log(`[DEBUG] Full selectedEvent object:`, selectedEvent);

        // Generate Faculty Email
        const facultyEmailAddresses = [...new Set(eventMeetings.map(m => m.faculty_email))];
        const facultyGroups: { [key: string]: Meeting[] } = {};

        eventMeetings.forEach(meeting => {
            const key = `${meeting.faculty_name}`;
            if (!facultyGroups[key]) {
                facultyGroups[key] = [];
            }
            facultyGroups[key].push(meeting);
        });

        const eventDateLong = formatDate(selectedEvent.date);
        const eventDateShort = formatDateForSubject(selectedEvent.date);
        const subjectDate = eventDateShort ? ` - ${eventDateShort}` : '';
        const bodyDate = eventDateLong || 'the scheduled date';

        console.log(`[DEBUG] Raw event date: ${selectedEvent.date}`);
        console.log(`[DEBUG] Formatted long date: ${eventDateLong}`);
        console.log(`[DEBUG] Formatted short date: ${eventDateShort}`);
        console.log(`[DEBUG] Subject date: ${subjectDate}`);
        console.log(`[DEBUG] Body date: ${bodyDate}`);

        let facultyContent = `Meeting Scheduled - ${selectedEvent.name}${subjectDate}\n\n`;
        facultyContent += `${facultyEmailAddresses.join('; ')}\n\n`;
        facultyContent += `Dear Faculty,\n\n`;
        facultyContent += `Your meetings for ${selectedEvent.name} on ${bodyDate} have been scheduled:\n\n`;

        Object.entries(facultyGroups).forEach(([professorName, professorMeetings]) => {
            facultyContent += `${professorName}:\n`;
            professorMeetings
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .forEach(meeting => {
                    facultyContent += `• ${formatSlot(meeting.start_time, meeting.end_time)}: ${meeting.student_name}\n`;
                });
            facultyContent += `\n`;
        });

        facultyContent += `All times are in Central Time (CT/CST).\n`;
        facultyContent += `Please add these to your calendar and prepare accordingly.\n\n`;
        facultyContent += `Best regards,\n`;
        facultyContent += `Chronos Scheduling System\n`;
        facultyContent += `Northwestern University`;

        // Generate Attendee Email
        const attendeeEmailAddresses = [...new Set(eventMeetings.map(m => m.student_email))];

        let attendeeContent = `Meeting Scheduled - ${selectedEvent.name}${subjectDate}\n\n`;
        attendeeContent += `${attendeeEmailAddresses.join('; ')}\n\n`;
        attendeeContent += `Dear Attendees,\n\n`;
        attendeeContent += `Your meeting for ${selectedEvent.name} on ${bodyDate} has been scheduled:\n\n`;

        eventMeetings
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .forEach(meeting => {
                attendeeContent += `• ${meeting.student_name}: ${formatSlot(meeting.start_time, meeting.end_time)} with ${meeting.faculty_name}\n`;
            });

        attendeeContent += `\nAll times are in Central Time (CT/CST).\n`;
        attendeeContent += `Please add this to your calendar and prepare accordingly.\n\n`;
        attendeeContent += `Best regards,\n`;
        attendeeContent += `Chronos Scheduling System\n`;
        attendeeContent += `Northwestern University`;

        setFacultyEmail(facultyContent);
        setAttendeeEmail(attendeeContent);
    }, [selectedEventId, meetings, events]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Could add a toast notification here
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal" style={{
                minWidth: '900px',
                maxWidth: '1200px',
                minHeight: '700px',
                maxHeight: '90vh',
                margin: '2vh auto',
                overflowY: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '15px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#4e2a84'
                    }}>
                        Generate Meeting Invitations
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#6b7280',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                        title="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="form-group">
                    <label className="form-label">Select Meeting Event</label>
                    {publishedEvents.length === 0 ? (
                        <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                            <strong>No published meetings available.</strong><br />
                            Run the scheduler and publish meetings first.
                        </div>
                    ) : (
                        <select
                            className="form-input"
                            value={selectedEventId}
                            onChange={e => setSelectedEventId(e.target.value)}
                        >
                            <option value="">Select Event</option>
                            {publishedEvents.map(event => {
                                console.log(`[DEBUG] Dropdown event:`, event);
                                return (
                                    <option key={event.id} value={event.id}>
                                        {event.name} - {formatDate(event.date)}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>

                {selectedEventId && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
                        <div style={{ minWidth: '400px' }}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="form-label text-lg font-semibold">Faculty Email</label>
                                <button
                                    type="button"
                                    className="primary-btn text-sm px-4 py-2"
                                    onClick={() => copyToClipboard(facultyEmail)}
                                    disabled={!facultyEmail}
                                >
                                    📋 Copy Faculty Email
                                </button>
                            </div>
                            <textarea
                                className="form-input"
                                value={facultyEmail}
                                readOnly
                                rows={18}
                                style={{
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    lineHeight: '1.4',
                                    resize: 'vertical'
                                }}
                                placeholder="Select an event to generate faculty email..."
                            />
                        </div>

                        <div style={{ minWidth: '400px' }}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="form-label text-lg font-semibold">Attendee Email</label>
                                <button
                                    type="button"
                                    className="primary-btn text-sm px-4 py-2"
                                    onClick={() => copyToClipboard(attendeeEmail)}
                                    disabled={!attendeeEmail}
                                >
                                    📋 Copy Attendee Email
                                </button>
                            </div>
                            <textarea
                                className="form-input"
                                value={attendeeEmail}
                                readOnly
                                rows={18}
                                style={{
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    lineHeight: '1.4',
                                    resize: 'vertical'
                                }}
                                placeholder="Select an event to generate attendee email..."
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    <strong>📋 How to use:</strong>
                    <ol className="mt-2 ml-4 list-decimal space-y-1">
                        <li>Select an event from the dropdown above</li>
                        <li>Click "📋 Copy Faculty Email" or "📋 Copy Attendee Email"</li>
                        <li>Open Outlook and create a new email</li>
                        <li>Paste (Ctrl+V) - Outlook will auto-fill subject and recipients</li>
                        <li>Review and click Send!</li>
                    </ol>
                </div>

                <div className="modal-actions mt-6 text-center">
                    <button type="button" className="secondary-btn px-8 py-2" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
