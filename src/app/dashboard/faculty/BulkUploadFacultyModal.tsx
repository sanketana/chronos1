"use client";
import React, { useState } from 'react';
import { bulkUploadFaculty } from './actions';

interface FacultyRecord {
    name: string;
    email: string;
    department: string;
    isValid: boolean;
    errors: string[];
}

interface BulkUploadResult {
    success: number;
    failed: number;
    errors: string[];
}

export default function BulkUploadFacultyModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [rawData, setRawData] = useState('');
    const [parsedRecords, setParsedRecords] = useState<FacultyRecord[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<BulkUploadResult | null>(null);
    const [step, setStep] = useState<'input' | 'preview' | 'result'>('input');

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const parseData = () => {
        if (!rawData.trim()) {
            alert('Please enter some data to process.');
            return;
        }

        const lines = rawData.trim().split('\n');
        const records: FacultyRecord[] = [];

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return; // Skip empty lines

            const columns = trimmedLine.split('\t');
            const record: FacultyRecord = {
                name: columns[0]?.trim() || '',
                email: columns[1]?.trim() || '',
                department: columns[2]?.trim() || '',
                isValid: true,
                errors: []
            };

            // Validation
            if (!record.name) {
                record.errors.push('Name is required');
                record.isValid = false;
            }

            if (!record.email) {
                record.errors.push('Email is required');
                record.isValid = false;
            } else if (!validateEmail(record.email)) {
                record.errors.push('Invalid email format');
                record.isValid = false;
            }

            if (!record.department) {
                record.errors.push('Department is required');
                record.isValid = false;
            }

            records.push(record);
        });

        setParsedRecords(records);
        setStep('preview');
    };

    const handleImport = async () => {
        const validRecords = parsedRecords.filter(record => record.isValid);
        if (validRecords.length === 0) {
            alert('No valid records to import.');
            return;
        }

        setIsImporting(true);
        try {
            const result = await bulkUploadFaculty(validRecords);
            setImportResult(result);
            setStep('result');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check the console for details.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setRawData('');
        setParsedRecords([]);
        setImportResult(null);
        setStep('input');
        onClose();
    };

    const handleSuccess = () => {
        onSuccess();
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2 className="modal-title">Bulk Upload Faculty</h2>

                {step === 'input' && (
                    <div>
                        <p className="mb-4">
                            Paste tab-separated values with the following format:<br />
                            <strong>Name &nbsp;&nbsp;&nbsp; Email &nbsp;&nbsp;&nbsp; Department</strong>
                        </p>
                        <p className="mb-4 text-sm text-gray-600">
                            Example:<br />
                            John Doe &nbsp;&nbsp;&nbsp; john.doe@university.edu &nbsp;&nbsp;&nbsp; Computer Science<br />
                            Jane Smith &nbsp;&nbsp;&nbsp; jane.smith@university.edu &nbsp;&nbsp;&nbsp; Mathematics
                        </p>
                        <div className="form-group">
                            <textarea
                                className="form-input font-mono text-sm"
                                style={{ height: '200px', resize: 'vertical' }}
                                placeholder="Paste your tab-separated data here..."
                                value={rawData}
                                onChange={(e) => setRawData(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={handleClose}>Cancel</button>
                            <button className="primary-btn" onClick={parseData}>Process Data</button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div>
                        <h3 className="mb-4">Preview Records</h3>
                        <div className="mb-4">
                            <p>Valid records: <span className="text-green-600 font-semibold">{parsedRecords.filter(r => r.isValid).length}</span></p>
                            <p>Invalid records: <span className="text-red-600 font-semibold">{parsedRecords.filter(r => !r.isValid).length}</span></p>
                        </div>

                        <div className="form-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="events-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRecords.map((record, index) => (
                                        <tr key={index} className={record.isValid ? 'bg-green-50' : 'bg-red-50'}>
                                            <td>{record.name}</td>
                                            <td>{record.email}</td>
                                            <td>{record.department}</td>
                                            <td>
                                                {record.isValid ? (
                                                    <span className="text-green-600">✓ Valid</span>
                                                ) : (
                                                    <div>
                                                        <span className="text-red-600">✗ Invalid</span>
                                                        <ul className="text-xs text-red-500 mt-1">
                                                            {record.errors.map((error, i) => (
                                                                <li key={i}>• {error}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setStep('input')}>Back</button>
                            <button
                                className="primary-btn"
                                onClick={handleImport}
                                disabled={isImporting || parsedRecords.filter(r => r.isValid).length === 0}
                            >
                                {isImporting ? 'Importing...' : 'Import Valid Records'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'result' && importResult && (
                    <div>
                        <h3 className="mb-4">Import Results</h3>
                        <div className="mb-4 p-4 bg-gray-50 rounded-md">
                            <p className="text-green-600 font-semibold">Successfully imported: {importResult.success}</p>
                            <p className="text-red-600 font-semibold">Failed to import: {importResult.failed}</p>
                            {importResult.errors.length > 0 && (
                                <div className="mt-3">
                                    <p className="font-semibold text-red-600">Errors:</p>
                                    <ul className="text-sm text-red-500 mt-1">
                                        {importResult.errors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="primary-btn" onClick={handleSuccess}>Done</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 