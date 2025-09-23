import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const date = formData.get('date') as string;
        const slotLen = Number(formData.get('slotLen'));
        const status = formData.get('status') as string;
        const startTime = formData.get('start_time') as string;
        const endTime = formData.get('end_time') as string;
        const availableSlots = formData.get('available_slots') as string;
        const minFaculty = Number(formData.get('min_faculty')) || 3;
        const maxFaculty = Number(formData.get('max_faculty')) || 5;

        console.log('Received status update request:', {
            id: !!id,
            status,
            hasName: !!name,
            hasDate: !!date,
            hasSlotLen: !!slotLen,
            hasStartTime: !!startTime && startTime.trim() !== '',
            hasEndTime: !!endTime && endTime.trim() !== '',
            hasAvailableSlots: !!availableSlots && availableSlots.trim() !== ''
        });

        if (!id || !status) {
            console.error('Missing required fields:', { id: !!id, status: !!status });
            return NextResponse.json({ error: 'Missing required fields: id and status are required' }, { status: 400 });
        }

        // Validate status
        const validStatuses = ['CREATED', 'COLLECTING_AVAIL', 'SCHEDULING', 'PUBLISHED'];
        if (!validStatuses.includes(status)) {
            console.error('Invalid status provided:', status, 'Valid statuses:', validStatuses);
            return NextResponse.json({ error: `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        const client = new Client({ connectionString: process.env.NEON_POSTGRES_URL });
        await client.connect();

        // Check if we have all required fields for a full update
        const hasAllFields = name && date && slotLen && startTime && endTime && availableSlots &&
            startTime.trim() !== '' && endTime.trim() !== '' && availableSlots.trim() !== '';

        console.log('Update type decision:', { hasAllFields, availableSlots: availableSlots || 'empty' });

        if (hasAllFields) {
            console.log('Performing full update with validation');
            // Full update with validation
            const slotPattern = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d(,\s*([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)*$/;

            if (minFaculty <= 0 || maxFaculty <= 0) {
                console.error('Faculty limits validation failed:', { minFaculty, maxFaculty });
                await client.end();
                return NextResponse.json({ error: 'Min faculty and max faculty must be greater than 0' }, { status: 400 });
            }

            if (maxFaculty < minFaculty) {
                console.error('Faculty limits order validation failed:', { minFaculty, maxFaculty });
                await client.end();
                return NextResponse.json({ error: 'Max faculty must be greater than or equal to min faculty' }, { status: 400 });
            }

            console.log('Testing slot pattern against:', availableSlots);
            if (!slotPattern.test(availableSlots)) {
                console.error('Available slots pattern validation failed:', availableSlots);
                await client.end();
                return NextResponse.json({ error: 'Available slots format is invalid. Use HH:MM - HH:MM, ...' }, { status: 400 });
            }

            // Convert availableSlots to JSON array
            const slotsArray = availableSlots.split(',').map(s => s.replace(/\s+/g, ''));
            const availableSlotsJson = JSON.stringify({
                slots: slotsArray
            });

            console.log('Executing full update query');
            await client.query(
                'UPDATE events SET name = $1, date = $2, slot_len = $3, status = $4, start_time = $5, end_time = $6, available_slots = $7, min_faculty = $8, max_faculty = $9, updated_at = NOW() WHERE id = $10',
                [name, date, slotLen, status, startTime, endTime, availableSlotsJson, minFaculty, maxFaculty, id]
            );
        } else {
            console.log('Performing status-only update');
            // Status-only update - just update the status field
            await client.query(
                'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2',
                [status, id]
            );
        }

        await client.end();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating event status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
