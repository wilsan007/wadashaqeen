-- Migration: Aggressively Consolidate RLS Policies
-- Date: 2025-12-19
-- Description: Merges ALL permissive policies for a given Table + Action into a single policy TO PUBLIC.

BEGIN;

DO $$
DECLARE
    r RECORD;
    pol RECORD;
    combined_using TEXT;
    combined_with_check TEXT;
    policy_names TEXT[];
    new_policy_name TEXT;
    drop_cmd TEXT;
    create_cmd TEXT;
    create_cmd_type TEXT;
BEGIN
    -- Iterate through groups of policies by Table and Command ONLY (Ignoring Roles)
    FOR r IN
        SELECT 
            p.polrelid,
            p.polcmd,
            n.nspname AS schema_name,
            c.relname AS table_name,
            COUNT(*) as distinct_policy_count
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' -- Focus on public schema
        AND p.polpermissive = true -- Only consolidate permissive policies
        GROUP BY p.polrelid, p.polcmd, n.nspname, c.relname
        HAVING COUNT(*) > 1 -- Only where there are multiple policies
    LOOP
        -- Reset variables for this group
        combined_using := '';
        combined_with_check := '';
        policy_names := ARRAY[]::TEXT[];
        
        -- Loop through the individual policies in this group
        FOR pol IN
            SELECT 
                polname,
                pg_get_expr(polqual, polrelid) as using_expr,
                pg_get_expr(polwithcheck, polrelid) as with_check_expr
            FROM pg_policy
            WHERE polrelid = r.polrelid
            AND polcmd = r.polcmd
            AND polpermissive = true
        LOOP
            policy_names := policy_names || pol.polname;
            
            -- Combine USING clauses with OR
            IF pol.using_expr IS NOT NULL THEN
                IF combined_using = '' THEN
                    combined_using := '(' || pol.using_expr || ')';
                ELSE
                    combined_using := combined_using || ' OR (' || pol.using_expr || ')';
                END IF;
            END IF;
            
            -- Combine WITH CHECK clauses with OR
            IF pol.with_check_expr IS NOT NULL THEN
                IF combined_with_check = '' THEN
                    combined_with_check := '(' || pol.with_check_expr || ')';
                ELSE
                    combined_with_check := combined_with_check || ' OR (' || pol.with_check_expr || ')';
                END IF;
            END IF;
        END LOOP;

        -- Map internal polcmd char to SQL keyword
        CASE r.polcmd
            WHEN 'r' THEN create_cmd_type := 'SELECT';
            WHEN 'a' THEN create_cmd_type := 'INSERT';
            WHEN 'w' THEN create_cmd_type := 'UPDATE';
            WHEN 'd' THEN create_cmd_type := 'DELETE';
            WHEN '*' THEN create_cmd_type := 'ALL';
            ELSE create_cmd_type := 'ALL'; -- Fallback
        END CASE;

        -- Generate unique new name
        -- e.g., consolidated_select_employees_agg
        new_policy_name := 'consolidated_' || lower(create_cmd_type) || '_' || r.table_name || '_' || md5(array_to_string(policy_names, '')) || '_agg';
        -- Truncate to match Postgres identifier limits
        IF length(new_policy_name) > 63 THEN
            new_policy_name := substring(new_policy_name from 1 for 63);
        END IF;

        -- Construct commands
        -- 1. DROP old policies
        FOREACH drop_cmd IN ARRAY policy_names
        LOOP
            EXECUTE format('DROP POLICY %I ON %I.%I;', drop_cmd, r.schema_name, r.table_name);
            RAISE NOTICE 'Dropped redundant policy % on % %', drop_cmd, r.table_name, create_cmd_type;
        END LOOP;

        -- 2. CREATE merged policy TO PUBLIC (Aggressive consolidation)
        create_cmd := format('CREATE POLICY %I ON %I.%I FOR %s TO PUBLIC', new_policy_name, r.schema_name, r.table_name, create_cmd_type);
        
        IF combined_using <> '' THEN
            create_cmd := create_cmd || format(' USING (%s)', combined_using);
        END IF;
        
        IF combined_with_check <> '' THEN
            create_cmd := create_cmd || format(' WITH CHECK (%s)', combined_with_check);
        END IF;
        
        -- Execute create
        EXECUTE create_cmd || ';';
        RAISE NOTICE 'Created consolidated aggressive policy % on % %', new_policy_name, r.table_name, create_cmd_type;
        
    END LOOP;
END $$;

COMMIT;
