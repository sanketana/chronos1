"use client";
import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "../actions";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleDelete() {
        if (confirm("Are you sure you want to delete this event?")) {
            await deleteEvent(eventId);
            startTransition(() => {
                router.refresh();
            });
        }
    }

    return (
        <button
            type="button"
            className="danger-btn"
            onClick={handleDelete}
            disabled={isPending}
            data-event-id={eventId}
        >
            {isPending ? "Deleting..." : "Delete"}
        </button>
    );
} 