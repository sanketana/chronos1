import { NextRequest, NextResponse } from 'next/server';
import { deleteEvent } from '../../actions';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    await deleteEvent(id);
    return NextResponse.redirect(new URL('/dashboard/events', req.nextUrl.origin));
} 