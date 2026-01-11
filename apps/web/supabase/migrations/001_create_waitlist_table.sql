-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
	ip_address TEXT,
	user_agent TEXT
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for signups)
CREATE POLICY "Allow public insert" ON waitlist
	FOR INSERT
	TO anon
	WITH CHECK (true);

-- Policy: Prevent public reads (privacy)
CREATE POLICY "Prevent public read" ON waitlist
	FOR SELECT
	TO anon
	USING (false);

-- Add email validation constraint
ALTER TABLE waitlist
	ADD CONSTRAINT email_format_check
	CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');


