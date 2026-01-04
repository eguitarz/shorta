# Supabase Row Level Security (RLS) Guide

## Overview

Row Level Security (RLS) is **critical** for protecting data in Supabase. Without RLS enabled, the public `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be used to access **all data** in your database.

**Security Level**: CRITICAL

---

## ⚠️ Security Warning

The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is exposed in client-side JavaScript. Without RLS:

❌ **Anyone can read all data**
❌ **Anyone can modify all data**
❌ **Anyone can delete all data**

With RLS enabled and properly configured:

✅ **Users can only access their own data**
✅ **Unauthorized access attempts are blocked**
✅ **Data is protected at the database level**

---

## Current Status

**ACTION REQUIRED**: Verify RLS is enabled on all tables.

### Tables to Check

Based on the codebase, the following tables are likely in use:

1. **waitlist** - Email signups (used in `WaitlistForm.tsx`)
2. **users** - User profiles (Supabase Auth)
3. **storyboards** - User-generated storyboards
4. **viral_patterns** - Cached analysis results
5. Any other tables created

### How to Check RLS Status

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Database** → **Tables**
4. For each table, check if "RLS enabled" badge is shown
5. If not enabled, you'll see a warning icon

---

## Required RLS Policies

### 1. Waitlist Table

**Purpose**: Store email signups for waitlist

**Recommended Policies**:

```sql
-- Allow anyone to insert (public signup)
CREATE POLICY "Allow public inserts"
ON waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can only read their own entries
CREATE POLICY "Users can view own entries"
ON waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No updates or deletes allowed
-- (or restrict to admins only)
```

### 2. User Profiles Table

**Purpose**: Store user profile information

**Recommended Policies**:

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

### 3. Storyboards Table

**Purpose**: Store user-generated storyboards

**Recommended Policies**:

```sql
-- Users can view their own storyboards
CREATE POLICY "Users can view own storyboards"
ON storyboards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create storyboards
CREATE POLICY "Users can create storyboards"
ON storyboards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own storyboards
CREATE POLICY "Users can update own storyboards"
ON storyboards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own storyboards
CREATE POLICY "Users can delete own storyboards"
ON storyboards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 4. Viral Patterns Cache Table

**Purpose**: Store cached viral pattern analysis

**Recommended Policies**:

```sql
-- Authenticated users can read cached patterns
CREATE POLICY "Authenticated users can read patterns"
ON viral_patterns
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update
-- (Done via server-side API routes)
-- No policy needed - will use service role key server-side
```

---

## Step-by-Step Implementation

### 1. Enable RLS on All Tables

```sql
-- For each table:
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_patterns ENABLE ROW LEVEL SECURITY;
```

### 2. Create Policies

Apply the policies shown above using Supabase SQL Editor:

1. Go to **Database** → **SQL Editor**
2. Create a new query
3. Paste the policies for each table
4. Run the query

### 3. Test Policies

**Test Read Access**:
```javascript
// Should fail if RLS is working
const { data, error } = await supabase
  .from('storyboards')
  .select('*')
  .eq('user_id', 'some-other-user-id');
```

**Test Write Access**:
```javascript
// Should fail if RLS is working
const { data, error } = await supabase
  .from('storyboards')
  .insert({
    user_id: 'some-other-user-id',
    content: 'test'
  });
```

### 4. Monitor RLS Violations

Check Supabase logs for RLS violations:

1. Go to **Database** → **Roles & Permissions**
2. Look for "Permission Denied" errors
3. These indicate RLS is blocking unauthorized access (good!)

---

## Common RLS Patterns

### Pattern 1: User-Owned Records

```sql
-- Users can only access their own records
CREATE POLICY "policy_name"
ON table_name
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Pattern 2: Public Read, Authenticated Write

```sql
-- Anyone can read, only authenticated users can write
CREATE POLICY "Public read access"
ON table_name
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated write access"
ON table_name
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Pattern 3: Admin-Only Access

```sql
-- Only users with admin role can access
CREATE POLICY "Admin only access"
ON table_name
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## Security Best Practices

### ✅ DO:

- **Enable RLS on all tables**
- **Test policies with different user accounts**
- **Use `auth.uid()` to identify current user**
- **Restrict policies to minimum necessary access**
- **Use service role key only in server-side code**
- **Monitor logs for unauthorized access attempts**

### ❌ DON'T:

- **Never disable RLS on production tables**
- **Don't use `USING (true)` for write operations without careful consideration**
- **Don't expose service role key in client code**
- **Don't assume RLS is enabled - always verify**
- **Don't skip testing policies**

---

## Troubleshooting

### Issue: "Permission Denied" Errors

**Cause**: RLS policy is blocking legitimate access

**Solution**:
1. Check if user is authenticated: `await supabase.auth.getUser()`
2. Verify policy conditions match your use case
3. Check if `user_id` column exists and is populated
4. Test with SQL editor using specific user ID

### Issue: Data Accessible Without Authentication

**Cause**: RLS not enabled or policy too permissive

**Solution**:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check policies: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. Review policy logic for overly permissive rules

### Issue: Service Role Can't Access Data

**Cause**: Service role bypasses RLS (this is expected)

**Solution**: Service role should always work. If not, check:
1. Using correct service role key (not anon key)
2. Key is server-side only (not in client code)

---

## Migration Checklist

Before deploying to production:

- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Policies tested with multiple user accounts
- [ ] Service role key is server-side only
- [ ] Anon key is in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Logs checked for RLS violations
- [ ] Security audit completed
- [ ] Backup of policies saved

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Last Updated**: 2026-01-04
**Status**: ⚠️ REQUIRES VERIFICATION
**Priority**: CRITICAL
