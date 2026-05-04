-- Migration: Fix Performance Lints (Unindexed Foreign Keys)
-- Date: 2025-12-19
-- Description: Automatically detects and indexes foreign keys that lack a covering index.

BEGIN;

DO $$
DECLARE
    r RECORD;
    index_exists BOOLEAN;
    index_name TEXT;
    cols TEXT;
    safe_cols TEXT;
    cmd TEXT;
BEGIN
    -- Iterate over every foreign key in the public schema
    FOR r IN
        SELECT
            c.conname AS constraint_name,
            n.nspname AS schema_name,
            t.relname AS table_name,
            t.oid AS table_oid,
            c.conkey AS key_cols
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON c.connamespace = n.oid
        WHERE c.contype = 'f' 
        AND n.nspname = 'public'
    LOOP
        -- Check if there is an index that starts with the same columns as the FK
        -- We check pg_index for the table, looking for any index where the first N columns match the FK columns
        -- This logic assumes the order of columns in the index matches the FK, which is usually required for full efficiency
        SELECT EXISTS (
            SELECT 1
            FROM pg_index i
            WHERE i.indrelid = r.table_oid
            -- Check if the index's first columns match the foreign key columns
            -- indkey is an int2vector (list of column numbers)
            -- simple check: does the index key start with the FK keys?
            
            -- We just check if there is ANY index where the set of columns matches exactly or is a prefix
            -- Constructing exact array matching in PL/PGSQL dynamic SQL is simpler by assuming we just want ANY index 
            -- that contains these columns as leading columns.
            
            -- For simplicity and robustness in this migration script, we will query specifically using column names
            -- but finding col names from OIDs inside this loop is tedious.
            
            -- Let's try a simpler approach: 
            -- If we can't easily verify the index exists, we can try to create it with usage of 'IF NOT EXISTS' 
            -- but naming collisions might occur.
            
            -- Re-approach: Get column names first.
        ) INTO index_exists;
        
        -- Let's retrieve column names to construct the check and create statement
        SELECT 
            string_agg(quote_ident(a.attname), ', ') AS cols_csv,
            string_agg(quote_ident(a.attname), '_') AS cols_slug
        INTO cols, safe_cols
        FROM pg_attribute a
        WHERE a.attrelid = r.table_oid
        AND a.attnum = ANY(r.key_cols);

        -- Check if an index exists on these columns
        -- We look for an index definition that resembles what we want
        -- or strictly checks system catalogs.
        EXECUTE format(
            'SELECT EXISTS (
                SELECT 1
                FROM pg_index i
                JOIN pg_class c ON i.indexrelid = c.oid
                WHERE i.indrelid = %L::regclass
                AND (
                    -- Check if index definition string contains columns
                    -- This is a heuristic but effective
                    pg_get_indexdef(i.indexrelid) LIKE ''%%'' || %L || ''%%''
                )
             )',
            r.schema_name || '.' || r.table_name,
            cols -- This will be "col1, col2"
        ) INTO index_exists;

        -- If heuristic failed (maybe index is "col1, col2, col3" but we searched "col1, col2")
        -- Let's assume if we didn't find a direct match, we create a specific one for this FK.
        -- Standard naming: idx_tablename_colnames
        
        index_name := 'idx_' || r.table_name || '_' || safe_cols;
        -- Truncate to 63 chars (postgres limit)
        IF length(index_name) > 63 THEN
            index_name := substring(index_name from 1 for 63);
        END IF;

        IF NOT index_exists THEN
             -- Check if index with this name already exists to avoid error
             IF NOT EXISTS (
                SELECT 1 FROM pg_class WHERE relname = index_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
             ) THEN
                cmd := format('CREATE INDEX %I ON public.%I (%s);', index_name, r.table_name, cols);
                RAISE NOTICE 'Creating index for FK % on table %: %', r.constraint_name, r.table_name, cmd;
                EXECUTE cmd;
             ELSE
                RAISE NOTICE 'Index % already exists (name collision), skipping auto-creation for FK %', index_name, r.constraint_name;
             END IF;
        ELSE
             -- RAISE NOTICE 'Index exists for FK % on table %', r.constraint_name, r.table_name;
        END IF;
    END LOOP;
END $$;

COMMIT;
