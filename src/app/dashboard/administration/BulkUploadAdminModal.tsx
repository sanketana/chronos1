"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bulkUploadAdmins } from './actions';

interface BulkUploadAdminModalProps {
    onClose: () => void;
    isPending: boolean;
}

export default function BulkUploadAdminModal({ onClose, isPending }: BulkUploadAdminModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
        } else {
            alert('Please select a valid CSV file');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('CSV file must have at least a header row and one data row');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'email'];
            
            for (const header of requiredHeaders) {
                if (!headers.includes(header)) {
                    alert(`CSV file must have a '${header}' column`);
                    return;
                }
            }

            const records = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const record: Record<string, string> = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] || '';
                });
                return record;
            }).filter(record => record.name && record.email)
            .map(record => ({
                name: record.name,
                email: record.email,
                department: record.department || ''
            }));

            if (records.length === 0) {
                alert('No valid records found in CSV file');
                return;
            }

            const uploadResult = await bulkUploadAdmins(records);
            setResult(uploadResult);
            
            if (uploadResult.success > 0) {
                router.refresh();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = 'name,email,department\nJohn Doe,john.doe@example.com,Computer Science\nJane Smith,jane.smith@example.com,Mathematics';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>Bulk Upload Administrators</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                
                <div className="modal-content">
                    {!result ? (
                        <>
                            <div className="upload-instructions">
                                <p>Upload a CSV file with the following columns:</p>
                                <ul>
                                    <li><strong>name</strong> (required) - Full name of the admin</li>
                                    <li><strong>email</strong> (required) - Email address</li>
                                    <li><strong>department</strong> (optional) - Department name</li>
                                </ul>
                                <button onClick={downloadTemplate} className="link-btn">
                                    Download CSV Template
                                </button>
                            </div>

                            <div className="form-group">
                                <label htmlFor="csvFile" className="form-label">CSV File</label>
                                <input
                                    type="file"
                                    id="csvFile"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="form-input"
                                    disabled={uploading || isPending}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="secondary-btn"
                                    disabled={uploading || isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    className="primary-btn"
                                    disabled={!file || uploading || isPending}
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="upload-result">
                            <h3>Upload Complete</h3>
                            <div className="result-summary">
                                <p><strong>Successfully imported:</strong> {result.success}</p>
                                <p><strong>Failed to import:</strong> {result.failed}</p>
                            </div>
                            
                            {result.errors.length > 0 && (
                                <div className="error-list">
                                    <h4>Errors:</h4>
                                    <ul>
                                        {result.errors.map((error, index) => (
                                            <li key={index} className="error-item">{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="modal-actions">
                                <button
                                    onClick={onClose}
                                    className="primary-btn"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 