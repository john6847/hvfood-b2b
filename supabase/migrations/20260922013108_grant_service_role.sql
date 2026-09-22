-- Grant service_role full access to public tables and sequences.
-- service_role has BYPASSRLS in Postgres, but still requires standard SQL table
-- grants to read and mutate rows through the PostgREST Data API.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
