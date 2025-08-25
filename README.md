This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Event Backend Integration

- Events are managed via a RESTful API at `/api/events`.
- **GET /api/events**: Returns a list of all events (for the admin dashboard).
- **POST /api/events**: Creates a new event. The request body should include `name`, `date`, `slotLen`, and `status`.
- Uses [@vercel/postgres](https://vercel.com/docs/storage/vercel-postgres/quickstart) for database access.
- The dashboard fetches and displays events, and updates the list immediately after a new event is created.

**Note:** Ensure your Vercel Postgres database has an `events` table with columns: `id` (UUID, PK), `name` (text), `date` (date), `slot_len` (integer), `status` (text), `created_at` (timestamp, default now()).

## Event Status System

The application uses a status-based workflow to control when faculty and students can provide inputs:

### Event Statuses:
1. **CREATED** - Event is created but not ready for input collection
2. **COLLECTING_AVAIL** - Event is ready for faculty and students to provide availability/preferences
3. **SCHEDULING** - Event is being processed by the scheduler
4. **PUBLISHED** - Event schedule is published

### Access Control:
- **Faculty and Students**: Can only select events with `COLLECTING_AVAIL` status when updating their availability/preferences
- **Scheduler**: Can only select events with `SCHEDULING` status for processing
- **Faculty and Students**: Can only see meetings for events with `PUBLISHED` status
- **Admins**: Can see and manage all events regardless of status

### User Experience:
- When no events are in `COLLECTING_AVAIL` status, faculty and students see a clear message explaining that events must be in "Collecting Inputs" status
- When no events are in `SCHEDULING` status, the scheduler shows a clear message explaining that events must be in "Scheduling" status
- When no events are in `PUBLISHED` status, faculty and students see a clear message explaining that meetings are only visible for published events
- This prevents confusion and ensures data collection, processing, and viewing happen at the right time in the workflow
