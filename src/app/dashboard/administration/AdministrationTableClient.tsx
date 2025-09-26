"use client";
import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddEditAdminModal from './AddEditAdminModal';
import BulkUploadAdminModal from './BulkUploadAdminModal';
import { createAdmin, updateAdmin, deleteAdmin, resetAdminPassword } from './actions';

export interface Admin {
    id: string;
    name: string;
    email: string;
    department: string;
    status: string;
    created_at: string;
}

interface AdministrationTableClientProps {
    admins: Admin[];
}

export default function AdministrationTableClient({ admins }: AdministrationTableClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [defaultPassword, setDefaultPassword] = useState<string>('welcome123');

    useEffect(() => {
        async function fetchDefaultPassword() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) throw new Error('Not authenticated');
                const data = await res.json();
                setDefaultPassword(data.defaultPassword || 'welcome123');
            } catch {
                // Keep default value
            }
        }
        fetchDefaultPassword();
    }, []);

    const handleAddAdmin = async (formData: FormData) => {
        startTransition(async () => {
            try {
                await createAdmin(formData);
                setIsAddModalOpen(false);
                router.refresh();
            } catch (error) {
                console.error('Failed to create admin:', error);
                alert(error instanceof Error ? error.message : 'Failed to create admin');
            }
        });
    };

    const handleUpdateAdmin = async (formData: FormData) => {
        startTransition(async () => {
            try {
                await updateAdmin(formData);
                setEditingAdmin(null);
                router.refresh();
            } catch (error) {
                console.error('Failed to update admin:', error);
                alert(error instanceof Error ? error.message : 'Failed to update admin');
            }
        });
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm('Are you sure you want to delete this admin?')) return;

        startTransition(async () => {
            try {
                await deleteAdmin(id);
                router.refresh();
            } catch (error) {
                console.error('Failed to delete admin:', error);
                alert(error instanceof Error ? error.message : 'Failed to delete admin');
            }
        });
    };

    const handleResetPassword = async (admin: Admin) => {
        const confirmMessage = `Are you sure you want to reset the password for ${admin.name} (${admin.email})?\n\nThe password will be set to: "${defaultPassword}"`;
        if (!confirm(confirmMessage)) return;

        startTransition(async () => {
            try {
                await resetAdminPassword(admin.id);
                alert(`Password reset successfully for ${admin.name}`);
                router.refresh();
            } catch (error) {
                console.error('Failed to reset password:', error);
                alert(error instanceof Error ? error.message : 'Failed to reset password');
            }
        });
    };

    return (
        <div className="table-container">
            <div className="table-header">
                <div className="table-actions">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="primary-btn"
                        disabled={isPending}
                    >
                        Add Admin
                    </button>
                    <button
                        onClick={() => setIsBulkUploadModalOpen(true)}
                        className="secondary-btn"
                        disabled={isPending}
                    >
                        Bulk Upload
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="no-data">
                                    No administrators found
                                </td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id}>
                                    <td>{admin.name}</td>
                                    <td>{admin.email}</td>
                                    <td>{admin.department || '-'}</td>
                                    <td>
                                        <span className={`status-badge status-${admin.status}`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => setEditingAdmin(admin)}
                                                className="edit-btn"
                                                disabled={isPending}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(admin)}
                                                className="warning-btn"
                                                disabled={isPending}
                                                style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', margin: '0 4px' }}
                                            >
                                                Reset Password
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin.id)}
                                                className="delete-btn"
                                                disabled={isPending}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <AddEditAdminModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddAdmin}
                    isPending={isPending}
                />
            )}

            {editingAdmin && (
                <AddEditAdminModal
                    admin={editingAdmin}
                    onClose={() => setEditingAdmin(null)}
                    onSubmit={handleUpdateAdmin}
                    isPending={isPending}
                />
            )}

            {isBulkUploadModalOpen && (
                <BulkUploadAdminModal
                    onClose={() => setIsBulkUploadModalOpen(false)}
                    isPending={isPending}
                />
            )}
        </div>
    );
} 