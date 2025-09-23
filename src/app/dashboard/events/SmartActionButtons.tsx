"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTransitionWarnings } from './EventStatusHelpers';

interface Event {
    id: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    start_time?: string;
    end_time?: string;
    available_slots?: string;
    min_faculty?: number;
    max_faculty?: number;
}

interface SmartActionButtonsProps {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete: () => void;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    warningItems?: string[];
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'danger' | 'info';
}

function ConfirmationModal({
    isOpen,
    title,
    message,
    warningItems = [],
    confirmText,
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    titleColor: 'text-red-800',
                    messageColor: 'text-red-700',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    titleColor: 'text-blue-800',
                    messageColor: 'text-blue-700',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            default: // warning
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    titleColor: 'text-yellow-800',
                    messageColor: 'text-yellow-700',
                    confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${styles.bg} border ${styles.border} rounded-lg p-6 max-w-md w-full mx-4`}>
                <h3 className={`text-lg font-semibold ${styles.titleColor} mb-3`}>{title}</h3>
                <p className={`${styles.messageColor} mb-4`}>{message}</p>

                {warningItems.length > 0 && (
                    <ul className={`${styles.messageColor} mb-4 space-y-1`}>
                        {warningItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-sm">•</span>
                                <span className="text-sm">{item}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SmartActionButtons({ event, onEdit, onDelete }: SmartActionButtonsProps) {
    const [showConfirmation, setShowConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        warningItems?: string[];
        confirmText: string;
        action: () => void;
        type?: 'warning' | 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        action: () => { },
    });

    const router = useRouter();

    // Helper function to extract slots and format them for API
    function formatSlotsForAPI(availableSlots: any): string {
        if (!availableSlots) return '';

        console.log('Original available_slots:', availableSlots);

        // If it's already an object with slots property
        if (typeof availableSlots === 'object' && availableSlots !== null && Array.isArray(availableSlots.slots)) {
            const result = availableSlots.slots.join(', ');
            console.log('Formatted from object.slots:', result);
            return result;
        }

        // If it's already an array
        if (Array.isArray(availableSlots)) {
            const result = availableSlots.join(', ');
            console.log('Formatted from array:', result);
            return result;
        }

        // If it's a string, try to parse as JSON
        if (typeof availableSlots === 'string') {
            try {
                const parsed = JSON.parse(availableSlots);
                console.log('Parsed JSON:', parsed);

                if (Array.isArray(parsed)) {
                    const result = parsed.join(', ');
                    console.log('Formatted as array:', result);
                    return result;
                } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slots)) {
                    const result = parsed.slots.join(', ');
                    console.log('Formatted as object.slots:', result);
                    return result;
                }
            } catch {
                // Not JSON, assume it's already comma-separated
                console.log('Not JSON, using as-is:', availableSlots);
                return availableSlots;
            }
        }

        // Fallback
        console.log('Fallback, using as-is:', availableSlots);
        return String(availableSlots);
    }

    // Server action to update event status
    async function updateEventStatus(eventId: string, newStatus: string) {
        const formData = new FormData();
        formData.append('id', eventId);
        formData.append('name', event.name);
        formData.append('date', event.date);
        formData.append('slotLen', event.slot_len.toString());
        formData.append('status', newStatus);
        formData.append('start_time', event.start_time || '');
        formData.append('end_time', event.end_time || '');
        formData.append('available_slots', formatSlotsForAPI(event.available_slots));
        formData.append('min_faculty', (event.min_faculty || 3).toString());
        formData.append('max_faculty', (event.max_faculty || 5).toString());

        try {
            const response = await fetch('/api/events/update-status', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('API Error:', response.status, errorData);
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to update status`);
            }

            router.refresh();
        } catch (error) {
            console.error('Error updating status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error updating event status: ${errorMessage}`);
        }
    }

    const handleStatusTransition = (newStatus: string, title: string, message: string, type?: 'warning' | 'danger' | 'info') => {
        const rawWarnings = getTransitionWarnings(event.status, newStatus);
        // Clean up any existing bullet points to avoid double bullets
        const cleanWarnings = rawWarnings.map(warning =>
            warning.replace(/^[\s•·‣▪▫⁃◦‣]*\s*/, '').trim()
        );

        setShowConfirmation({
            isOpen: true,
            title,
            message,
            warningItems: cleanWarnings,
            confirmText: 'Continue',
            action: () => {
                updateEventStatus(event.id, newStatus);
                setShowConfirmation(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    const renderActionButtons = () => {
        switch (event.status) {
            case 'CREATED':
                return (
                    <div className="space-y-3">
                        <div className="flex">
                            <button
                                onClick={() => onEdit(event)}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mr-3"
                            >
                                📝 Configure Event
                            </button>
                            <button
                                onClick={() => handleStatusTransition(
                                    'COLLECTING_AVAIL',
                                    'Start Collecting Inputs',
                                    'This will allow faculty and students to submit their availability and preferences.',
                                    'info'
                                )}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                ▶️ Start Collecting Inputs
                            </button>
                        </div>
                    </div>
                );

            case 'COLLECTING_AVAIL':
                return (
                    <div className="space-y-3">
                        <div className="flex">
                            <button
                                onClick={() => handleStatusTransition(
                                    'CREATED',
                                    'Return to Setup',
                                    'This will hide the event from faculty and students while you make configuration changes.',
                                    'warning'
                                )}
                                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium mr-3"
                            >
                                ⬅️ Back to Setup
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/faculty')}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mr-3"
                            >
                                📊 View Submissions
                            </button>
                            <button
                                onClick={() => handleStatusTransition(
                                    'SCHEDULING',
                                    'Generate Schedule',
                                    'This will prepare the event for schedule generation and hide it from further input collection.',
                                    'info'
                                )}
                                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                ▶️ Generate Schedule
                            </button>
                        </div>
                    </div>
                );

            case 'SCHEDULING':
                return (
                    <div className="space-y-3">
                        <div className="flex">
                            <button
                                onClick={() => handleStatusTransition(
                                    'COLLECTING_AVAIL',
                                    'Collect More Inputs',
                                    'This will allow faculty and students to modify their availability and preferences again.',
                                    'warning'
                                )}
                                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium mr-3"
                            >
                                ⬅️ Collect More Inputs
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/scheduler')}
                                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium mr-3"
                            >
                                🔄 Run Scheduler
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/meetings')}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mr-3"
                            >
                                📝 View/Edit Meetings
                            </button>
                            <button
                                onClick={() => handleStatusTransition(
                                    'PUBLISHED',
                                    'Publish Schedule',
                                    'This will make the schedule visible to all faculty and students.',
                                    'info'
                                )}
                                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                ▶️ Publish Schedule
                            </button>
                        </div>
                    </div>
                );

            case 'PUBLISHED':
                return (
                    <div className="space-y-3">
                        <div className="flex">
                            <button
                                onClick={() => router.push('/dashboard/meetings')}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mr-3"
                            >
                                📧 Send Notifications
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/meetings')}
                                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium mr-3"
                            >
                                📝 Adjust Meetings
                            </button>
                            <button
                                onClick={() => handleStatusTransition(
                                    'SCHEDULING',
                                    'Regenerate Schedule',
                                    'This will re-run the scheduling algorithm with current availability data.',
                                    'warning'
                                )}
                                className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium mr-3"
                            >
                                🔄 Regenerate Schedule
                            </button>
                            <button
                                onClick={() => handleStatusTransition(
                                    'COLLECTING_AVAIL',
                                    'Collect More Inputs',
                                    'This will allow major changes by reopening input collection.',
                                    'warning'
                                )}
                                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                            >
                                ⬅️ Collect More Inputs
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <button
                        onClick={() => onEdit(event)}
                        className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        📝 Edit Event
                    </button>
                );
        }
    };

    return (
        <div className="space-y-4">
            {renderActionButtons()}
            <div className="pt-2 border-t border-gray-200">
                <button
                    onClick={onDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    🗑️ Delete Event
                </button>
            </div>

            <ConfirmationModal
                isOpen={showConfirmation.isOpen}
                title={showConfirmation.title}
                message={showConfirmation.message}
                warningItems={showConfirmation.warningItems}
                confirmText={showConfirmation.confirmText}
                onConfirm={showConfirmation.action}
                onCancel={() => setShowConfirmation(prev => ({ ...prev, isOpen: false }))}
                type={showConfirmation.type}
            />
        </div>
    );
}