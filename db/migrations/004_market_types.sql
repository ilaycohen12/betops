-- Add market type (binary vs over_under) and numeric threshold
ALTER TABLE markets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'binary';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS threshold NUMERIC;

-- Expand allowed sides in bets to include over/under
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_side_check;
ALTER TABLE bets ADD CONSTRAINT bets_side_check
    CHECK (side IN ('yes', 'no', 'over', 'under'));

-- Expand allowed results in markets to include over/under
ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_result_check;
ALTER TABLE markets ADD CONSTRAINT markets_result_check
    CHECK (result IN ('yes', 'no', 'over', 'under'));
