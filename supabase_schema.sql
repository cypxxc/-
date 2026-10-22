-- 1. ตาราง Master Data จังหวัด
CREATE TABLE IF NOT EXISTS provinces (
  id TEXT PRIMARY KEY,
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  region TEXT NOT NULL,
  svg_path TEXT
);

-- 2. ตารางบันทึกจังหวัดที่ User เคยไป
CREATE TABLE IF NOT EXISTS user_visited_provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  province_id TEXT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  is_visited BOOLEAN NOT NULL DEFAULT true,
  first_visited_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, province_id)
);

-- 3. ตารางความทรงจำ / บันทึกเรื่องเล่า (Memories)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  province_id TEXT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  rating INTEGER DEFAULT 5,
  visited_date DATE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visited_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS: จังหวัดทุกคนอ่านได้
CREATE POLICY "Anyone can view provinces" ON provinces FOR SELECT USING (true);

-- นโยบาย RLS: user_visited_provinces
CREATE POLICY "Users can manage their own visited records" ON user_visited_provinces
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view visited records" ON user_visited_provinces
  FOR SELECT USING (true);

-- นโยบาย RLS: memories
CREATE POLICY "Users can manage their own memories" ON memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view public memories" ON memories
  FOR SELECT USING (is_public = true);
