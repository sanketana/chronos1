"use client";
import React, { useState, useEffect, useRef } from "react";
import { getEventsForInputCollection } from "../actions";
import { upsertAvailability, getAllAvailabilitiesForFaculty } from "./actions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    faculty: { id: string; name: string };
    onSubmit: (data: { eventId: string; slots: string[]; preferences: string }) => void;
}

function getTimeSlots(start: string, end: string, slotLen: number): string[] {
    // start, end: "HH:mm", slotLen: minutes
    const slots: string[] = [];
    const [h, m] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let cur = h * 60 + m;
    const endMin = eh * 60 + em;
    while (cur + slotLen <= endMin) {
        const sh = String(Math.floor(cur / 60)).padStart(2, "0");
        const sm = String(cur % 60).padStart(2, "0");
        const ehh = String(Math.floor((cur + slotLen) / 60)).padStart(2, "0");
        const emm = String((cur + slotLen) % 60).padStart(2, "0");
        slots.push(`${sh}:${sm}-${ehh}:${emm}`);
        cur += slotLen;
    }
    return slots;
}

function formatTime12h(timeStr: string) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const finalHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${finalHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Helper to generate slots within a range
function getSlotsFromRanges(ranges: string[], slotLen: number): string[] {
    const slots: string[] = [];
    for (const range of ranges) {
        const [start, end] = range.split('-').map(s => s.trim());
        const [h, m] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        let cur = h * 60 + m;
        const endMin = eh * 60 + em;
        while (cur + slotLen <= endMin) {
            const sh = String(Math.floor(cur / 60)).padStart(2, "0");
            const sm = String(cur % 60).padStart(2, "0");
            const ehh = String(Math.floor((cur + slotLen) / 60)).padStart(2, "0");
            const emm = String((cur + slotLen) % 60).padStart(2, "0");
            slots.push(`${sh}:${sm}-${ehh}:${emm}`);
            cur += slotLen;
        }
    }
    return slots;
}

export default function UpdateAvailabilityModal({ isOpen, onClose, faculty, onSubmit }: Props) {
    const [eventId, setEventId] = useState("");
    const [events, setEvents] = useState<unknown[]>([]);
    const [slotLen, setSlotLen] = useState(30);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [allSlots, setAllSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const selectAllRef = useRef<HTMLInputElement>(null);

    // Prefetch events that are collecting inputs on mount (not just when modal opens)
    useEffect(() => {
        async function fetchEvents() {
            const eventsData = await getEventsForInputCollection();
            setEvents(eventsData);
        }
        fetchEvents();
    }, []);

    // Prefetch all availabilities for this faculty when modal opens
    useEffect(() => {
        async function fetchAvailabilities() {
            if (isOpen && faculty.id) {
                const allAvail = await getAllAvailabilitiesForFaculty(faculty.id);
                const availMap: Record<string, string[]> = {};
                for (const row of allAvail) {
                    availMap[row.event_id] = Array.isArray(row.unavailable_slots) ? row.unavailable_slots : [];
                }
                // setFacultyAvailabilities(availMap); // This line is removed
            }
        }
        fetchAvailabilities();
    }, [isOpen, faculty.id]);

    useEffect(() => {
        if (!eventId) return;
        const ev = (events as unknown[]).find(e => (e as { id: string }).id === eventId) as { slot_len?: number; start_time?: string; end_time?: string; available_slots?: string[] | string } | undefined;
        if (ev) {
            setSlotLen(ev.slot_len ?? 30);
            setStartTime(ev.start_time ?? "");
            setEndTime(ev.end_time ?? "");
            let slotsFromEvent: string[] = [];
            if (ev.available_slots && ev.available_slots.length > 0) {
                let ranges: string[] = [];
                if (typeof ev.available_slots === 'string') {
                    try {
                        const parsed = JSON.parse(ev.available_slots);
                        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slots)) {
                            ranges = parsed.slots;
                        } else {
                            ranges = [];
                        }
                    } catch {
                        ranges = [];
                    }
                } else {
                    ranges = ev.available_slots;
                }
                slotsFromEvent = getSlotsFromRanges(ranges, slotLen);
            } else {
                slotsFromEvent = getTimeSlots(ev.start_time ?? '', ev.end_time ?? '', ev.slot_len ?? slotLen);
            }
            setAllSlots(slotsFromEvent);
            setAvailableSlots(slotsFromEvent); // select all by default
        }
    }, [eventId, events, slotLen]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = availableSlots.length > 0 && availableSlots.length < allSlots.length;
        }
    }, [availableSlots, allSlots]);

    useEffect(() => {
        if (isOpen) {
            setStartTime("");
            setEndTime("");
        }
    }, [isOpen]);

    function handleSlotToggle(slot: string) {
        setAvailableSlots(prev => prev.includes(slot)
            ? prev.filter(s => s !== slot)
            : [...prev, slot]
        );
    }

    function handleSave() {
        if (!eventId) return;
        setLoading(true);
        upsertAvailability({ facultyId: faculty.id, eventId, slots: availableSlots, preferences: "" })
            .then(() => {
                setLoading(false);
                onSubmit({ eventId, slots: availableSlots, preferences: "" });
                onClose();
            })
            .catch(e => {
                setError(e.message || "Failed to save");
                setLoading(false);
            });
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ minWidth: 360, maxWidth: 540, minHeight: 700, maxHeight: 900, background: 'var(--northwestern-surface)' }}>
                <h2 className="modal-title mb-4">Update Availability for <span className="text-nw-purple font-semibold">{faculty.name}</span></h2>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="form-label font-bold">Select Event</label>
                        {events.length === 0 ? (
                            <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                                <strong>No events available for input collection.</strong><br />
                                Events must be in &quot;Collecting Inputs&quot; status for faculty to provide availability.
                            </div>
                        ) : (
                            <select className="form-input rounded-md border-gray-300 focus:border-nw-purple focus:ring-nw-purple" value={eventId} onChange={e => setEventId(e.target.value)} required>
                                <option value="">Select Event</option>
                                {(events as unknown[]).map(ev => {
                                    const event = ev as { id: string; name: string; date?: string };
                                    return (
                                        <option key={event.id} value={event.id}>
                                            {event.name} ({event.date ? (typeof event.date === 'string' ? event.date.slice(0, 10) : new Date(event.date).toISOString().slice(0, 10)) : ""})
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                    {eventId && (
                        <>
                            <div className="form-group bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col md:flex-row md:items-center md:gap-6 text-sm text-gray-700 dark:text-gray-200">
                                    <div><b>Event Timings:</b> {formatTime12h(startTime)} - {formatTime12h(endTime)}</div>
                                    <div><b>Slot Length:</b> {slotLen} min</div>
                                </div>
                            </div>
                            <div className="timezone-notice" style={{
                                marginBottom: '12px',
                                fontSize: '12px',
                                color: '#6b7280',
                                fontStyle: 'italic'
                            }}>
                                📍 Enter your availability in Central Time (CT/CST) - Northwestern University timezone
                            </div>
                            <div className="form-group mt-2">
                                <div className="font-bold text-gray-800 mb-3" style={{ fontWeight: 700 }}>I am available at below slots</div>
                                <div className="w-full">
                                    <div className="flex items-center mb-3 p-3 rounded border-2 border-nw-purple bg-white shadow" style={{ position: 'relative', zIndex: 2 }}>
                                        <input
                                            type="checkbox"
                                            id="selectAllSlots"
                                            ref={selectAllRef}
                                            checked={availableSlots.length === allSlots.length && allSlots.length > 0}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setAvailableSlots(allSlots);
                                                } else {
                                                    setAvailableSlots([]);
                                                }
                                            }}
                                            aria-checked={availableSlots.length > 0 && availableSlots.length < allSlots.length ? 'mixed' : availableSlots.length === allSlots.length}
                                        />
                                        <label htmlFor="selectAllSlots" className="ml-2 font-bold cursor-pointer text-nw-purple" style={{ letterSpacing: 1 }}>Select/Deselect All</label>
                                    </div>
                                    <hr className="mb-2 border-t-2 border-nw-purple" />
                                    <div className="flex flex-col gap-2 w-full" style={{ maxHeight: 500, overflowY: 'auto' }}>
                                        {allSlots.map((slot: string, idx: number) => (
                                            <label
                                                key={slot}
                                                className={`flex items-center gap-2 px-3 py-2 rounded w-full ${idx % 2 === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-purple-50 dark:bg-gray-800'}`}
                                                style={{ marginBottom: 4, display: 'block', border: '1px solid #e5e7eb' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={availableSlots.includes(slot)}
                                                    onChange={() => handleSlotToggle(slot)}
                                                />
                                                <span>{slot}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
                    <div className="modal-actions flex justify-end gap-2 mt-4">
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="button" className="primary-btn" onClick={handleSave} disabled={loading || !eventId}>{loading ? "Saving..." : "Save"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
} 