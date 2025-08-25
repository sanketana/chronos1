"use client";
import React, { useState, useEffect } from 'react';
import { Admin } from './AdministrationTableClient';

interface AddEditAdminModalProps {
    admin?: Admin | null;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
    isPending: boolean;
}

export default function AddEditAdminModal({ admin, onClose, onSubmit, isPending }: AddEditAdminModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('active');

    useEffect(() => {
        if (admin) {
            setName(admin.name);
            setEmail(admin.email);
            setDepartment(admin.department || '');
            setStatus(admin.status);
        }
    }, [admin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !email.trim()) {
            alert('Name and email are required');
            return;
        }

        const formData = new FormData();
        if (admin) {
            formData.append('id', admin.id);
        }
        formData.append('name', name.trim());
        formData.append('email', email.trim());
        formData.append('department', department.trim());
        formData.append('status', status);

        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>{admin ? 'Edit Admin' : 'Add New Admin'}</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email *</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="department" className="form-label">Department</label>
                        <input
                            type="text"
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="form-input"
                            disabled={isPending}
                        />
                    </div>

                    {admin && (
                        <div className="form-group">
                            <label htmlFor="status" className="form-label">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="form-select"
                                disabled={isPending}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="secondary-btn"
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={isPending}
                        >
                            {isPending ? 'Saving...' : (admin ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 