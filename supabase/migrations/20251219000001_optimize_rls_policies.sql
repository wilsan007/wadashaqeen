-- Migration: Optimize RLS Policies for Performance
-- Date: 2025-12-19
-- Description: Wraps auth function calls in subqueries to prevent per-row re-evaluation

BEGIN;

DO $$
DECLARE
  pol record;
  table_name text;
  policy_name text;
  cmd text;
  using_clause text;
  with_check_clause text;
  new_using text;
  new_with_check text;
  
  -- Function to wrap auth calls in subselects safely
  -- It avoids double wrapping by first hiding existing correct patterns
  optimize_sql text := $func$
    DECLARE
      s text := $1;
    BEGIN
      -- 1. Protect existing optimized calls
      s := replace(s, '(select auth.uid())', '###AUTH_UID###');
      s := replace(s, '(select auth.role())', '###AUTH_ROLE###');
      s := replace(s, '(select auth.email())', '###AUTH_EMAIL###');
      s := replace(s, '(select auth.jwt())', '###AUTH_JWT###');
      
      -- 2. Optimize unoptimized calls
      -- We use regex to ensure we are matching function calls and not other text
      -- simpler replace is usually safe enough for these specific strings given their namespaced nature
      s := replace(s, 'auth.uid()', '(select auth.uid())');
      s := replace(s, 'auth.role()', '(select auth.role())');
      s := replace(s, 'auth.email()', '(select auth.email())');
      s := replace(s, 'auth.jwt()', '(select auth.jwt())');
      
      -- 3. Restore protected calls
      s := replace(s, '###AUTH_UID###', '(select auth.uid())');
      s := replace(s, '###AUTH_ROLE###', '(select auth.role())');
      s := replace(s, '###AUTH_EMAIL###', '(select auth.email())');
      s := replace(s, '###AUTH_JWT###', '(select auth.jwt())');
      
      RETURN s;
    END;
  $func$;
  
  -- Create a temporary function to handle the string replacement logic
  -- This is cleaner than repeating the logic inline
BEGIN
  -- We'll just define the logic inline in the loop using the strategy above
  
  FOR pol IN 
    SELECT 
      n.nspname as schema_name,
      c.relname as table_name,
      p.polname as policy_name,
      p.polcmd as policy_cmd,
      pg_get_expr(p.polqual, p.polrelid) as using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' -- Target public schema
  LOOP
    
    table_name := quote_ident(pol.schema_name) || '.' || quote_ident(pol.table_name);
    policy_name := quote_ident(pol.policy_name);
    
    -- Optimize USING clause
    new_using := pol.using_expr;
    IF new_using IS NOT NULL THEN
      -- Protect
      new_using := replace(new_using, '(select auth.uid())', '###AUTH_UID###');
      new_using := replace(new_using, '(select auth.role())', '###AUTH_ROLE###');
      new_using := replace(new_using, '(select auth.email())', '###AUTH_EMAIL###');
      new_using := replace(new_using, '(select auth.jwt())', '###AUTH_JWT###');
      -- Optimize
      new_using := replace(new_using, 'auth.uid()', '(select auth.uid())');
      new_using := replace(new_using, 'auth.role()', '(select auth.role())');
      new_using := replace(new_using, 'auth.email()', '(select auth.email())');
      new_using := replace(new_using, 'auth.jwt()', '(select auth.jwt())');
      -- Restore
      new_using := replace(new_using, '###AUTH_UID###', '(select auth.uid())');
      new_using := replace(new_using, '###AUTH_ROLE###', '(select auth.role())');
      new_using := replace(new_using, '###AUTH_EMAIL###', '(select auth.email())');
      new_using := replace(new_using, '###AUTH_JWT###', '(select auth.jwt())');
    END IF;

    -- Optimize WITH CHECK clause
    new_with_check := pol.with_check_expr;
    IF new_with_check IS NOT NULL THEN
      -- Protect
      new_with_check := replace(new_with_check, '(select auth.uid())', '###AUTH_UID###');
      new_with_check := replace(new_with_check, '(select auth.role())', '###AUTH_ROLE###');
      new_with_check := replace(new_with_check, '(select auth.email())', '###AUTH_EMAIL###');
      new_with_check := replace(new_with_check, '(select auth.jwt())', '###AUTH_JWT###');
      -- Optimize
      new_with_check := replace(new_with_check, 'auth.uid()', '(select auth.uid())');
      new_with_check := replace(new_with_check, 'auth.role()', '(select auth.role())');
      new_with_check := replace(new_with_check, 'auth.email()', '(select auth.email())');
      new_with_check := replace(new_with_check, 'auth.jwt()', '(select auth.jwt())');
      -- Restore
      new_with_check := replace(new_with_check, '###AUTH_UID###', '(select auth.uid())');
      new_with_check := replace(new_with_check, '###AUTH_ROLE###', '(select auth.role())');
      new_with_check := replace(new_with_check, '###AUTH_EMAIL###', '(select auth.email())');
      new_with_check := replace(new_with_check, '###AUTH_JWT###', '(select auth.jwt())');
    END IF;

    -- Only Execute ALTER if there's a change
    IF (pol.using_expr IS DISTINCT FROM new_using) OR (pol.with_check_expr IS DISTINCT FROM new_with_check) THEN
      cmd := format('ALTER POLICY %s ON %s TO %s', policy_name, table_name, 'public');
      -- Note: PostgreSQL ALTER POLICY syntax is complicated. Recreating might be safer or using specific USING/WITH CHECK keywords
      -- Syntax: ALTER POLICY name ON table_name [ RENAME TO new_name ] [ USING ( using_expression ) ] [ WITH CHECK ( check_expression ) ]
      
      -- We must strip the TO 'public' part if we want to use the standard syntax?
      -- Actually, ALTER POLICY doesn't let you change the roles it applies to easily without dropping/recreating.
      -- But we are only changing USING/WITH CHECK.
      
      cmd := format('ALTER POLICY %s ON %s ', policy_name, table_name);
      
      IF new_using IS NOT NULL THEN
        cmd := cmd || format(' USING (%s)', new_using);
      END IF;
      
      IF new_with_check IS NOT NULL THEN
        cmd := cmd || format(' WITH CHECK (%s)', new_with_check);
      END IF;
      
      EXECUTE cmd;
      RAISE NOTICE 'Optimized Policy: % ON %', pol.policy_name, pol.table_name;
    END IF;
    
  END LOOP;
END $$;

COMMIT;
