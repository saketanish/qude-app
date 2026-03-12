-- =============================================
-- QueuePass Database Migrations
-- Run in order: 001 → 005
-- =============================================

-- 001: Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'devotee' CHECK (role IN ('devotee', 'admin', 'gate_operator')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 002: Temples Table
CREATE TABLE IF NOT EXISTS temples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  location TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  admin_id UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 003: Queues Table
CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  current_serving INTEGER DEFAULT 0,
  total_issued INTEGER DEFAULT 0,
  slot_size INTEGER DEFAULT 10,
  avg_wait_minutes INTEGER DEFAULT 5,
  max_capacity INTEGER DEFAULT 1000,
  entrance_qr VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 004: Tokens Table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES queues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  qr_code VARCHAR(500) UNIQUE NOT NULL,
  qr_image_base64 TEXT,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'entered', 'expired', 'cancelled')),
  notified_near BOOLEAN DEFAULT false,
  notified_called BOOLEAN DEFAULT false,
  issued_at TIMESTAMP DEFAULT NOW(),
  called_at TIMESTAMP,
  entered_at TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(queue_id, token_number)
);

-- 005: Entry Logs Table
CREATE TABLE IF NOT EXISTS entry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES tokens(id),
  queue_id UUID REFERENCES queues(id),
  gate_operator_id UUID REFERENCES users(id),
  result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'already_used', 'expired', 'invalid', 'not_called')),
  scanned_at TIMESTAMP DEFAULT NOW()
);

-- 006: OTP Table
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_qr ON tokens(qr_code);
CREATE INDEX IF NOT EXISTS idx_entry_logs_queue ON entry_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_queues_temple ON queues(temple_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
