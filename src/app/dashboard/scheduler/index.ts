'use server';
import { prepareMatchingInput } from './dataPreparation';
import { GreedyScheduler } from './GreedyScheduler';
import { CustomIntegerProgrammingScheduler } from './CustomIntegerProgrammingScheduler';
import { saveMeetings } from './resultHandler';
import { MatchingResult, IMatchingAlgorithm } from './IMatchingAlgorithm';
import { Client } from 'pg';

export async function runScheduler(eventId: string, algorithm: string = 'CustomIntegerProgramming'): Promise<MatchingResult> {
    console.log(`[Scheduler] Triggered for eventId=${eventId}, algorithm=${algorithm}`);
    // Insert a new scheduler_runs row
    const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
    await client.connect();
    const runRes = await client.query(
        'INSERT INTO scheduler_runs (algorithm, triggered_by) VALUES ($1, $2) RETURNING id',
        [algorithm, null]
    );
    const runId = runRes.rows[0].id;
    await client.end();

    console.log(`[Scheduler] Preparing matching input for eventId=${eventId}`);
    const input = await prepareMatchingInput(eventId);
    let scheduler: IMatchingAlgorithm;
    switch (algorithm) {
        case 'CustomIntegerProgramming':
            console.log('[Scheduler] Using CustomIntegerProgrammingScheduler');
            scheduler = new CustomIntegerProgrammingScheduler();
            break;
        case 'Greedy':
            console.log('[Scheduler] Using GreedyScheduler');
            scheduler = new GreedyScheduler();
            break;
        default:
            console.log('[Scheduler] Using CustomIntegerProgrammingScheduler (default)');
            scheduler = new CustomIntegerProgrammingScheduler();
            break;
    }
    console.log('[Scheduler] Computing matches...');
    const start = Date.now();
    const result = await scheduler.computeMatches(input);
    const end = Date.now();
    const timeTakenSeconds = ((end - start) / 1000);
    console.log(`[Scheduler] Computed ${result.meetings.length} meetings in ${timeTakenSeconds.toFixed(2)} seconds. Saving to DB...`);
    await saveMeetings(result.meetings, runId);
    console.log('[Scheduler] Meetings saved. Scheduler run complete.');
    return { ...result, timeTakenSeconds };
} 
