// Interface and types for the matching algorithm

export interface MatchingInput {
    eventId: string;
    slots: string[]; // e.g., ["09:00-09:30", ...]
    professors: {
        id: string;
        availableSlots: string[];
    }[];
    students: {
        id: string;
        preferences: string[]; // professor ids, in order of preference
        availableSlots: string[];
    }[];
}

export interface ScheduledMeeting {
    eventId: string;
    professorId: string;
    studentId: string;
    slot: string;
}

export interface MatchingResult {
    meetings: ScheduledMeeting[];
    unmatchedStudents: string[]; // student ids
    unmatchedProfessors: string[]; // professor ids
    timeTakenSeconds?: number;
}

export interface IMatchingAlgorithm {
    computeMatches(input: MatchingInput): Promise<MatchingResult>;
} 