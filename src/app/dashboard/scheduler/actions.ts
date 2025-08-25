'use server';
import { runScheduler } from './index';
import { MatchingResult } from './IMatchingAlgorithm';

export async function runSchedulerAction(eventId: string, algorithm: string = 'CustomIntegerProgramming'): Promise<MatchingResult> {
    return await runScheduler(eventId, algorithm);
} 