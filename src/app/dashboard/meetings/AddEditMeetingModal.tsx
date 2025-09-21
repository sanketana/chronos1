"use client";
import React, { useRef, useEffect } from 'react';

interface Meeting {
    id?: string;
    event_id?: string;
    faculty_id?: string;
    student_id?: string;
    start_time?: string;
    end_time?: string;
    source?: string;
}

interface AddEditMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    initialValues?: Meeting;
    isEdit?: boolean;
    events: { id: string; name: string; }[];
    professors: { id: string; name: string; }[];
    students: { id: string; name: string; }[];
}

export default function AddEditMeetingModal({
    isOpen,
    onClose,
    onSubmit,
    initialValues,
    isEdit = false,
    events,
    professors,
    students
}: AddEditMeetingModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            ref.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (initialValues?.id) {
            formData.set('id', initialValues.id);
        }
        await onSubmit(formData);
        onClose();
    }

    // Helper function to format datetime-local input value
    function formatDateTimeForInput(dateTimeStr?: string): string {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    }

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 500, maxWidth: 700 }}>
                <h2 className="modal-title">{isEdit ? 'Edit' : 'Create'} Meeting</h2>
                <form onSubmit={handleSubmit}>
                    {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}

                    <div className="form-group">
                        <label htmlFor="event_id" className="form-label">Event</label>
                        <select
                            id="event_id"
                            name="event_id"
                            className="form-input"
                            required
                            defaultValue={initialValues?.event_id || ''}
                        >
                            <option value="">-- Select an event --</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="faculty_id" className="form-label">Faculty</label>
                        <select
                            id="faculty_id"
                            name="faculty_id"
                            className="form-input"
                            required
                            defaultValue={initialValues?.faculty_id || ''}
                        >
                            <option value="">-- Select faculty --</option>
                            {professors.map(professor => (
                                <option key={professor.id} value={professor.id}>
                                    {professor.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="student_id" className="form-label">Attendee</label>
                        <select
                            id="student_id"
                            name="student_id"
                            className="form-input"
                            required
                            defaultValue={initialValues?.student_id || ''}
                        >
                            <option value="">-- Select student --</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <div className="timezone-notice" style={{
                            marginBottom: '8px',
                            fontSize: '12px',
                            color: '#6b7280',
                            fontStyle: 'italic'
                        }}>
                            📍 Enter meeting times in Central Time (CT/CST) - Northwestern University timezone
                        </div>
                        <label htmlFor="start_time" className="form-label">Start Time (Central Time)</label>
                        <input
                            id="start_time"
                            name="start_time"
                            type="datetime-local"
                            className="form-input"
                            required
                            defaultValue={formatDateTimeForInput(initialValues?.start_time)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="end_time" className="form-label">End Time (Central Time)</label>
                        <input
                            id="end_time"
                            name="end_time"
                            type="datetime-local"
                            className="form-input"
                            required
                            defaultValue={formatDateTimeForInput(initialValues?.end_time)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="source" className="form-label">Source</label>
                        <select
                            id="source"
                            name="source"
                            className="form-input"
                            required
                            defaultValue={initialValues?.source || 'MANUAL'}
                        >
                            <option value="MANUAL">Manual</option>
                            <option value="AUTO">Auto</option>
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn">
                            {isEdit ? 'Update' : 'Create'} Meeting
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
