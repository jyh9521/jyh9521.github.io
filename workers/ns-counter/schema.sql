CREATE TABLE IF NOT EXISTS visit_counter (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count >= 0)
);
INSERT INTO visit_counter (id, count) VALUES ('ns', 0)
ON CONFLICT(id) DO NOTHING;
