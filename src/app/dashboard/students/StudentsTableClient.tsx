"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditStudentModal from './AddEditStudentModal';
import BulkUploadStudentModal from './BulkUploadStudentModal';
import UpdatePreferenceModal from './UpdatePreferenceModal';
import { createStudent, updateStudent, deleteStudent, resetStudentPassword } from './actions';

export interface Student {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

export default function StudentsTableClient({ students }: { students: Student[] }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [isPreferenceModalOpen, setPreferenceModalOpen] = useState(false);
    const [preferenceStudent, setPreferenceStudent] = useState<Student | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [defaultPassword, setDefaultPassword] = useState<string>('welcome123');

    useEffect(() => {
        async function fetchRoleAndId() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setRole(data.role);
                setUserId(data.userId || data.id || null);
                setDefaultPassword(data.defaultPassword || 'welcome123');
            } catch {
                setRole(null);
                setUserId(null);
            }
        }
        fetchRoleAndId();
    }, []);

    function handleAddClick() {
        setEditStudent(null);
        setIsEdit(false);
        setModalOpen(true);
    }

    function handleBulkUploadClick() {
        setBulkUploadModalOpen(true);
    }

    function handleEditClick(student: Student) {
        setEditStudent(student);
        setIsEdit(true);
        setModalOpen(true);
    }

    function handlePreferenceClick(student: Student) {
        setPreferenceStudent(student);
        setPreferenceModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        await deleteStudent(id);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleResetPassword(student: Student) {
        const confirmMessage = `Are you sure you want to reset the password for ${student.name} (${student.email})?\n\nThe password will be set to: "${defaultPassword}"`;
        if (!window.confirm(confirmMessage)) return;

        try {
            await resetStudentPassword(student.id);
            alert(`Password reset successfully for ${student.name}`);
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            alert(`Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async function handleCreate(formData: FormData) {
        await createStudent(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleEdit(formData: FormData) {
        await updateStudent(formData);
        startTransition(() => {
            router.refresh();
        });
    }

    function handleBulkUploadSuccess() {
        // After bulk upload, refresh the page to update student list
        router.refresh();
    }

    return (
        <div>
            <AddEditStudentModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={isEdit ? handleEdit : handleCreate}
                initialValues={editStudent || {}}
                isEdit={isEdit}
            />
            <BulkUploadStudentModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setBulkUploadModalOpen(false)}
                onSuccess={handleBulkUploadSuccess}
            />
            <UpdatePreferenceModal
                isOpen={isPreferenceModalOpen}
                onClose={() => setPreferenceModalOpen(false)}
                student={preferenceStudent || { id: '', name: '' }}
            />
            {(role === 'admin' || role === 'superadmin') && (
                <div className="mb-4 flex">
                    <button className="primary-btn" style={{ width: '200px', height: '44px' }} onClick={handleAddClick}>+ Create New Attendee</button>
                    <button className="secondary-btn" style={{ width: '200px', height: '44px', marginLeft: '16px' }} onClick={handleBulkUploadClick}>+ Bulk Upload</button>
                </div>
            )}
            {students.length === 0 ? (
                <div>No students found or error loading students. Check server logs for details.</div>
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
                        {students.map((s: Student) => {
                            return (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.department || '-'}</td>
                                    <td>{s.status}</td>
                                    <td>
                                        {(role === 'admin' || role === 'superadmin') ? (
                                            <>
                                                <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handleEditClick(s)}>Edit</button>
                                                <button className="secondary-btn" style={{ marginRight: '0.5rem' }} onClick={() => handlePreferenceClick(s)}>Update Preferences</button>
                                                <button className="warning-btn" style={{ marginRight: '0.5rem', backgroundColor: '#f59e0b', color: 'white', border: 'none' }} onClick={() => handleResetPassword(s)}>
                                                    Reset Password
                                                </button>
                                                <button className="danger-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                                            </>
                                        ) : (role === 'student' && userId === s.id) ? (
                                            <button className="secondary-btn" onClick={() => handlePreferenceClick(s)}>Update Preferences</button>
                                        ) : null}
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