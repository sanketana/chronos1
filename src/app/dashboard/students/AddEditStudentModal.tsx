"use client";
import React, { useState, FormEvent } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    initialValues?: {
        id?: string;
        name?: string;
        email?: string;
        department?: string;
        status?: string;
    };
    isEdit?: boolean;
}

export default function AddEditStudentModal({ isOpen, onClose, onSubmit, initialValues = {}, isEdit = false }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        if (initialValues.id) formData.set('id', initialValues.id);
        try {
            await onSubmit(formData);
            setLoading(false);
            onClose();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to save student');
            } else {
                setError('Failed to save student');
            }
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2 className="modal-title">{isEdit ? 'Edit Attendee' : 'Add Attendee'}</h2>
                <form onSubmit={handleSubmit}>
                    {initialValues.id && <input type="hidden" name="id" value={initialValues.id} />}
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input name="name" type="text" className="form-input" required defaultValue={initialValues.name || ''} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input name="email" type="email" className="form-input" required defaultValue={initialValues.email || ''} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <input name="department" type="text" className="form-input" defaultValue={initialValues.department || ''} />
                    </div>
                    {isEdit && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select name="status" className="form-input" defaultValue={initialValues.status || 'active'}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    )}
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading}>{loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Attendee')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
} 