-- Enums for roles and content types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Admin', 'GM', 'TL1', 'TL2', 'COO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM ('Post', 'Reel');
    END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS content_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(client_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL,
    created_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES content_items(item_id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(user_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at on content_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON content_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be refined in Phase 2)
-- For Phase 1, we allow Admin and GM to do everything.
-- We can use a helper function to check roles if we use Supabase Auth metadata, 
-- but for now these are standard Postgres roles.

-- Admin Policy
CREATE POLICY "Admins can do everything on users" ON users FOR ALL TO authenticated USING (role = 'Admin');
CREATE POLICY "Admins can do everything on clients" ON clients FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.role = 'Admin')
);

-- General Manager Policy
CREATE POLICY "GMs can view and edit clients" ON clients FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.role IN ('Admin', 'GM'))
);

-- Content Items Policy
CREATE POLICY "GMs and Admins can manage content items" ON content_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.role IN ('Admin', 'GM'))
);

-- Status Logs Policy
CREATE POLICY "GMs and Admins can manage status logs" ON status_logs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.role IN ('Admin', 'GM'))
);
