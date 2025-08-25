"use client";
import { useState, useTransition } from 'react';
import EventModal from './EventModal';
import { createEvent, updateEvent } from './actions';
import { useRouter } from 'next/navigation';

interface Event {
    id?: string;
    name: string;
    date: string;
    slot_len: number;
    status: string;
    created_at?: string;
}

export default function EventModalButton({ event }: { event?: Event }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [isPending] = useTransition();
    const router = useRouter();

    async function handleEventSubmit(formData: FormData) {
        if (event) {
            await updateEvent(formData);
        } else {
            await createEvent(formData);
        }
        setModalOpen(false);
        router.refresh();
    }

    return (
        <>
            <button
                className={event ? "secondary-btn" : "event-modal-btn"}
                onClick={() => setModalOpen(true)}
                disabled={isPending}
            >
                {event ? "Edit" : "+ Create New Event"}
            </button>
            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleEventSubmit}
                initialValues={event}
                submitLabel={event ? "Update" : "Create"}
            />
        </>
    );
} 