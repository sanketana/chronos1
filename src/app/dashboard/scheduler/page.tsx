"use client";

import React, { useState, useEffect } from "react";
import { getEventsForScheduling } from "../actions";
import { getAllAvailabilities } from "../faculty/actions";
import { getAllPreferences } from "../students/actions";
import { runSchedulerAction } from './actions';
import type { MatchingResult } from './IMatchingAlgorithm';

interface Event { id: string; name: string; date?: string; start_time?: string; end_time?: string; slot_len?: number; }
interface Professor { id: string; name: string; email: string; department: string; available_slots: string[]; }
interface Student { id: string; name: string; email: string; department: string; available_slots: string[]; }

type SchedulerResult = MatchingResult | { error: string };

export default function SchedulerPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState("");
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [scheduling, setScheduling] = useState(false); // NEW: scheduling state
    const [result, setResult] = useState<SchedulerResult | null>(null); // Store full result object
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('CustomIntegerProgramming');
    const [logs, setLogs] = useState<string[]>([]); // For user-friendly logs

    useEffect(() => {
        async function fetchData() {
            setLoadingData(true);
            const [eventsData, availabilities, preferences] = await Promise.all([
                getEventsForScheduling(),
                getAllAvailabilities(),
                getAllPreferences(),
            ]);
            setEvents(eventsData);
            (window as unknown as { __availabilities?: unknown[] }).__availabilities = availabilities;
            (window as unknown as { __preferences?: unknown[] }).__preferences = preferences;
            setLoadingData(false);
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedEvent) {
            setProfessors([]);
            setStudents([]);
            return;
        }
        const availabilities = (window as unknown as { __availabilities?: unknown[] }).__availabilities || [];
        const eventProfs = availabilities
            .filter((a) => (a as { event_id: string }).event_id === selectedEvent)
            .map((a) => {
                const av = a as { faculty_id: string; faculty_name: string; faculty_email: string; faculty_department?: string; available_slots?: string[] | string };
                return {
                    id: av.faculty_id,
                    name: av.faculty_name,
                    email: av.faculty_email,
                    department: av.faculty_department || "-",
                    available_slots: av.available_slots ? (typeof av.available_slots === 'string' ? JSON.parse(av.available_slots) : av.available_slots) : [],
                };
            });
        setProfessors(eventProfs);
        const preferences = (window as unknown as { __preferences?: unknown[] }).__preferences || [];
        const eventStudents = preferences
            .filter((p) => (p as { event_id: string }).event_id === selectedEvent)
            .map((p) => {
                const pref = p as { student_id: string; student_name: string; student_email: string; student_department?: string; available_slots?: string[] | string };
                return {
                    id: pref.student_id,
                    name: pref.student_name,
                    email: pref.student_email,
                    department: pref.student_department || "-",
                    available_slots: pref.available_slots ? (typeof pref.available_slots === 'string' ? JSON.parse(pref.available_slots) : pref.available_slots) : [],
                };
            });
        setStudents(eventStudents);
    }, [selectedEvent]);

    // Helper to map IDs to names
    function getStudentName(id: string) {
        const s = students.find((s: Student) => s.id === id);
        return s ? s.name : id;
    }
    function getProfessorName(id: string) {
        const p = professors.find((p: Professor) => p.id === id);
        return p ? p.name : id;
    }

    function replaceIdsWithNames(log: string): string {
        let replaced = log;
        // Replace 'student <uuid>' and 'professor <uuid>' patterns
        students.forEach(s => {
            if (s.id && s.name) {
                // Replace 'student <uuid>'
                const regex1 = new RegExp(`student ${s.id}(?![\w-])`, 'g');
                replaced = replaced.replace(regex1, `student ${s.name}`);
                // Replace just the UUID
                const regex2 = new RegExp(`\b${s.id}\b`, 'g');
                replaced = replaced.replace(regex2, s.name);
            }
        });
        professors.forEach(p => {
            if (p.id && p.name) {
                // Replace 'professor <uuid>'
                const regex1 = new RegExp(`professor ${p.id}(?![\w-])`, 'g');
                replaced = replaced.replace(regex1, `professor ${p.name}`);
                // Replace just the UUID
                const regex2 = new RegExp(`\b${p.id}\b`, 'g');
                replaced = replaced.replace(regex2, p.name);
            }
        });
        // Optionally, handle event UUIDs if you have event names and IDs available
        return replaced;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Scheduler</h1>
            {/* Spinner overlay when scheduling */}
            {scheduling && (
                <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                    <div className="w-full max-w-lg bg-white bg-opacity-90 rounded shadow p-4 mt-2">
                        <ul className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {logs.length === 0 ? null : logs.map((log, i) => <li key={i}>{replaceIdsWithNames(log)}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                <div className="flex-1">
                    <label className="block mb-2 font-medium">Select Event</label>
                    {loadingData ? (
                        <div className="text-gray-500">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                            <strong>No events available for scheduling.</strong><br />
                            Events must be in &quot;Scheduling&quot; status to run the scheduler.
                        </div>
                    ) : (
                        <select
                            className="form-input w-full max-w-md"
                            value={selectedEvent}
                            onChange={e => setSelectedEvent(e.target.value)}
                        >
                            <option value="">-- Select an event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name} ({ev.date ? new Date(ev.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : ""})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label className="block mb-2 font-medium">Select Algorithm</label>
                    <select
                        className="form-input"
                        value={selectedAlgorithm}
                        onChange={e => setSelectedAlgorithm(e.target.value)}
                    >
                        <option value="CustomIntegerProgramming">🧮 Integer Programming Algorithm (globally optimal, respects preferences, reliable for all input sizes)</option>
                        <option value="Greedy">🏃‍♂️ Greedy Algorithm (fast, simple, good for most cases)</option>
                    </select>
                </div>
                <button
                    className="primary-btn px-6 py-2 rounded disabled:opacity-50 mt-4 md:mt-0 flex items-center gap-2"
                    disabled={!selectedEvent || loadingData || scheduling}
                    onClick={async () => {
                        setResult(null);
                        setLogs([]);
                        setScheduling(true);
                        try {
                            // Do not show 'Scheduler started...' log to user
                            const res = await runSchedulerAction(selectedEvent, selectedAlgorithm);
                            if ('logs' in res && Array.isArray((res as { logs?: unknown }).logs)) {
                                setLogs((res as { logs: string[] }).logs);
                            } else {
                                setLogs(logs => [...logs, 'Scheduler completed.']);
                            }
                            setResult(res);
                        } catch {
                            setLogs(logs => [...logs, 'Error running scheduler.']);
                            setResult({ error: 'Error running scheduler.' });
                        } finally {
                            setScheduling(false);
                        }
                    }}
                    title={selectedEvent ? 'Run the scheduler for the selected event' : 'Select an event to enable'}
                    style={{ cursor: !selectedEvent || loadingData || scheduling ? 'not-allowed' : 'pointer', opacity: !selectedEvent || loadingData || scheduling ? 0.6 : 1 }}
                >
                    {scheduling && (
                        <span className="animate-spin mr-1" role="img" aria-label="Loading">⏳</span>
                    )}
                    {scheduling ? 'Scheduling...' : 'Run Scheduler'}
                </button>
            </div>
            {/* Scheduler report in rotated table format (metrics as rows) */}
            {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    {'error' in result ? (
                        <div className="text-red-700 font-semibold">{result.error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[350px] text-sm" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee', minWidth: '180px' }}>
                                            Status
                                        </td>
                                        <td className={`py-1 pl-2 text-left align-top text-green-700 font-semibold`} style={{ borderBottom: '1px solid #eee' }}>
                                            Success
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Total Meetings Scheduled
                                        </td>
                                        <td className="py-1 pl-2 text-green-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {'meetings' in result ? result.meetings.length : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Time Taken (seconds)
                                        </td>
                                        <td className="py-1 pl-2 text-blue-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {'timeTakenSeconds' in result && typeof result.timeTakenSeconds === 'number' ? result.timeTakenSeconds.toFixed(2) : '-'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            Unmatched Attendees
                                        </td>
                                        <td className="py-1 pl-2 text-yellow-900 text-left align-top" style={{ borderBottom: '1px solid #eee' }}>
                                            {'unmatchedStudents' in result && result.unmatchedStudents?.length > 0 ? result.unmatchedStudents.map(getStudentName).join(', ') : 'None'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 pl-2 font-semibold text-gray-700 text-left align-top">
                                            Unmatched Professors
                                        </td>
                                        <td className="py-1 pl-2 text-yellow-900 text-left align-top">
                                            {'unmatchedProfessors' in result && result.unmatchedProfessors?.length > 0 ? result.unmatchedProfessors.map(getProfessorName).join(', ') : 'None'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {selectedEvent && (
                <>
                    <div className="timezone-notice" style={{
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#6b7280',
                        fontStyle: 'italic'
                    }}>
                        📍 All availability slots are shown in Central Time (CT/CST) - Northwestern University timezone
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Professors</h2>
                            <div className="bg-white rounded-lg shadow p-0 overflow-x-auto">
                                <table className="events-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Available Slots (CT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {professors.length === 0 ? (
                                            <tr><td colSpan={4} className="text-gray-400">No professors found</td></tr>
                                        ) : (
                                            professors.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.name}</td>
                                                    <td>{p.email}</td>
                                                    <td>{p.department}</td>
                                                    <td>
                                                        <span className="text-xs text-green-800 font-semibold">
                                                            {Array.isArray(p.available_slots) ? p.available_slots.length : (p.available_slots ? JSON.parse(p.available_slots).length : 0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Attendees</h2>
                            <div className="bg-white rounded-lg shadow p-0 overflow-x-auto">
                                <table className="events-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Available Slots (CT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr><td colSpan={4} className="text-gray-400">No students found</td></tr>
                                        ) : (
                                            students.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.name}</td>
                                                    <td>{s.email}</td>
                                                    <td>{s.department}</td>
                                                    <td>
                                                        <span className="text-xs text-green-800 font-semibold">
                                                            {Array.isArray(s.available_slots) ? s.available_slots.length : (s.available_slots ? JSON.parse(s.available_slots).length : 0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 