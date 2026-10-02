CREATE TABLE IF NOT EXISTS game_metadata_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_metadata_cache_cached_at
  ON game_metadata_cache (cached_at);
