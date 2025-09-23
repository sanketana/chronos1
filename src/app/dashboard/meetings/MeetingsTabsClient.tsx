"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditMeetingModal from './AddEditMeetingModal';
import MeetingInvitationModal from './MeetingInvitationModal';
import { createMeeting, updateMeeting, deleteMeeting } from './actions';

interface Meeting {
    id: string;
    event_id: string;
    faculty_id: string;
    student_id: string;
    slot: string;
    event_name: string;
    faculty_name: string;
    student_name: string;
    faculty_email: string;
    student_email: string;
    start_time?: string;
    end_time?: string;
    source?: string;
    // ...other fields
    professor_id?: string;
    professor_name?: string;
    run_id?: number; // Added run_id to the interface
}

interface User { id: string; name: string; }
interface Event { id: string; name: string; date: string; }
interface RunMeta {
    id: number;
    run_time: string;
    algorithm: string;
    triggered_by: string | null;
}

export default function MeetingsTabsClient({ meetings, professors, students, events, runs }: {
    meetings: Meeting[];
    professors: User[];
    students: User[];
    events: Event[];
    runs: RunMeta[];
}) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
    const [isInvitationModalOpen, setInvitationModalOpen] = useState(false);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);

    // Single-select filter state
    const [runIdFilter, setRunIdFilter] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');
    const [studentFilter, setStudentFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [slotFilter, setSlotFilter] = useState('');

    useEffect(() => {
        async function fetchRole() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
            } catch {
                setRole(null);
            }
        }
        fetchRole();
    }, []);

    // Helper to format date and slot
    function formatDate(dateStr?: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    }
    function formatSlot(startStr?: string, endStr?: string) {
        if (!startStr || !endStr) return '';
        const start = new Date(startStr);
        const end = new Date(endStr);
        // Use local timezone instead of UTC to match the stored timestamps
        const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    // Unique dates and slots for filters
    const uniqueDates = Array.from(new Set(meetings.map(m => formatDate(m.start_time)))).filter(Boolean);
    const uniqueSlots = Array.from(new Set(meetings.map(m => formatSlot(m.start_time, m.end_time)))).filter(Boolean);

    // Sort meetings by run_id descending before filtering
    const sortedMeetings = [...meetings].sort((a, b) => (b.run_id || 0) - (a.run_id || 0));
    const filteredMeetings = sortedMeetings.filter(m => {
        const runMatch = !runIdFilter || String(m.run_id) === runIdFilter;
        const eventMatch = !eventFilter || m.event_id === eventFilter;
        const facultyMatch = !facultyFilter || m.faculty_id === facultyFilter;
        const studentMatch = !studentFilter || m.student_id === studentFilter;
        const dateMatch = !dateFilter || formatDate(m.start_time) === dateFilter;
        const slotMatch = !slotFilter || formatSlot(m.start_time, m.end_time) === slotFilter;
        return runMatch && eventMatch && facultyMatch && studentMatch && dateMatch && slotMatch;
    });

    function handleAddClick() {
        setEditMeeting(null);
        setIsEdit(false);
        setModalOpen(true);
    }

    function handleEditClick(meeting: Meeting) {
        setEditMeeting(meeting);
        setIsEdit(true);
        setModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Are you sure you want to delete this meeting?')) return;
        const result = await deleteMeeting(id);
        if (result?.error) {
            alert('Error deleting meeting: ' + result.error);
            return;
        }
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleCreate(formData: FormData) {
        const result = await createMeeting(formData);
        if (result?.error) {
            alert('Error creating meeting: ' + result.error);
            return;
        }
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleEdit(formData: FormData) {
        const result = await updateMeeting(formData);
        if (result?.error) {
            alert('Error updating meeting: ' + result.error);
            return;
        }
        startTransition(() => {
            router.refresh();
        });
    }

    function handleExportExcel() {
        const exportData = filteredMeetings.map(m => ({
            Event: m.event_name,
            Faculty: m.faculty_name,
            Attendee: m.student_name,
            Date: formatDate(m.start_time),
            Slot: formatSlot(m.start_time, m.end_time),
        }));
        if (exportData.length === 0) return;
        const headers = Object.keys(exportData[0]);
        const csvRows = [
            headers.join(','),
            ...exportData.map(row => headers.map(field => `"${((row as Record<string, string>)[field] ?? '').toString().replace(/"/g, '""')}"`).join(',')),
        ];
        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meetings.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return (
        <div>
            <AddEditMeetingModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editMeeting || {}}
                isEdit={isEdit}
                events={events}
                professors={professors}
                students={students}
            />
            <h1 className="dashboard-title">Meetings</h1>
            <div className="mb-4 flex">
                {(role === 'admin' || role === 'superadmin') && (
                    <button className="primary-btn" style={{ width: '200px', height: '44px' }} onClick={handleAddClick}>
                        + Create New Meeting
                    </button>
                )}
                <button
                    className="secondary-btn"
                    style={{ width: '200px', height: '44px', marginLeft: '16px' }}
                    onClick={handleExportExcel}
                >
                    Export as Excel
                </button>
                {(role === 'admin' || role === 'superadmin') && (
                    <button
                        className="primary-btn"
                        style={{ width: '200px', height: '44px', marginLeft: '16px' }}
                        onClick={() => setInvitationModalOpen(true)}
                    >
                        📧 Meeting Invitations
                    </button>
                )}
            </div>
            <div style={{ marginTop: '1.5rem' }}>
                <div className="timezone-notice" style={{
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: '#6b7280',
                    fontStyle: 'italic'
                }}>
                    📍 All times are displayed in Central Time (CT/CST) - Northwestern University timezone
                </div>
                <div>
                    <table className="events-table">
                        <thead>
                            <tr className="filter-row">
                                <th className="run-id-col">
                                    <select className="filter-select" value={runIdFilter} onChange={e => setRunIdFilter(e.target.value)}>
                                        <option value="">Run ID</option>
                                        {runs.map(run => (
                                            <option key={run.id} value={run.id}>
                                                {`#${run.id} | ${run.algorithm} | ${new Date(run.run_time).toLocaleString()}`}
                                            </option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                                        <option value="">Event</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
                                        <option value="">Faculty</option>
                                        {professors.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
                                        <option value="">Attendee</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                                        <option value="">Date</option>
                                        {uniqueDates.map(date => (
                                            <option key={date} value={date}>{date}</option>
                                        ))}
                                    </select>
                                </th>
                                <th>
                                    <select className="filter-select" value={slotFilter} onChange={e => setSlotFilter(e.target.value)}>
                                        <option value="">Time Slot (CT)</option>
                                        {uniqueSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </th>
                                {(role === 'admin' || role === 'superadmin') && (
                                    <th>Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMeetings.length === 0 ? (
                                <tr>
                                    <td colSpan={(role === 'admin' || role === 'superadmin') ? 7 : 6}>
                                        {meetings.length === 0 ? (
                                            <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-center">
                                                <strong>No meetings available.</strong><br />
                                                Meetings are only visible for events that are in &quot;Published&quot; status.
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-center">No meetings match the selected filters.</div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredMeetings.map(m => (
                                    <tr key={m.id}>
                                        <td className="run-id-col">{m.run_id}</td>
                                        <td>{m.event_name}</td>
                                        <td>{m.faculty_name}</td>
                                        <td>{m.student_name}</td>
                                        <td>{formatDate(m.start_time)}</td>
                                        <td>{formatSlot(m.start_time, m.end_time)}</td>
                                        {(role === 'admin' || role === 'superadmin') && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="secondary-btn" onClick={() => handleEditClick(m)}>Edit</button>
                                                    <button className="danger-btn" onClick={() => handleDelete(m.id)}>Delete</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <MeetingInvitationModal
                isOpen={isInvitationModalOpen}
                onClose={() => setInvitationModalOpen(false)}
                meetings={meetings}
                events={events}
            />
        </div>
    );
} 