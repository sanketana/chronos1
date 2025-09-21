"use client";
import React, { useRef, useEffect } from 'react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void | Promise<void>;
    initialValues?: {
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
    };
    submitLabel?: string;
}

export default function EventModal({ isOpen, onClose, onSubmit, initialValues, submitLabel = "Create" }: EventModalProps) {
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

        // Client-side validation for faculty limits
        const minFaculty = parseInt(formData.get('min_faculty') as string);
        const maxFaculty = parseInt(formData.get('max_faculty') as string);

        if (minFaculty <= 0 || maxFaculty <= 0) {
            alert('Min faculty and max faculty must be greater than 0');
            return;
        }

        if (maxFaculty < minFaculty) {
            alert('Max faculty must be greater than or equal to min faculty');
            return;
        }

        if (initialValues?.id) {
            formData.set('id', initialValues.id);
        }
        await onSubmit(formData);
    }

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 400, maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 className="modal-title">{submitLabel} Event</h2>
                <form onSubmit={handleSubmit} style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
                    {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Event Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="form-input"
                            required
                            defaultValue={initialValues?.name || ''}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date" className="form-label">Event Date</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            className="form-input"
                            required
                            defaultValue={initialValues?.date || ''}
                        />
                    </div>
                    <div className="timezone-notice" style={{
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontStyle: 'italic'
                    }}>
                        📍 Enter event times in Central Time (CT/CST) - Northwestern University timezone
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="start_time" className="form-label">Start Time (Central Time)</label>
                            <input
                                id="start_time"
                                name="start_time"
                                type="time"
                                className="form-input"
                                required
                                defaultValue={initialValues?.start_time || '09:00'}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="end_time" className="form-label">End Time (Central Time)</label>
                            <input
                                id="end_time"
                                name="end_time"
                                type="time"
                                className="form-input"
                                required
                                defaultValue={initialValues?.end_time || '17:00'}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="available_slots" className="form-label">Sessions</label>
                        <input
                            id="available_slots"
                            name="available_slots"
                            type="text"
                            className="form-input"
                            required
                            pattern="^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d(,\s*([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)*$"
                            title="Format: 09:00 - 13:00, 15:00 - 17:00. Only valid 24-hour times allowed."
                            defaultValue={initialValues?.available_slots || '09:00 - 13:00, 15:00 - 17:00'}
                            placeholder="09:00 - 13:00, 15:00 - 17:00"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="min_faculty" className="form-label">
                                Min Faculty Preferences
                                <span
                                    className="tooltip-trigger"
                                    title="Minimum number of faculty members that attendees must select when updating their preferences"
                                    style={{
                                        marginLeft: '5px',
                                        cursor: 'help',
                                        color: '#6b7280',
                                        fontSize: '14px'
                                    }}
                                >
                                    ℹ️
                                </span>
                            </label>
                            <input
                                id="min_faculty"
                                name="min_faculty"
                                type="number"
                                min={1}
                                defaultValue={initialValues?.min_faculty || 3}
                                className="form-input"
                                required
                                onChange={(e) => {
                                    const minVal = parseInt(e.target.value);
                                    const maxInput = document.getElementById('max_faculty') as HTMLInputElement;
                                    if (maxInput && minVal > 0) {
                                        maxInput.min = minVal.toString();
                                    }
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="max_faculty" className="form-label">
                                Max Faculty Preferences
                                <span
                                    className="tooltip-trigger"
                                    title="Maximum number of faculty members that attendees can select when updating their preferences"
                                    style={{
                                        marginLeft: '5px',
                                        cursor: 'help',
                                        color: '#6b7280',
                                        fontSize: '14px'
                                    }}
                                >
                                    ℹ️
                                </span>
                            </label>
                            <input
                                id="max_faculty"
                                name="max_faculty"
                                type="number"
                                min={initialValues?.min_faculty || 3}
                                defaultValue={initialValues?.max_faculty || 5}
                                className="form-input"
                                required
                                onChange={(e) => {
                                    const maxVal = parseInt(e.target.value);
                                    const minInput = document.getElementById('min_faculty') as HTMLInputElement;
                                    if (minInput && maxVal > 0) {
                                        minInput.max = maxVal.toString();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="slotLen" className="form-label">Slot Length (minutes)</label>
                        <input
                            id="slotLen"
                            name="slotLen"
                            type="number"
                            min={15}
                            max={120}
                            step={15}
                            defaultValue={initialValues?.slot_len || 30}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            id="status"
                            name="status"
                            className="form-input"
                            defaultValue={initialValues?.status || 'CREATED'}
                            required
                        >
                            <option value="CREATED">CREATED</option>
                            <option value="COLLECTING_AVAIL">COLLECTING_AVAIL</option>
                            <option value="SCHEDULING">SCHEDULING</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="primary-btn"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 