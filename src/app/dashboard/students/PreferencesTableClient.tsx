"use client";
import React from "react";

export interface Preference {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    event_id: string;
    event_name: string;
    event_date: string;
    professor_ids: string[];
    preferences: string;
    updated_at: string;
    available_slots?: string[];
}

interface Faculty {
    id: string;
    name: string;
}

// For now, just show professor_ids as comma-separated IDs. Later, can map to names if needed.
export default function PreferencesTableClient({ preferences, faculty }: { preferences: Preference[]; faculty: Faculty[] }) {
    // Create a map for quick lookup
    const facultyMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        faculty.forEach(f => { map[f.id] = f.name; });
        return map;
    }, [faculty]);

    // Dropdown filter state
    const [studentFilter, setStudentFilter] = React.useState('');
    const [professorFilter, setProfessorFilter] = React.useState('');
    const [eventFilter, setEventFilter] = React.useState('');

    // Unique values for dropdowns
    const uniqueStudents = React.useMemo(() => {
        const set = new Set<string>();
        preferences.forEach(p => set.add(p.student_name));
        return Array.from(set);
    }, [preferences]);
    const uniqueEvents = React.useMemo(() => {
        const set = new Set<string>();
        preferences.forEach(p => set.add(p.event_name));
        return Array.from(set);
    }, [preferences]);
    const uniqueProfessors = React.useMemo(() => {
        const set = new Set<string>();
        preferences.forEach(p => {
            if (Array.isArray(p.professor_ids)) {
                p.professor_ids.forEach(id => set.add(facultyMap[id] || id));
            }
        });
        return Array.from(set);
    }, [preferences, facultyMap]);

    // Filtered preferences
    const filtered = React.useMemo(() => {
        return preferences.filter(p => {
            const studentMatch = !studentFilter || p.student_name === studentFilter;
            const eventMatch = !eventFilter || p.event_name === eventFilter;
            let professorMatch = true;
            if (professorFilter) {
                const profNames = Array.isArray(p.professor_ids)
                    ? p.professor_ids.map(id => facultyMap[id] || id)
                    : [];
                professorMatch = profNames.includes(professorFilter);
            }
            return studentMatch && eventMatch && professorMatch;
        });
    }, [preferences, studentFilter, professorFilter, eventFilter, facultyMap]);

    return (
        <div>
            <table className="events-table">
                <thead>
                    <tr>
                        <th>
                            <select className="filter-select" value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
                                <option value="">Attendee</option>
                                {uniqueStudents.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </th>
                        <th>Email</th>
                        <th>
                            <select className="filter-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                                <option value="">Event</option>
                                {uniqueEvents.map(ev => (
                                    <option key={ev} value={ev}>{ev}</option>
                                ))}
                            </select>
                        </th>
                        <th>Event Date</th>
                        <th>
                            <select className="filter-select" value={professorFilter} onChange={e => setProfessorFilter(e.target.value)}>
                                <option value="">Professor Preference</option>
                                {uniqueProfessors.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </th>
                        <th>Available Slots</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={6}>No preferences found.</td></tr>
                    ) : (
                        filtered.map(p => (
                            <tr key={p.id}>
                                <td>{p.student_name}</td>
                                <td>{p.student_email}</td>
                                <td>{p.event_name}</td>
                                <td>{
                                    typeof p.event_date === 'string' && !isNaN(Date.parse(p.event_date))
                                        ? p.event_date.slice(0, 10)
                                        : '-'
                                }</td>
                                <td>{Array.isArray(p.professor_ids)
                                    ? p.professor_ids.map(id => facultyMap[id] || id).join(", ")
                                    : p.professor_ids}
                                </td>
                                <td>{Array.isArray(p.available_slots) ? p.available_slots.join(", ") : (p.available_slots || "-")}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
} 