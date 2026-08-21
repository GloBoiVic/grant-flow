ALTER TABLE "Tag"
  ADD COLUMN "normalizedName" TEXT;

UPDATE "Tag"
SET "normalizedName" = lower(btrim("name"));

DO $$
DECLARE
  collision RECORD;
BEGIN
  SELECT
    "organizationId",
    "normalizedName",
    array_agg("id"::text ORDER BY "id") AS "tagIds"
  INTO collision
  FROM "Tag"
  GROUP BY "organizationId", "normalizedName"
  HAVING count(*) > 1
  ORDER BY "organizationId", "normalizedName"
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'Tag normalized-name collision: organizationId=%, normalizedName=%, tagIds=%. Resolve the duplicate tags without deleting, renaming, merging, or rewriting GrantTag history, then retry the migration.',
      collision."organizationId",
      collision."normalizedName",
      collision."tagIds";
  END IF;
END
$$;

ALTER TABLE "Tag"
  ALTER COLUMN "normalizedName" SET NOT NULL;

DROP INDEX "Tag_organizationId_name_key";

CREATE UNIQUE INDEX "Tag_organizationId_normalizedName_key"
  ON "Tag"("organizationId", "normalizedName");
