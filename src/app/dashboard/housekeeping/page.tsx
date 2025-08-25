"use client";
import React, { useState } from "react";
import { deleteAllMeetings } from './housekeepingActions';

export default function HousekeepingPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleDeleteAll() {
        if (!window.confirm('Do you really want to delete all meetings?')) return;
        setLoading(true);
        setMessage("");
        try {
            const deletedCount = await deleteAllMeetings();
            setMessage(`Deleted ${deletedCount} meetings (all meetings deleted).`);
        } catch {
            setMessage("Error deleting all meetings.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Housekeeping: Delete All Meetings</h1>
            <div className="flex flex-col items-start gap-3 mt-2">
                <button
                    className="danger-btn px-6 py-2 rounded disabled:opacity-50"
                    style={{ minWidth: 150, fontSize: '1rem', height: '40px', lineHeight: '1.5' }}
                    disabled={loading}
                    onClick={handleDeleteAll}
                >
                    {loading ? "Deleting..." : "Delete All Meetings"}
                </button>
            </div>
            {message && <div className="mt-4 text-lg font-semibold">{message}</div>}
        </div>
    );
} 