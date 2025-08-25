import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

export class GreedyScheduler implements IMatchingAlgorithm {
    async computeMatches(input: MatchingInput): Promise<MatchingResult> {
        console.log('[GreedyScheduler] Starting greedy matching algorithm');
        const meetings: ScheduledMeeting[] = [];
        const usedSlots = new Set<string>(); // key: studentId|slot or professorId|slot
        for (const student of input.students) {
            console.log(`[GreedyScheduler] Considering student ${student.id}`);
            for (const professorId of student.preferences) {
                console.log(`[GreedyScheduler]   Preference: professor ${professorId}`);
                // Find the professor object
                const professor = input.professors.find(p => p.id === professorId);
                if (!professor) {
                    console.log(`[GreedyScheduler]     Professor ${professorId} not found, skipping.`);
                    continue;
                }
                // Find the first slot where both are available and neither is booked
                const commonSlots = student.availableSlots.filter(slot => professor.availableSlots.includes(slot));
                console.log(`[GreedyScheduler]     Common slots: ${commonSlots.join(', ')}`);
                let scheduled = false;
                for (const slot of commonSlots) {
                    const studentSlotKey = `${student.id}|${slot}`;
                    const professorSlotKey = `${professor.id}|${slot}`;
                    if (!usedSlots.has(studentSlotKey) && !usedSlots.has(professorSlotKey)) {
                        meetings.push({
                            eventId: input.eventId,
                            professorId: professor.id,
                            studentId: student.id,
                            slot,
                        });
                        usedSlots.add(studentSlotKey);
                        usedSlots.add(professorSlotKey);
                        scheduled = true;
                        console.log(`[GreedyScheduler]     Scheduled meeting: student ${student.id} with professor ${professor.id} at slot ${slot}`);
                        break; // Only one meeting per student-professor pair
                    } else {
                        console.log(`[GreedyScheduler]     Slot ${slot} already used, skipping.`);
                    }
                }
                if (!scheduled) {
                    console.log(`[GreedyScheduler]     No available slot found for student ${student.id} and professor ${professor.id}`);
                }
            }
        }
        const matchedStudentIds = new Set(meetings.map(m => m.studentId));
        const matchedProfessorIds = new Set(meetings.map(m => m.professorId));
        const unmatchedStudents = input.students.map(s => s.id).filter(id => !matchedStudentIds.has(id));
        const unmatchedProfessors = input.professors.map(p => p.id).filter(id => !matchedProfessorIds.has(id));
        console.log(`[GreedyScheduler] Finished. Scheduled ${meetings.length} meetings. Unmatched students: ${unmatchedStudents.join(', ')}. Unmatched professors: ${unmatchedProfessors.join(', ')}`);
        return { meetings, unmatchedStudents, unmatchedProfessors };
    }
} 