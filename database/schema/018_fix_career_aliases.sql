-- Ensure every active career's exact title resolves to that same career.
-- Earlier seeds mapped Android Developer and iOS Developer to the broader
-- Mobile App Developer career before their dedicated catalog entries existed.
BEGIN;

UPDATE career_aliases AS alias
SET career_id = career.id
FROM careers AS career
WHERE career.is_active = TRUE
  AND lower(btrim(career.title)) = lower(btrim(alias.alias))
  AND alias.career_id <> career.id;

INSERT INTO career_aliases (career_id, alias)
SELECT career.id, lower(btrim(career.title))
FROM careers AS career
LEFT JOIN career_aliases AS alias
  ON lower(btrim(alias.alias)) = lower(btrim(career.title))
WHERE career.is_active = TRUE
  AND alias.id IS NULL;

COMMIT;
