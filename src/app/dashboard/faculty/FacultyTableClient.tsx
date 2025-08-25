"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditFacultyModal from './AddEditFacultyModal';
import BulkUploadFacultyModal from './BulkUploadFacultyModal';
import { createFaculty, updateFaculty, deleteFaculty } from './actions';
import UpdateAvailabilityModal from './UpdateAvailabilityModal';

export interface Faculty {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

export default function FacultyTableClient({ faculty }: { faculty: Faculty[] }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const [isAvailabilityModalOpen, setAvailabilityModalOpen] = useState(false);
    const [availabilityFaculty, setAvailabilityFaculty] = useState<Faculty | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoleAndId() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
                setUserId(data.userId || data.id || null);
            } catch {
                setRole(null);
                setUserId(null);
            }
        }
        fetchRoleAndId();
    }, []);

    function handleAddClick() {
        setEditFaculty(null);
        setIsEdit(false);
        setModalOpen(true);
    }

    function handleBulkUploadClick() {
        setBulkUploadModalOpen(true);
    }

    function handleEditClick(faculty: Faculty) {
        setEditFaculty(faculty);
        setIsEdit(true);
        setModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
        await deleteFaculty(id);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleCreate(formData: FormData) {
        await createFaculty(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleEdit(formData: FormData) {
        await updateFaculty(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    function handleUpdateAvailabilityClick(faculty: Faculty) {
        setAvailabilityFaculty(faculty);
        setAvailabilityModalOpen(true);
    }

    function handleAvailabilitySubmit() {
        // After saving, refresh the page to update availabilities
        router.refresh();
    }

    function handleBulkUploadSuccess() {
        // After bulk upload, refresh the page to update faculty list
        router.refresh();
    }

    return (
        <div>
            <AddEditFacultyModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editFaculty || {}}
                isEdit={isEdit}
            />
            <BulkUploadFacultyModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setBulkUploadModalOpen(false)}
                onSuccess={handleBulkUploadSuccess}
            />
            <UpdateAvailabilityModal
                isOpen={isAvailabilityModalOpen}
                onClose={() => setAvailabilityModalOpen(false)}
                faculty={availabilityFaculty || { id: '', name: '' }}
                onSubmit={handleAvailabilitySubmit}
            />
            {(role === 'admin' || role === 'superadmin') && (
                <div className="mb-4 flex">
                    <button className="primary-btn" style={{ width: '200px', height: '44px' }} onClick={handleAddClick}>+ Create New Faculty</button>
                    <button className="secondary-btn" style={{ width: '200px', height: '44px', marginLeft: '16px' }} onClick={handleBulkUploadClick}>+ Bulk Upload</button>
                </div>
            )}
            {faculty.length === 0 ? (
                <div>No faculty found or error loading faculty. Check server logs for details.</div>
            ) : (
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculty.map((f: Faculty) => {
                            return (
                                <tr key={f.id}>
                                    <td>{f.name}</td>
                                    <td>{f.email}</td>
                                    <td>{f.department || '-'}</td>
                                    <td>{f.status}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {(role === 'admin' || role === 'superadmin') ? (
                                                <>
                                                    <button className="secondary-btn" onClick={() => handleEditClick(f)}>Edit</button>
                                                    <button className="secondary-btn" onClick={() => handleUpdateAvailabilityClick(f)}>
                                                        Update Availability
                                                    </button>
                                                    <button className="danger-btn" onClick={() => handleDelete(f.id)}>Delete</button>
                                                </>
                                            ) : (role === 'faculty' && userId === f.id) ? (
                                                <button className="secondary-btn" onClick={() => handleUpdateAvailabilityClick(f)}>
                                                    Update Availability
                                                </button>
                                            ) : null}
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