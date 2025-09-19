'use server';
import { MatchingInput } from './IMatchingAlgorithm';
import { getAllEvents } from '../actions';
import { getAllAvailabilities } from '../faculty/actions';
import { getAllPreferences } from '../students/actions';

// Helper to generate all slots for an event
function generateSlots(startTime: string, endTime: string, slotLen: number): string[] {
    const slots: string[] = [];
    let [h, m] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    while (h < endH || (h === endH && m < endM)) {
        const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        let nextM = m + slotLen;
        let nextH = h;
        if (nextM >= 60) {
            nextH += Math.floor(nextM / 60);
            nextM = nextM % 60;
        }
        const end = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
        slots.push(`${start}-${end}`);
        h = nextH;
        m = nextM;
    }
    return slots;
}

export async function prepareMatchingInput(eventId: string): Promise<MatchingInput> {
    try {
        // Fetch all data
        const [events, availabilities, preferences] = await Promise.all([
            getAllEvents(),
            getAllAvailabilities(),
            getAllPreferences(),
        ]);

        const event = events.find(e => e.id === eventId);
        if (!event) throw new Error('Event not found');

        // Professors
        const professors = availabilities
            .filter((a: unknown) => (a as { event_id: string }).event_id === eventId)
            .map((a: unknown) => {
                const av = a as { faculty_id: string; available_slots?: string[] | string };
                let availableSlots: string[] = [];
                if (av.available_slots) {
                    availableSlots = typeof av.available_slots === 'string' ? JSON.parse(av.available_slots) : av.available_slots;
                }
                return {
                    id: av.faculty_id,
                    availableSlots,
                };
            });

        // Students
        const students = preferences
            .filter((p: unknown) => (p as { event_id: string }).event_id === eventId)
            .map((p: unknown) => {
                const pref = p as { student_id: string; professor_ids: string[] | string; available_slots?: string[] | string };
                let availableSlots: string[] = [];
                if (pref.available_slots) {
                    availableSlots = typeof pref.available_slots === 'string' ? JSON.parse(pref.available_slots) : pref.available_slots;
                }
                return {
                    id: pref.student_id,
                    preferences: (typeof pref.professor_ids === 'string' ? JSON.parse(pref.professor_ids) : pref.professor_ids) as string[],
                    availableSlots,
                };
            });

        // Extract slots from event's available_slots JSON
        let eventSlots: string[] = [];
        if (event.available_slots) {
            try {
                const parsed = JSON.parse(event.available_slots);
                if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slots)) {
                    eventSlots = parsed.slots;
                }
            } catch {
                // If parsing fails, assume it's the old format
                eventSlots = typeof event.available_slots === 'string' ? JSON.parse(event.available_slots) : event.available_slots;
            }
        }

        // Ensure eventSlots is an array before checking length
        if (!Array.isArray(eventSlots)) {
            if (typeof eventSlots === 'string') {
                try {
                    eventSlots = JSON.parse(eventSlots);
                } catch {
                    eventSlots = [];
                }
            } else {
                eventSlots = [];
            }
        }

        // If we couldn't extract slots from the new format, fall back to generating them
        if (eventSlots.length === 0) {
            eventSlots = generateSlots(event.start_time, event.end_time, event.slot_len);
        }


        return {
            eventId,
            slots: eventSlots,
            professors,
            students,
        };
    } catch (error) {
        throw error;
    }
} 