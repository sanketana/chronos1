// Helper functions for event status management and validation

export interface EventStatusInfo {
    key: string;
    label: string;
    icon: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const EVENT_STATUSES: Record<string, EventStatusInfo> = {
    'CREATED': {
        key: 'CREATED',
        label: 'Setup',
        icon: '⚙️',
        description: 'Event configuration',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200'
    },
    'COLLECTING_AVAIL': {
        key: 'COLLECTING_AVAIL',
        label: 'Collecting Inputs',
        icon: '📝',
        description: 'Availability & preferences',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
    },
    'SCHEDULING': {
        key: 'SCHEDULING',
        label: 'Generating Schedule',
        icon: '🔄',
        description: 'Algorithm processing',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200'
    },
    'PUBLISHED': {
        key: 'PUBLISHED',
        label: 'Published',
        icon: '✅',
        description: 'Schedule is live',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
    }
};

export function getStatusInfo(status: string): EventStatusInfo {
    return EVENT_STATUSES[status] || {
        key: status,
        label: status,
        icon: '❓',
        description: 'Unknown status',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
    };
}

export function getStatusDescription(status: string): string {
    switch (status) {
        case 'CREATED':
            return 'Event is configured and ready. Set status to "Collecting Inputs" when ready for faculty and students to submit their availability.';
        case 'COLLECTING_AVAIL':
            return 'Faculty and students can now submit their availability and preferences. Move to "Generating Schedule" when you have enough submissions.';
        case 'SCHEDULING':
            return 'Ready for schedule generation. Run the scheduler algorithm to create meetings, then publish when satisfied with results.';
        case 'PUBLISHED':
            return 'Schedule is live and visible to all participants. You can make minor adjustments or regenerate if needed.';
        default:
            return 'Unknown status. Please check event configuration.';
    }
}

export function getNextValidStatuses(currentStatus: string): string[] {
    switch (currentStatus) {
        case 'CREATED':
            return ['COLLECTING_AVAIL'];
        case 'COLLECTING_AVAIL':
            return ['CREATED', 'SCHEDULING'];
        case 'SCHEDULING':
            return ['COLLECTING_AVAIL', 'PUBLISHED'];
        case 'PUBLISHED':
            return ['SCHEDULING', 'COLLECTING_AVAIL'];
        default:
            return [];
    }
}

export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
    const validTransitions = getNextValidStatuses(currentStatus);
    return validTransitions.includes(targetStatus);
}

export function getTransitionWarnings(currentStatus: string, targetStatus: string): string[] {
    const warnings: string[] = [];

    if (currentStatus === 'COLLECTING_AVAIL' && targetStatus === 'CREATED') {
        warnings.push('Faculty and students will no longer see this event');
        warnings.push('Any submitted availability/preferences will remain saved');
        warnings.push('You can return to collecting inputs after changes');
    } else if (currentStatus === 'COLLECTING_AVAIL' && targetStatus === 'SCHEDULING') {
        warnings.push('Faculty and students can no longer modify their submissions');
        warnings.push('You can run the scheduling algorithm');
        warnings.push('You can still return to collecting inputs if needed');
    } else if (currentStatus === 'SCHEDULING' && targetStatus === 'PUBLISHED') {
        warnings.push('Faculty will see their assigned meetings');
        warnings.push('Students will see their scheduled appointments');
        warnings.push('You can still make minor adjustments if needed');
    } else if (currentStatus === 'PUBLISHED' && targetStatus === 'SCHEDULING') {
        warnings.push('Existing meetings will be replaced with new algorithm results');
        warnings.push('Participants may see different meeting times');
        warnings.push('Current availability/preferences will be used as-is');
    } else if (targetStatus === 'COLLECTING_AVAIL' && currentStatus !== 'CREATED') {
        warnings.push('Current schedule will be hidden from participants');
        warnings.push('Faculty and students can modify their availability');
        warnings.push('You will need to regenerate and republish the schedule');
    }

    return warnings;
}
