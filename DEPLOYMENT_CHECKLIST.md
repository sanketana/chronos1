# Vercel Deployment Checklist

This checklist will help you deploy your Chronos application to Vercel with the new database migration system.

## Pre-Deployment Setup

### 1. Database Setup
- [ ] **Create a PostgreSQL database** (Neon, Supabase, or other provider)
- [ ] **Get the connection string** (should look like: `postgresql://user:password@host:port/database`)
- [ ] **Test the connection** locally to ensure it works

### 2. Environment Variables
Set these in your Vercel project settings:

#### Required
- [ ] `NEON_POSTGRES_URL` - Your PostgreSQL connection string
- [ ] `DEFAULT_USER_PASSWORD` - Default password for new users (optional, defaults to 'welcome123')

#### Optional (for production)
- [ ] `NODE_ENV` - Set to `production`
- [ ] Any other environment variables your app needs

### 3. Local Testing
Before deploying, test locally:

```bash
# Test the migration system
npm run test:migration

# Run migrations locally
npm run migrate

# Test the application
npm run dev
```

## Deployment Steps

### 1. Connect to Vercel
- [ ] **Install Vercel CLI** (if not already installed): `npm i -g vercel`
- [ ] **Login to Vercel**: `vercel login`
- [ ] **Link your project**: `vercel link` (if not already linked)

### 2. Set Environment Variables
```bash
# Set the database connection string
vercel env add NEON_POSTGRES_URL

# Set default password (optional)
vercel env add DEFAULT_USER_PASSWORD
```

### 3. Deploy
```bash
# Deploy to production
vercel --prod
```

## Post-Deployment Verification

### 1. Check Build Logs
- [ ] **Verify migrations ran successfully** in the build logs
- [ ] **Check for any errors** in the migration process
- [ ] **Confirm all tables were created** properly

### 2. Test the Application
- [ ] **Visit your deployed URL** and verify the app loads
- [ ] **Test user registration/login** functionality
- [ ] **Verify database operations** work correctly
- [ ] **Check admin functionality** if applicable

### 3. Database Verification
You can verify the database was set up correctly by:

```bash
# Connect to your database
psql $NEON_POSTGRES_URL

# Check if tables exist
\dt

# Check if migrations were recorded
SELECT * FROM schema_migrations;

# Check if superadmin user was created
SELECT name, email, role FROM users WHERE role = 'superadmin';
```

### 4. Default Superadmin Access
After successful deployment, you can log in with the default superadmin credentials:

- **Email**: `superadmin@northwestern.edu`
- **Password**: `chronos2025!`

⚠️ **Security Note**: Change these credentials immediately after your first login!

### 5. Change Default Password
After logging in for the first time, change the default password:

```bash
# Option 1: Use the command line script
npm run change-password

# Option 2: Change password through the application interface
```

**Important**: This is a critical security step - never leave the default password in production!

## Troubleshooting

### Common Issues

#### 1. Migration Fails During Build
**Symptoms**: Build fails with database connection errors
**Solutions**:
- Check `NEON_POSTGRES_URL` is correct
- Ensure database is accessible from Vercel's servers
- Verify database user has CREATE/ALTER permissions

#### 2. Tables Not Created
**Symptoms**: App works but database operations fail
**Solutions**:
- Check build logs for migration errors
- Run migrations manually: `npm run migrate`
- Verify `schema_migrations` table exists

#### 3. Permission Denied
**Symptoms**: Database connection works but migrations fail
**Solutions**:
- Ensure database user has sufficient privileges
- Check if database allows schema modifications
- Verify SSL settings if required

### Manual Migration (if needed)

If automatic migrations fail, you can run them manually:

```bash
# Connect to your database
psql $NEON_POSTGRES_URL

# Run migrations manually
\i migrations/001_initial_schema.sql
\i migrations/002_add_superadmin_support.sql
```

## Security Considerations

### 1. Database Security
- [ ] **Use strong passwords** for database users
- [ ] **Enable SSL** for database connections
- [ ] **Restrict database access** to Vercel's IP ranges if possible
- [ ] **Regularly rotate** database credentials

### 2. Application Security
- [ ] **Change default passwords** after first login
- [ ] **Review user permissions** and roles
- [ ] **Monitor application logs** for suspicious activity
- [ ] **Keep dependencies updated**

## Monitoring

### 1. Vercel Monitoring
- [ ] **Set up Vercel Analytics** (optional)
- [ ] **Monitor build logs** for migration issues
- [ ] **Set up alerts** for deployment failures

### 2. Database Monitoring
- [ ] **Monitor database performance**
- [ ] **Set up backup schedules**
- [ ] **Monitor connection usage**

## Next Steps

After successful deployment:

1. **Create your first admin user** using the superadmin account
2. **Set up your events** and configure the system
3. **Invite faculty and students** to use the platform
4. **Monitor usage** and performance
5. **Plan for scaling** as your user base grows

## Support

If you encounter issues:

1. **Check the build logs** in Vercel dashboard
2. **Review the migration logs** for specific errors
3. **Test locally** to reproduce the issue
4. **Check the MIGRATION_README.md** for detailed documentation
5. **Contact support** if the issue persists

---

**Remember**: The migration system is designed to be safe and idempotent. You can run it multiple times without issues, and it will only execute pending migrations. 