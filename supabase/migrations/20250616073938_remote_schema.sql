drop policy "Only admins can modify roles" on "public"."roles";

drop policy "Admins can insert users" on "public"."users";

drop policy "Admins can update users" on "public"."users";

drop policy "Admins can view all users" on "public"."users";

-- Skip test_deployment table operations if table doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_deployment') THEN
        EXECUTE 'revoke delete on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke insert on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke references on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke select on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke trigger on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke truncate on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke update on table "public"."test_deployment" from "anon"';
        EXECUTE 'revoke delete on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke insert on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke references on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke select on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke trigger on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke truncate on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke update on table "public"."test_deployment" from "authenticated"';
        EXECUTE 'revoke delete on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke insert on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke references on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke select on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke trigger on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke truncate on table "public"."test_deployment" from "service_role"';
        EXECUTE 'revoke update on table "public"."test_deployment" from "service_role"';
    END IF;
END $$;

alter table "public"."customers" drop constraint "customers_credit_limit_check";

alter table "public"."customers" drop constraint "customers_payment_terms_check";

alter table "public"."suppliers" drop constraint "suppliers_payment_terms_check";

alter table "public"."purchase_records" drop constraint "purchase_records_status_check";

-- Skip test_deployment constraint drop if table doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_deployment') THEN
        EXECUTE 'alter table "public"."test_deployment" drop constraint "test_deployment_pkey"';
    END IF;
END $$;

drop index if exists "public"."customers_is_active_idx";

drop index if exists "public"."customers_phone_idx";

drop index if exists "public"."purchase_records_closure_date_idx";

drop index if exists "public"."suppliers_is_active_idx";

drop index if exists "public"."suppliers_name_idx";

drop index if exists "public"."suppliers_phone_idx";

drop index if exists "public"."test_deployment_pkey";

drop table if exists "public"."test_deployment";

alter table "public"."customers" drop column "city";

alter table "public"."customers" drop column "is_active";

alter table "public"."customers" drop column "phone";

alter table "public"."customers" drop column "pincode";

alter table "public"."customers" drop column "state";

alter table "public"."customers" add column "contact" text not null;

alter table "public"."customers" add column "current_balance" numeric not null default 0;

alter table "public"."customers" add column "customer_type" text not null default 'retailer'::text;

alter table "public"."customers" add column "pan_number" text;

alter table "public"."customers" add column "status" text not null default 'active'::text;

alter table "public"."customers" alter column "address" set not null;

alter table "public"."customers" alter column "credit_limit" set not null;

alter table "public"."customers" alter column "email" set not null;

alter table "public"."customers" alter column "payment_terms" set not null;

alter table "public"."purchase_records" drop column "closure_date";

alter table "public"."purchase_records" drop column "closure_notes";

alter table "public"."purchase_records" alter column "status" set default 'completed'::text;

alter table "public"."suppliers" drop column "city";

alter table "public"."suppliers" drop column "is_active";

alter table "public"."suppliers" drop column "name";

alter table "public"."suppliers" drop column "pincode";

alter table "public"."suppliers" drop column "state";

alter table "public"."suppliers" add column "account_number" text;

alter table "public"."suppliers" add column "bank_name" text;

alter table "public"."suppliers" add column "company_name" text not null;

alter table "public"."suppliers" add column "credit_limit" numeric not null default 0;

alter table "public"."suppliers" add column "current_balance" numeric not null default 0;

alter table "public"."suppliers" add column "ifsc_code" text;

alter table "public"."suppliers" add column "pan_number" text;

alter table "public"."suppliers" add column "products" text[] default '{}'::text[];

alter table "public"."suppliers" add column "status" text not null default 'active'::text;

alter table "public"."suppliers" alter column "address" set not null;

alter table "public"."suppliers" alter column "contact_person" set not null;

alter table "public"."suppliers" alter column "email" set not null;

alter table "public"."suppliers" alter column "payment_terms" set not null;

alter table "public"."suppliers" alter column "phone" set not null;

drop sequence if exists "public"."test_deployment_id_seq";

CREATE INDEX customers_status_idx ON public.customers USING btree (status);

CREATE INDEX customers_type_idx ON public.customers USING btree (customer_type);

CREATE INDEX suppliers_company_name_idx ON public.suppliers USING btree (company_name);

CREATE INDEX suppliers_status_idx ON public.suppliers USING btree (status);

alter table "public"."customers" add constraint "customers_customer_type_check" CHECK ((customer_type = ANY (ARRAY['retailer'::text, 'wholesaler'::text, 'restaurant'::text, 'other'::text]))) not valid;

alter table "public"."customers" validate constraint "customers_customer_type_check";

alter table "public"."customers" add constraint "customers_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."customers" validate constraint "customers_status_check";

alter table "public"."suppliers" add constraint "suppliers_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."suppliers" validate constraint "suppliers_status_check";

alter table "public"."purchase_records" add constraint "purchase_records_status_check" CHECK ((status = ANY (ARRAY['completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."purchase_records" validate constraint "purchase_records_status_check";

create policy "Enable insert access for all users"
on "public"."products"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."products"
as permissive
for select
to public
using (true);


create policy "Service role can modify roles"
on "public"."roles"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Enable insert access for all users"
on "public"."skus"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."skus"
as permissive
for select
to public
using (true);


create policy "Service role can access all users"
on "public"."users"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));
