"use client";
import React, { useState } from 'react';
import StudentsTableClient from './StudentsTableClient';
import PreferencesTableClient from './PreferencesTableClient';
import type { Student } from './StudentsTableClient';
import type { Preference } from './PreferencesTableClient';
// If Preference is defined elsewhere, import it. Otherwise, define and export it in a shared file.
export default function StudentsTabsClient({ students, preferences, faculty }: { students: Student[]; preferences: Preference[]; faculty: { id: string; name: string }[] }) {
    const [tab, setTab] = useState<'students' | 'preferences'>('students');
    return (
        <div>
            <h1 className="dashboard-title">Attendees</h1>
            <div className="tabs" role="tablist">
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'students'}
                    onClick={() => setTab('students')}
                    tabIndex={0}
                >
                    Attendees
                </button>
                <button
                    className="tab-btn"
                    role="tab"
                    aria-selected={tab === 'preferences'}
                    onClick={() => setTab('preferences')}
                    tabIndex={0}
                >
                    Preferences
                </button>
            </div>
            {tab === 'students' ? (
                <StudentsTableClient students={students} />
            ) : (
                <PreferencesTableClient preferences={preferences} faculty={faculty} />
            )}
        </div>
    );
} 