# Database Migration System

This document explains how to use the database migration system for the Chronos application.

## Overview

The migration system automatically sets up and maintains your PostgreSQL database schema. It's designed to work seamlessly with Vercel deployments and can also be run locally for development.

## Migration Files

### Current Migrations

1. **`001_initial_schema.sql`** - Creates the initial database schema with all required tables:
   - `users` - Stores all user types (admin, superadmin, faculty, student)
   - `events` - Stores scheduling events
   - `availabilities` - Stores faculty availability for events
   - `preferences` - Stores student preferences for events
   - `meetings` - Stores scheduled meetings
   - `scheduler_runs` - Tracks scheduler executions

2. **`002_add_superadmin_support.sql`** - Adds superadmin role support and additional indexes
3. **`003_create_default_superadmin.sql`** - Creates default superadmin user with specific credentials

3. **`upgrade_admin_to_superadmin.sql`** - Manual migration to upgrade existing admin to superadmin

## Running Migrations

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```
   NEON_POSTGRES_URL=your_postgres_connection_string
   DEFAULT_USER_PASSWORD=your_default_password
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

### Vercel Deployment

The migrations are automatically run during Vercel deployment. The build process includes:

1. **Install dependencies**
2. **Run database migrations** (`npm run migrate`)
3. **Build the Next.js application** (`next build`)

This is configured in `vercel.json` and `package.json`.

## Migration Script Details

### `scripts/migrate.js`

The migration runner script:

- Connects to your PostgreSQL database using `NEON_POSTGRES_URL`
- Creates a `schema_migrations` table to track executed migrations
- Reads all `.sql` files from the `migrations/` directory
- Executes pending migrations in alphabetical order
- Records successful migrations to prevent re-execution

### Key Features

- **Idempotent**: Safe to run multiple times
- **Ordered**: Migrations run in filename order
- **Tracked**: Each migration is recorded in `schema_migrations` table
- **Error handling**: Stops on first error and provides clear feedback

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'superadmin', 'faculty', 'student')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Events Table
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    slot_len INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'COLLECTING_AVAIL', 'SCHEDULING', 'PUBLISHED')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available_slots JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Other Tables
- `availabilities` - Faculty availability for events
- `preferences` - Student preferences for events
- `meetings` - Scheduled meetings
- `scheduler_runs` - Scheduler execution tracking

## Environment Variables

### Required
- `NEON_POSTGRES_URL` - PostgreSQL connection string

### Optional
- `DEFAULT_USER_PASSWORD` - Default password for new users (defaults to 'welcome123')

## Default Superadmin Credentials

After running migrations, a default superadmin user is automatically created:

- **Email**: `superadmin@northwestern.edu`
- **Password**: `chronos2025!`
- **Role**: `superadmin`
- **Department**: `Information Technology`

⚠️ **Important**: Change these credentials immediately after your first login for security!

### Changing Default Password

After your first login, you should change the default password. You can do this in two ways:

1. **Through the application** (recommended):
   - Log in with the default credentials
   - Use the application's password change functionality

2. **Using the command line script**:
   ```bash
   npm run change-password
   ```
   This script will prompt you for a new password and update it in the database.

## Adding New Migrations

1. **Create a new SQL file** in the `migrations/` directory
2. **Use a numbered prefix** for ordering (e.g., `003_add_new_feature.sql`)
3. **Include descriptive comments** explaining what the migration does
4. **Test locally** before deploying

Example:
```sql
-- Migration: 003_add_new_feature.sql
-- Description: Add new feature to the application

ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
CREATE INDEX idx_users_new_field ON users(new_field);
```

## Troubleshooting

### Common Issues

1. **Connection failed**: Check `NEON_POSTGRES_URL` environment variable
2. **Permission denied**: Ensure database user has CREATE/ALTER permissions
3. **Migration already exists**: The script will skip already executed migrations

### Manual Migration

If you need to run a migration manually:

```bash
# Connect to your database
psql $NEON_POSTGRES_URL

# Run the migration
\i migrations/your_migration.sql
```

### Reset Migrations

To reset the migration tracking (⚠️ **DANGEROUS** - only for development):

```sql
DROP TABLE schema_migrations;
```

## Production Deployment

For production deployments on Vercel:

1. **Set environment variables** in Vercel dashboard
2. **Deploy**: Migrations run automatically during build
3. **Monitor**: Check build logs for migration status

The migration system ensures your database is always up-to-date with your application schema. 