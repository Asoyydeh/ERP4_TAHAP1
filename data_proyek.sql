--
-- PostgreSQL database dump
--

\restrict wplmXnCChq1rsb6SHuSsVcH87jxah1GKr9uO9Y5NKUsBly7VKeJM39GnacXp7gV

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: DocStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'REVISED_BY_PROCUREMENT',
    'APPROVED',
    'REJECTED',
    'PO_PENDING',
    'PO_RELEASED'
);


ALTER TYPE public."DocStatus" OWNER TO postgres;

--
-- Name: DocType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocType" AS ENUM (
    'SPK',
    'PENAWARAN_FINAL',
    'DRAWING_AS_BUILT',
    'INVOICE',
    'SUBKON_DOCS',
    'RFQ_SCAN_KOSONG',
    'DRAWING',
    'FOTO',
    'RAB',
    'PENAWARAN_DRAFT',
    'BOQ',
    'FORECAST_COST'
);


ALTER TYPE public."DocType" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ENGINEERING',
    'PROYEK_ADMIN',
    'PROCUREMENT',
    'FINANCE',
    'ADMIN_MONITORING',
    'SUPERADMIN',
    'HRD'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendances (
    id text NOT NULL,
    user_id text NOT NULL,
    date date NOT NULL,
    check_in timestamp(3) without time zone,
    check_out timestamp(3) without time zone,
    status text DEFAULT 'HADIR'::text NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    photo_url text
);


ALTER TABLE public.attendances OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    action_type text NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    description text NOT NULL,
    old_values text,
    new_values text,
    ip_address text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: boq_headers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boq_headers (
    id text NOT NULL,
    document_id text NOT NULL,
    total_amount double precision DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.boq_headers OWNER TO postgres;

--
-- Name: boq_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.boq_items (
    id text NOT NULL,
    boq_header_id text NOT NULL,
    wbs_code text,
    description text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    rate_engineering double precision NOT NULL,
    rate_procurement double precision NOT NULL,
    total_price double precision NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.boq_items OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    sender_id text NOT NULL,
    receiver_id text,
    target_role public."Role",
    message text NOT NULL,
    attachment_url text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text NOT NULL,
    project_id text NOT NULL,
    file_name text NOT NULL,
    file_type public."DocType" NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    uploaded_by_id text NOT NULL,
    status public."DocStatus" DEFAULT 'DRAFT'::public."DocStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    sub_folder_name text
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: master_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_clients (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.master_clients OWNER TO postgres;

--
-- Name: master_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_companies (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.master_companies OWNER TO postgres;

--
-- Name: master_numberings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_numberings (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.master_numberings OWNER TO postgres;

--
-- Name: master_subkons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_subkons (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.master_subkons OWNER TO postgres;

--
-- Name: penawaran_headers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penawaran_headers (
    id text NOT NULL,
    document_id text NOT NULL,
    vendor_name text NOT NULL,
    quote_number text,
    total_offer double precision NOT NULL,
    validity_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.penawaran_headers OWNER TO postgres;

--
-- Name: penawaran_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penawaran_items (
    id text NOT NULL,
    penawaran_header_id text NOT NULL,
    item_no integer NOT NULL,
    description text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL,
    notes text
);


ALTER TABLE public.penawaran_items OWNER TO postgres;

--
-- Name: project_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_jobs (
    id text NOT NULL,
    project_id text NOT NULL,
    uraian_pekerjaan text,
    rfq_date text,
    progress text,
    subkon1_nama text,
    subkon1_status text,
    subkon2_nama text,
    subkon2_status text,
    subkon3_nama text,
    subkon3_status text,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.project_jobs OWNER TO postgres;

--
-- Name: project_subkon_termins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_subkon_termins (
    id text NOT NULL,
    project_subkon_id text NOT NULL,
    nilai_jasa double precision,
    pembayaran_persen double precision,
    prosedur_penagihan text,
    auto_rfq text,
    auto_boq text,
    auto_spk text,
    auto_foto_progress text,
    bapp text,
    laporan_progress text,
    surat_jalan text,
    ceklist text,
    bast_bas_t2 text,
    proforma_invoice text,
    tanda_terima_tukar_faktur text,
    invoice text,
    kwitansi text,
    tanggal_pengajuan timestamp(3) without time zone,
    tanggal_dibayar timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    npwp text,
    spfkp_ktp text
);


ALTER TABLE public.project_subkon_termins OWNER TO postgres;

--
-- Name: project_subkons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_subkons (
    id text NOT NULL,
    project_id text NOT NULL,
    master_subkon_id text,
    nama_pekerjaan text,
    kategori text,
    nilai_kontrak double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'SUBKON1'::text NOT NULL
);


ALTER TABLE public.project_subkons OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    code text DEFAULT ''::text NOT NULL,
    end_date timestamp(3) without time zone,
    progress integer DEFAULT 0 NOT NULL,
    remarks text,
    start_date timestamp(3) without time zone,
    sequence integer NOT NULL,
    boq_due_date timestamp(3) without time zone,
    boq_pic_id text,
    invoice_due_date timestamp(3) without time zone,
    invoice_pic_id text,
    penawaran_due_date timestamp(3) without time zone,
    penawaran_pic_id text,
    progress_due_date timestamp(3) without time zone,
    progress_pic_id text,
    rfq_due_date timestamp(3) without time zone,
    rfq_pic_id text,
    spk_due_date timestamp(3) without time zone,
    spk_pic_id text
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_sequence_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_sequence_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_sequence_seq OWNER TO postgres;

--
-- Name: projects_sequence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_sequence_seq OWNED BY public.projects.sequence;


--
-- Name: rfq_headers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfq_headers (
    id text NOT NULL,
    document_id text NOT NULL,
    rfq_number text NOT NULL,
    target_date timestamp(3) without time zone,
    terms text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.rfq_headers OWNER TO postgres;

--
-- Name: rfq_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfq_items (
    id text NOT NULL,
    rfq_header_id text NOT NULL,
    item_no integer NOT NULL,
    description text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    specifications text,
    notes text
);


ALTER TABLE public.rfq_items OWNER TO postgres;

--
-- Name: user_folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_folders (
    id text NOT NULL,
    user_id text NOT NULL,
    folder_path text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_folders OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public."Role" DEFAULT 'ENGINEERING'::public."Role" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    address text,
    photo_url text,
    manager_id text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: work_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_reports (
    id text NOT NULL,
    user_id text NOT NULL,
    date date NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    attachment_url text
);


ALTER TABLE public.work_reports OWNER TO postgres;

--
-- Name: projects sequence; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN sequence SET DEFAULT nextval('public.projects_sequence_seq'::regclass);


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendances (id, user_id, date, check_in, check_out, status, notes, created_at, updated_at, photo_url) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action_type, table_name, record_id, description, old_values, new_values, ip_address, "timestamp") FROM stdin;
ac7a511b-ebee-45a3-8fe0-1f713848153a	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	1c1daf9e-d2f4-468a-894e-9e4444bbfc10	Membuka/melihat berkas 'Invoice_DP_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:32:10.172
b793ae0c-91a2-4977-8c56-c289e75dff77	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	534d2b1c-4a32-4c09-a557-346a54ebd830	Membuka/melihat berkas 'Drawing_AsBuilt_A.dwg'	\N	\N	127.0.0.1	2026-07-30 02:32:14.02
283f55f8-f7fa-4364-9028-0cb5582bdfcc	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8cce8e2f-de9c-4674-93d4-5badb88a2600	Membuka/melihat berkas 'Penawaran_Final_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:32:16.459
d1d84d6e-078f-46e0-bad5-e60cdb0cd45e	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8cce8e2f-de9c-4674-93d4-5badb88a2600	Membuka/melihat berkas 'Penawaran_Final_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:32:40.438
79c3cd7e-2cb6-4dd4-8171-3fb7d2aba36c	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	1c1daf9e-d2f4-468a-894e-9e4444bbfc10	Membuka/melihat berkas 'Invoice_DP_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:32:49.367
d504df76-c4fc-42a2-bc98-01c39ce3b993	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8cce8e2f-de9c-4674-93d4-5badb88a2600	Membuka/melihat berkas 'Penawaran_Final_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:32:53.341
6c006a90-8654-4fed-9ebe-a26265dbc9bb	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	96024b3a-9e9b-4e41-97f3-1773896be135	Membuka/melihat berkas 'SPK_Subkon5_Daikin.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:03.251
cd240845-b483-4a18-b4df-0bae73b431bd	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	be5c6a9d-2759-42f9-ace7-00ab69c7084e	Membuka/melihat berkas 'SPK_Subkon4_Schneider.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:07.376
bc426e6d-abcf-43fe-b66c-d0687f31b9a6	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8cce8e2f-de9c-4674-93d4-5badb88a2600	Membuka/melihat berkas 'Penawaran_Final_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:20.032
bc1b3fb9-7669-432e-be06-e0095799bc0b	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	18891ec8-1237-4510-a41c-8f86df2ae400	Membuka/melihat berkas 'BOQ_Material_Cabling.xlsx'	\N	\N	127.0.0.1	2026-07-30 02:33:30.337
c7e5e1f3-9869-4a66-81eb-fd54dc592faf	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	ebb087aa-e7af-40f7-b0cd-d1de8ed01530	Membuka/melihat berkas 'BOQ_Material_Server.xlsx'	\N	\N	127.0.0.1	2026-07-30 02:33:30.344
7b5ce86e-9568-4be7-b861-3d03b1e94402	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	1a5c0b09-70df-47f7-ad93-9123b29b4497	Membuka/melihat berkas 'Draft_Penawaran_V1.xlsx'	\N	\N	127.0.0.1	2026-07-30 02:33:30.365
f2a21e83-5c78-43ca-bab4-a218f09ae0fe	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8374f196-5bda-4a3d-95d9-186fd96d4a0a	Membuka/melihat berkas 'Forecast_Budget_Q3.xlsx'	\N	\N	127.0.0.1	2026-07-30 02:33:30.38
98e2b65a-8f62-4931-986c-3f656025b3e3	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	67277d2d-5524-4bb7-a622-39ad326dbfdf	Membuka/melihat berkas 'RAB_Internal_PDN.xlsx'	\N	\N	127.0.0.1	2026-07-30 02:33:30.386
fa88fd40-0350-4a3a-bf3a-f908a305a1ec	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	b680d88f-c12e-4f30-9b0a-cdd3b3e1f5e5	Membuka/melihat berkas 'Foto_Progress_Minggu2.jpg'	\N	\N	127.0.0.1	2026-07-30 02:33:30.395
483a016e-c972-4fb7-95a9-faf0507001ee	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	3d3477ac-ddc9-4dd8-aae9-49374ac0b1c8	Membuka/melihat berkas 'Foto_Progress_Minggu1.jpg'	\N	\N	127.0.0.1	2026-07-30 02:33:30.41
5912d58b-3400-4fb2-a060-cba9598dc46b	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	64c23895-77c2-4877-b9f1-63ab68fa70e8	Membuka/melihat berkas 'Draft_Drawing_MEP.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.429
d37906ba-0014-45e3-94c6-a58c973e061c	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	84f662d9-4398-4385-90a3-7640925971d2	Membuka/melihat berkas 'Draft_Drawing_Arsitektur.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.444
8bd8ce9f-1f65-4244-b3bc-dd343952b479	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	96024b3a-9e9b-4e41-97f3-1773896be135	Membuka/melihat berkas 'SPK_Subkon5_Daikin.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.46
b13957da-e946-4335-af81-03fbd0ea2a38	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	be5c6a9d-2759-42f9-ace7-00ab69c7084e	Membuka/melihat berkas 'SPK_Subkon4_Schneider.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.478
3bb927cf-bb11-4703-9431-b9a8f3ea902b	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	fa26a5fc-81ef-41b4-95e0-207f4c2ddb13	Membuka/melihat berkas 'SPK_Subkon3_Dell.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.494
aeae924e-755f-4d80-8304-934d69779017	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	43a9c98f-3f89-4f74-bd0e-f0d8545b0bc5	Membuka/melihat berkas 'SPK_Subkon2_HP.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.509
e24e07e0-3ea6-4f84-bb5c-8283ed77d8be	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	2d29a031-6854-4052-88fd-ac49806abcb7	Membuka/melihat berkas 'Invoice_Subkon1.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.524
5c29518e-9eed-4a94-b5bb-0daecfb8236e	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	c2be5846-c7a7-48f9-8936-0d1f154a4a35	Membuka/melihat berkas 'SPK_Subkon1_Cisco.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.542
b96141f3-dd0a-47f4-8e22-6e45e6122495	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	052510a7-0295-40a2-b9e1-01d439a037a4	Membuka/melihat berkas 'RFQ_Kabel_Kosong.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.558
cb636148-f6a4-4960-a6bf-ecc28fc7822e	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8f49d41f-bf97-424a-aa5c-a75cfe031f05	Membuka/melihat berkas 'RFQ_Server_Kosong.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.574
879a6ef9-4b84-4e04-9eee-9c4452935190	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	18c386e4-b756-4562-840a-4e2806e559f5	Membuka/melihat berkas 'Invoice_Termin1_IT.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.578
b89f1aab-6405-4a9f-9f18-22d16dc9f0ef	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	852b6e71-336e-4164-b5e6-7ee2d620f4c0	Membuka/melihat berkas 'SPK_Klien_IT.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.588
a7ebe575-ef64-485a-9a8c-ddb906985c6a	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	1c1daf9e-d2f4-468a-894e-9e4444bbfc10	Membuka/melihat berkas 'Invoice_DP_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.598
c5903b0c-6faf-4d3b-b8df-5ebc0096a4c8	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	534d2b1c-4a32-4c09-a557-346a54ebd830	Membuka/melihat berkas 'Drawing_AsBuilt_A.dwg'	\N	\N	127.0.0.1	2026-07-30 02:33:30.604
a5521ee4-9e77-40de-83eb-cd7913f78c47	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	8cce8e2f-de9c-4674-93d4-5badb88a2600	Membuka/melihat berkas 'Penawaran_Final_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.614
c5b5043c-1148-4f4e-8ae9-455cb2afc8b3	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	VIEW_DOCUMENT	documents	6d6dca09-29c4-4319-802d-8f55415bbb3e	Membuka/melihat berkas 'SPK_Klien_PDN.pdf'	\N	\N	127.0.0.1	2026-07-30 02:33:30.629
d3f85237-3ec8-4c71-85e4-4c0f64de4c1b	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	VIEW_DOCUMENT	documents	2ad56e7d-1d2b-4a55-9509-86fce8170ee7	Membuka/melihat berkas 'Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf'	\N	\N	127.0.0.1	2026-07-30 02:55:39.5
7233ff33-fa5c-4dc3-b096-1f55bf6beac9	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	DELETE_PROJECT	projects	d1e772b6-0003-4c1c-a9d3-b9a1f8c8a246	Proyek 'Pembangunan Pusat Data Nasional' berhasil dihapus	{"id":"d1e772b6-0003-4c1c-a9d3-b9a1f8c8a246","name":"Pembangunan Pusat Data Nasional","description":"Proyek strategis pembangunan pusat data nasional berskala tinggi.","createdAt":"2026-07-30T02:19:14.275Z","code":"PDN-2026","endDate":null,"progress":45,"remarks":null,"startDate":null,"sequence":189,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	\N	127.0.0.1	2026-07-30 02:36:11.176
67182a00-9176-46c9-a94a-e0198667fc58	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	DELETE_PROJECT	projects	5fd19032-7a98-4dbb-ae30-d458aedba2a6	Proyek 'Renovasi Infrastruktur Kantor IT' berhasil dihapus	{"id":"5fd19032-7a98-4dbb-ae30-d458aedba2a6","name":"Renovasi Infrastruktur Kantor IT","description":"Proyek renovasi dan modernisasi infrastruktur jaringan dan ruang kerja.","createdAt":"2026-07-30T02:19:14.281Z","code":"IT-RENOV","endDate":null,"progress":80,"remarks":null,"startDate":null,"sequence":190,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	\N	127.0.0.1	2026-07-30 02:36:13.234
9c5758c4-2746-4906-adc0-a9b2e8c08031	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	CREATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'Pembuatan jalan' (001 - MJK - AFI1) berhasil didaftarkan	\N	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:36:29.107
c2742458-a16b-435d-aced-40cb3689f5f2	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	CREATE_PROJECT	projects	37be48b3-267b-4eb1-a741-169bdc057691	Proyek 'Wc' (002 - MJK - AFI5) berhasil didaftarkan	\N	{"id":"37be48b3-267b-4eb1-a741-169bdc057691","name":"Wc","description":"","createdAt":"2026-07-30T02:37:16.206Z","code":"002 - MJK - AFI5","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":2,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:37:16.211
d13d9396-f939-43a3-8d78-396d1018e602	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	CREATE_PROJECT	projects	9151cc70-c9a4-4342-ba8f-cc45f91c1b77	Proyek 'Pohon cemara' (003 - MJK - AFI3) berhasil didaftarkan	\N	{"id":"9151cc70-c9a4-4342-ba8f-cc45f91c1b77","name":"Pohon cemara","description":"","createdAt":"2026-07-30T02:37:28.262Z","code":"003 - MJK - AFI3","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":3,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:37:28.267
78bceff4-d18c-4ebb-a060-1ca0232d41ef	13436f2e-2589-4bf5-ab69-b0dad33ce3da	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'Pembuatan jalan' (001 - MJK - AFI1) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:40:13.718
9c403092-9538-4507-ab48-a60374678273	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	61022667-709c-4a3d-baac-3b6cf8180d4e	Mengunggah berkas 012. PINV.AFI3.TGL.WS456.012.pdf (DRAWING)	\N	{"document":{"id":"61022667-709c-4a3d-baac-3b6cf8180d4e","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"012. PINV.AFI3.TGL.WS456.012.pdf","fileType":"DRAWING","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\drawing\\\\012__PINV_AFI3_TGL_WS456_012-1785379237016-379402996.pdf","fileSize":673895,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:40:37.031Z","updatedAt":"2026-07-30T02:40:37.031Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:40:37.033
fc7b40d8-8464-47f5-b770-7c6fa897a526	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	40467674-1c78-48ce-90a8-adba991c01be	Mengunggah berkas GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf (RAB)	\N	{"document":{"id":"40467674-1c78-48ce-90a8-adba991c01be","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf","fileType":"RAB","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rab\\\\GA_PENAMBAHAN_FAN_BLOWER_B9__B9_________________PT_AFI_1_220426-1785379244965-351436158.pdf","fileSize":8539322,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:40:45.023Z","updatedAt":"2026-07-30T02:40:45.023Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:40:45.026
a162f936-33cc-41c5-8a7d-77d59f6d5408	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	86058c82-aee6-4c84-a47f-41f3648b38d9	Mengunggah berkas Quo_AFI Penambahan Water Treatment di Gudang B7 (sistem) R5 23062026.pdf (PENAWARAN_DRAFT)	\N	{"document":{"id":"86058c82-aee6-4c84-a47f-41f3648b38d9","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_AFI Penambahan Water Treatment di Gudang B7 (sistem) R5 23062026.pdf","fileType":"PENAWARAN_DRAFT","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\penawaran_draft\\\\Quo_AFI_Penambahan_Water_Treatment_di_Gudang_B7__sistem__R5_23062026-1785379261917-704963392.pdf","fileSize":585150,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:41:01.923Z","updatedAt":"2026-07-30T02:41:01.923Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:41:01.925
d41c7cbe-0e8f-4763-ab72-25b5e147746b	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	VIEW_DOCUMENT	documents	86058c82-aee6-4c84-a47f-41f3648b38d9	Membuka/melihat berkas 'Quo_AFI Penambahan Water Treatment di Gudang B7 (sistem) R5 23062026.pdf'	\N	\N	127.0.0.1	2026-07-30 02:56:24.802
33e987fe-69bf-4ee2-af02-3c4a4651ca0d	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	2ad56e7d-1d2b-4a55-9509-86fce8170ee7	Mengunggah berkas Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf (DRAWING_AS_BUILT)	\N	{"document":{"id":"2ad56e7d-1d2b-4a55-9509-86fce8170ee7","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf","fileType":"DRAWING_AS_BUILT","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\drawing_as_built\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379273368-850402260.pdf","fileSize":1589261,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:41:13.382Z","updatedAt":"2026-07-30T02:41:13.382Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:41:13.383
fc99125d-18ae-4156-9cde-c485e1710e7b	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	a73c4898-6e42-4bd2-acd8-e6aa4666f4b4	Mengunggah berkas R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf (RFQ_SCAN_KOSONG)	\N	{"document":{"id":"a73c4898-6e42-4bd2-acd8-e6aa4666f4b4","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf","fileType":"RFQ_SCAN_KOSONG","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rfq_scan_kosong\\\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379294240-967597914.pdf","fileSize":12162652,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:41:34.309Z","updatedAt":"2026-07-30T02:41:34.309Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:41:34.313
a45e9d3c-85dd-4240-9783-9c87422f4c01	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	d9fbf9d9-f924-42a5-b982-d210501b6a8f	Mengunggah berkas R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf (SUBKON_DOCS)	\N	{"document":{"id":"d9fbf9d9-f924-42a5-b982-d210501b6a8f","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf","fileType":"SUBKON_DOCS","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\subkon_docs\\\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379318294-92251685.pdf","fileSize":12162652,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PO_PENDING","subFolderName":"PT.Yunbo","createdAt":"2026-07-30T02:41:58.348Z","updatedAt":"2026-07-30T02:41:58.348Z"},"parseResult":null}	127.0.0.1	2026-07-30 02:41:58.35
8d0e159a-38aa-45dc-90c2-3ddcab94c7c1	ef5f70b3-dd85-4d3e-b937-0cecad282504	UPLOAD_DOCUMENT	documents	adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa	Mengunggah berkas Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx (BOQ) dan berhasil di-parse ke database	\N	{"document":{"id":"adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx","fileType":"BOQ","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\boq\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379327406-211402516.xlsx","fileSize":1070687,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:42:07.418Z","updatedAt":"2026-07-30T02:42:07.418Z"},"parseResult":{"boqHeaderId":"7376d76c-d724-49a4-ad14-1e4c2c642faa","totalAmount":0,"itemCount":0}}	127.0.0.1	2026-07-30 02:42:08.217
c71123b1-a11f-49be-b091-d2234e1dddd3	3e122706-df9e-43fd-9abe-1fdbc0eccb03	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:42:51
f011eb32-ffe6-4cf2-86c2-c94ece25562b	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	37be48b3-267b-4eb1-a741-169bdc057691	Proyek 'undefined' (-) berhasil diperbarui	{"id":"37be48b3-267b-4eb1-a741-169bdc057691","name":"Wc","description":"","createdAt":"2026-07-30T02:37:16.206Z","code":"002 - MJK - AFI5","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":2,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"37be48b3-267b-4eb1-a741-169bdc057691","name":"Wc","description":"","createdAt":"2026-07-30T02:37:16.206Z","code":"002 - MJK - AFI5","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":2,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":"14540629-96da-446b-8151-4209570eb5a4","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:42:57.295
d4fdde98-292e-4a40-8a86-5d6b8f117436	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	9151cc70-c9a4-4342-ba8f-cc45f91c1b77	Proyek 'undefined' (-) berhasil diperbarui	{"id":"9151cc70-c9a4-4342-ba8f-cc45f91c1b77","name":"Pohon cemara","description":"","createdAt":"2026-07-30T02:37:28.262Z","code":"003 - MJK - AFI3","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":3,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":null,"spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"9151cc70-c9a4-4342-ba8f-cc45f91c1b77","name":"Pohon cemara","description":"","createdAt":"2026-07-30T02:37:28.262Z","code":"003 - MJK - AFI3","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":3,"penawaranPicId":null,"penawaranDueDate":null,"boqPicId":null,"boqDueDate":null,"rfqPicId":null,"rfqDueDate":null,"spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:43:06.888
b1bd204f-e871-4b75-a3a2-0392b5f2339d	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:43:21.99
9728677a-54a6-4efe-98eb-397e502263bf	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":null,"progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:43:35.975
19b781c4-ca53-4613-b1ab-5898c5c82155	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:52:39.551
606d7ef1-97c0-448e-926e-eaeba39acfaa	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}]}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 02:53:52.448
baa41c76-552b-4b9b-9b1e-037c9079f68d	14540629-96da-446b-8151-4209570eb5a4	VIEW_DOCUMENT	documents	2ad56e7d-1d2b-4a55-9509-86fce8170ee7	Membuka/melihat berkas 'Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf'	\N	\N	127.0.0.1	2026-07-30 02:54:41.64
3536c4d4-b783-4070-bbd2-88a8d42ba871	14540629-96da-446b-8151-4209570eb5a4	VIEW_DOCUMENT	documents	d9fbf9d9-f924-42a5-b982-d210501b6a8f	Membuka/melihat berkas 'R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf'	\N	\N	127.0.0.1	2026-07-30 02:54:46.748
8e1c242f-6315-4f2e-9a4e-06277dde3305	14540629-96da-446b-8151-4209570eb5a4	VIEW_DOCUMENT	documents	a73c4898-6e42-4bd2-acd8-e6aa4666f4b4	Membuka/melihat berkas 'R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf'	\N	\N	127.0.0.1	2026-07-30 02:54:49.685
edd5204b-bcce-46b7-b30d-e6c814325778	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	VIEW_DOCUMENT	documents	a73c4898-6e42-4bd2-acd8-e6aa4666f4b4	Membuka/melihat berkas 'R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf'	\N	\N	127.0.0.1	2026-07-30 02:55:48.464
69218f68-8ff3-426b-aaef-8e579ad97b3f	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	VIEW_DOCUMENT	documents	d9fbf9d9-f924-42a5-b982-d210501b6a8f	Membuka/melihat berkas 'R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf'	\N	\N	127.0.0.1	2026-07-30 02:56:12.666
f2d2f6b5-5cb8-4b47-9d59-2f601e56e37b	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	VIEW_DOCUMENT	documents	40467674-1c78-48ce-90a8-adba991c01be	Membuka/melihat berkas 'GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf'	\N	\N	127.0.0.1	2026-07-30 02:56:27.662
f42e868a-93d4-4d71-b3e5-7ca227d1b2d5	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}]}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	127.0.0.1	2026-07-30 03:06:21.953
3756db5e-9dde-4c5c-98ca-cb9594d971da	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":null,"invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:06:28.674
280bbebc-4cec-4de0-8896-8d929420b8eb	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"},{\\"id\\":\\"t_1785380792103_z9sv\\",\\"termin\\":\\"T2\\",\\"nilaiInvoice\\":0,\\"pphType\\":\\"1.75\\",\\"statusPenagihan\\":\\"Belum Lunas\\",\\"penagihanRemarks\\":\\"\\",\\"issue\\":\\"\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:06:32.116
26a6509f-078e-43cd-87fb-f3e213604000	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"},{\\"id\\":\\"t_1785380792103_z9sv\\",\\"termin\\":\\"T2\\",\\"nilaiInvoice\\":0,\\"pphType\\":\\"1.75\\",\\"statusPenagihan\\":\\"Belum Lunas\\",\\"penagihanRemarks\\":\\"\\",\\"issue\\":\\"\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:06:42.782
40b8a562-ef14-479a-b69c-44399978a36c	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:06:55.886
53e667fc-9fc6-47ec-8c89-f0c9d575d496	3e122706-df9e-43fd-9abe-1fdbc0eccb03	UPLOAD_DOCUMENT	documents	6e08d705-7302-46dc-bf14-ea9adaca1059	Mengunggah berkas 012. PINV.AFI3.TGL.WS456.012.pdf (INVOICE)	\N	{"document":{"id":"6e08d705-7302-46dc-bf14-ea9adaca1059","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"012. PINV.AFI3.TGL.WS456.012.pdf","fileType":"INVOICE","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\3e122706-df9e-43fd-9abe-1fdbc0eccb03\\\\invoice\\\\012__PINV_AFI3_TGL_WS456_012-1785380936793-285348925.pdf","fileSize":673895,"uploadedById":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T03:08:56.805Z","updatedAt":"2026-07-30T03:08:56.805Z"},"parseResult":null}	127.0.0.1	2026-07-30 03:08:56.808
104c992d-5c15-4dfe-94f9-71ab24972d74	3e122706-df9e-43fd-9abe-1fdbc0eccb03	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:09:36.325
87262d6a-f2e2-441c-b5c5-455ea2c63823	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"},{\\"id\\":\\"t_1785380991861_npg4\\",\\"termin\\":\\"T2\\",\\"nilaiInvoice\\":0,\\"pphType\\":\\"1.75\\",\\"statusPenagihan\\":\\"Belum Lunas\\",\\"penagihanRemarks\\":\\"\\",\\"issue\\":\\"\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:09:51.876
e1fb9775-25ac-4574-a90d-227b5cc8bf65	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"},{\\"id\\":\\"t_1785380991861_npg4\\",\\"termin\\":\\"T2\\",\\"nilaiInvoice\\":0,\\"pphType\\":\\"1.75\\",\\"statusPenagihan\\":\\"Belum Lunas\\",\\"penagihanRemarks\\":\\"\\",\\"issue\\":\\"\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:10:06.741
1d4a83a2-17fc-41cb-a063-8ea8d9ef5ae3	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":null,"progress":0,"remarks":"{\\"remarksKeterangan\\":\\"Berjalan\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/001\\",\\"procurementModalBoq\\":\\"150000000\\",\\"procurementPengeluaran\\":\\"84352000\\",\\"procurementTrackingList\\":[{\\"id\\":\\"trk_1785380032432_m7u3\\",\\"projectId\\":\\"a2fee390-5517-4be1-b6a4-349c62e32405\\",\\"projectCode\\":\\"001 - MJK - AFI1\\",\\"projectName\\":\\"Pembuatan jalan\\",\\"reqBy\\":\\"Aji mahmud\\",\\"description\\":\\"1. Klep motor\\\\n2. Amplas kopling\\\\n3. Rem gas\\",\\"tanggalDiminta\\":\\"17/7/2026\\",\\"tanggalDibutuhkan\\":\\"17/7/2026\\",\\"tanggalPoDibuat\\":\\"17/7/2026\\",\\"tanggalTibaDiLokasi\\":\\"18/7/2026\\",\\"remarks\\":\\"Secepatnya ya\\"}],\\"progressManual\\":\\"15\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":150000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Besok ditagih\\",\\"issue\\":\\"Gak ada\\",\\"remark\\":\\"\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":150000000,\\"financePpn\\":16500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":2625000.0000000005,\\"financeGrandTotal\\":163875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Besok ditagih\\",\\"financeIssue\\":\\"Gak ada\\",\\"financeRemark\\":\\"\\",\\"subconNilaiKontrak\\":\\"150.000.000\\"}","startDate":null,"sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:15:22.687
2c20e03d-9b67-4442-895a-eb37616de01c	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:16:14.571
7b629a5c-ef44-4ec7-9b51-9ee508661aa2	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"2.65\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"2.65\\",\\"financePphRate\\":\\"\\",\\"financePph\\":6625000,\\"financeGrandTotal\\":270875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:16:21.633
7a571732-dfc6-415a-a20b-c7b41b715975	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"2.65\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"2.65\\",\\"financePphRate\\":\\"\\",\\"financePph\\":6625000,\\"financeGrandTotal\\":270875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"\\",\\"financePph\\":0,\\"financeGrandTotal\\":277500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:16:23.227
2249deab-6cdd-4210-8a84-0159fa176bec	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"\\",\\"financePph\\":0,\\"financeGrandTotal\\":277500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"1\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"1\\",\\"financePph\\":2500000,\\"financeGrandTotal\\":275000000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:16:25.835
ddae25eb-e811-49cb-a34d-712915d7918b	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"1\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"1\\",\\"financePph\\":2500000,\\"financeGrandTotal\\":275000000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:16:26.076
f998e9b5-099c-4f12-882a-09e8dfe3a2e1	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:17:13.617
6272ded5-278b-4bd0-9214-36c420498e95	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:17:24.226
713c2981-8fb5-4b85-928a-b5ca65152085	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:18:12.255
9fc8d54d-450e-43b1-a00b-816300dd96ee	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:19:29.587
40c4f65f-c1bc-4323-bfa7-8e9a528f21f3	14540629-96da-446b-8151-4209570eb5a4	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:19:40.958
7fe69317-a193-4705-a5b6-2482606fcf7e	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:20:29.748
ac7fae5e-6f7b-4ebe-8f55-83871909ee72	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 03:20:45.085
586c895a-6382-43ca-aed6-d1e8692e72e4	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_DOCUMENT_STATUS	documents	6e08d705-7302-46dc-bf14-ea9adaca1059	Mengubah status berkas '012. PINV.AFI3.TGL.WS456.012.pdf' dari PENDING menjadi APPROVED	{"id":"6e08d705-7302-46dc-bf14-ea9adaca1059","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"012. PINV.AFI3.TGL.WS456.012.pdf","fileType":"INVOICE","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\3e122706-df9e-43fd-9abe-1fdbc0eccb03\\\\invoice\\\\012__PINV_AFI3_TGL_WS456_012-1785380936793-285348925.pdf","fileSize":673895,"uploadedById":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T03:08:56.805Z","updatedAt":"2026-07-30T03:08:56.805Z"}	{"id":"6e08d705-7302-46dc-bf14-ea9adaca1059","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"012. PINV.AFI3.TGL.WS456.012.pdf","fileType":"INVOICE","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\3e122706-df9e-43fd-9abe-1fdbc0eccb03\\\\invoice\\\\012__PINV_AFI3_TGL_WS456_012-1785380936793-285348925.pdf","fileSize":673895,"uploadedById":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","status":"APPROVED","subFolderName":null,"createdAt":"2026-07-30T03:08:56.805Z","updatedAt":"2026-07-30T03:21:18.996Z"}	127.0.0.1	2026-07-30 03:21:18.999
67de9aa0-0b22-4313-8e02-1d387b2e1b4f	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_DOCUMENT_STATUS	documents	2ad56e7d-1d2b-4a55-9509-86fce8170ee7	Mengubah status berkas 'Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf' dari PENDING menjadi APPROVED	{"id":"2ad56e7d-1d2b-4a55-9509-86fce8170ee7","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf","fileType":"DRAWING_AS_BUILT","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\drawing_as_built\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379273368-850402260.pdf","fileSize":1589261,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:41:13.382Z","updatedAt":"2026-07-30T02:41:13.382Z"}	{"id":"2ad56e7d-1d2b-4a55-9509-86fce8170ee7","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf","fileType":"DRAWING_AS_BUILT","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\drawing_as_built\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379273368-850402260.pdf","fileSize":1589261,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"APPROVED","subFolderName":null,"createdAt":"2026-07-30T02:41:13.382Z","updatedAt":"2026-07-30T03:21:21.905Z"}	127.0.0.1	2026-07-30 03:21:21.911
c47bc1de-3855-4fed-8523-752b725f9716	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_DOCUMENT_STATUS	documents	a73c4898-6e42-4bd2-acd8-e6aa4666f4b4	Mengubah status berkas 'R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf' dari PENDING menjadi APPROVED	{"id":"a73c4898-6e42-4bd2-acd8-e6aa4666f4b4","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf","fileType":"RFQ_SCAN_KOSONG","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rfq_scan_kosong\\\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379294240-967597914.pdf","fileSize":12162652,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:41:34.309Z","updatedAt":"2026-07-30T02:41:34.309Z"}	{"id":"a73c4898-6e42-4bd2-acd8-e6aa4666f4b4","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf","fileType":"RFQ_SCAN_KOSONG","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rfq_scan_kosong\\\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379294240-967597914.pdf","fileSize":12162652,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"APPROVED","subFolderName":null,"createdAt":"2026-07-30T02:41:34.309Z","updatedAt":"2026-07-30T03:21:38.184Z"}	127.0.0.1	2026-07-30 03:21:38.19
c9406098-2f61-4858-a66f-b494198f4ddf	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_DOCUMENT_STATUS	documents	adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa	Mengubah status berkas 'Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx' dari PENDING menjadi APPROVED	{"id":"adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx","fileType":"BOQ","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\boq\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379327406-211402516.xlsx","fileSize":1070687,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:42:07.418Z","updatedAt":"2026-07-30T02:42:07.418Z"}	{"id":"adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx","fileType":"BOQ","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\boq\\\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379327406-211402516.xlsx","fileSize":1070687,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"APPROVED","subFolderName":null,"createdAt":"2026-07-30T02:42:07.418Z","updatedAt":"2026-07-30T03:22:06.737Z"}	127.0.0.1	2026-07-30 03:22:06.745
0baee43f-8f3e-440a-8417-d0faaac7bdd4	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_DOCUMENT_STATUS	documents	40467674-1c78-48ce-90a8-adba991c01be	Mengubah status berkas 'GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf' dari PENDING menjadi APPROVED	{"id":"40467674-1c78-48ce-90a8-adba991c01be","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf","fileType":"RAB","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rab\\\\GA_PENAMBAHAN_FAN_BLOWER_B9__B9_________________PT_AFI_1_220426-1785379244965-351436158.pdf","fileSize":8539322,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"PENDING","subFolderName":null,"createdAt":"2026-07-30T02:40:45.023Z","updatedAt":"2026-07-30T02:40:45.023Z"}	{"id":"40467674-1c78-48ce-90a8-adba991c01be","projectId":"a2fee390-5517-4be1-b6a4-349c62e32405","fileName":"GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf","fileType":"RAB","filePath":"C:\\\\PROJECT\\\\assetmenagemen\\\\backend\\\\storage\\\\uploads\\\\users\\\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\\\rab\\\\GA_PENAMBAHAN_FAN_BLOWER_B9__B9_________________PT_AFI_1_220426-1785379244965-351436158.pdf","fileSize":8539322,"uploadedById":"ef5f70b3-dd85-4d3e-b937-0cecad282504","status":"APPROVED","subFolderName":null,"createdAt":"2026-07-30T02:40:45.023Z","updatedAt":"2026-07-30T03:22:09.808Z"}	127.0.0.1	2026-07-30 03:22:09.811
f5fe6dda-d428-4dd3-8be4-90af1de317ad	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Oke\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:08:47.469
60d24458-5e5c-4ccc-9a0a-860f43c114bc	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Oke\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:09:04.384
a72b2bf6-9e4e-47dd-92dd-ac921e81cc87	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Cancel\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:32:14.876
97d62a26-497e-425b-b028-e404aec2d855	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Cancel\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:32:19.706
098f05bd-9455-432a-ad66-4c546ea18fbe	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Retensi\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Retensi\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:32:24.972
c89cc66f-b3c7-4580-9838-f58d90939ace	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Retensi\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Retensi\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 04:32:26.936
f91b128c-0930-42f7-b3bf-eecd7b9af866	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 06:43:04.894
1a2a7695-53eb-442d-8edf-c4fe7a7cc7da	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"manual\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"manual\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":25000000,\\"financeGrandTotal\\":252500000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"2.65\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"2.65\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":6625000,\\"financeGrandTotal\\":270875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 06:43:18.461
6fe648ce-24b0-4f5c-bd5d-bb8c0f472663	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	UPDATE_PROJECT	projects	a2fee390-5517-4be1-b6a4-349c62e32405	Proyek 'undefined' (-) berhasil diperbarui	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"2.65\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"2.65\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":6625000,\\"financeGrandTotal\\":270875000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	{"id":"a2fee390-5517-4be1-b6a4-349c62e32405","name":"Pembuatan jalan","description":"{\\"reqBy\\":\\"Siswanto\\",\\"reqDate\\":\\"2026-07-01\\"}","createdAt":"2026-07-30T02:36:29.101Z","code":"001 - MJK - AFI1","endDate":"2026-12-31T00:00:00.000Z","progress":0,"remarks":"{\\"nilaiKontrak\\":250000000,\\"financeRemark\\":\\"Kontrak disetujui Finance\\",\\"financeTerminList\\":[{\\"id\\":\\"t_default\\",\\"termin\\":\\"Belum saatnya penagihan\\",\\"nilaiInvoice\\":250000000,\\"pphType\\":\\"1.75\\",\\"pphCustomRate\\":\\"10\\",\\"pphCustomAmount\\":\\"\\",\\"statusPenagihan\\":\\"Retensi\\",\\"penagihanRemarks\\":\\"Belum ada penagihan\\",\\"issue\\":\\"Belum waktunya\\",\\"remark\\":\\"Kontrak disetujui Finance\\"}],\\"financeTermin\\":\\"Belum saatnya penagihan\\",\\"financeNilai\\":250000000,\\"financePpn\\":27500000,\\"financePphType\\":\\"1.75\\",\\"financePphRate\\":\\"10\\",\\"financePph\\":4375000,\\"financeGrandTotal\\":273125000,\\"financeStatusPenagihan\\":\\"Retensi\\",\\"financePenagihanRemarks\\":\\"Belum ada penagihan\\",\\"financeIssue\\":\\"Belum waktunya\\",\\"progressManual\\":\\"34%\\",\\"statusPeninjauan\\":\\"Pending\\",\\"statusPekerjaan\\":\\"Pending\\",\\"remarksKeterangan\\":\\"Proses\\",\\"progress\\":\\"34%\\",\\"flow\\":\\"123\\",\\"tglPenagihan\\":\\"10/7/2026\\",\\"tglDibayar\\":\\"11/7/2026\\",\\"pembayaranPersen\\":\\"70\\",\\"invoice\\":\\"250.000.000\\",\\"tandaTerima\\":\\"ada\\",\\"permintaanPembayaran\\":\\"ada\\",\\"prosedurPenagihan\\":\\"Secepatnya\\",\\"procurementPt\\":\\"MJK\\",\\"procurementClient\\":\\"AFI1\\",\\"procurementNoSpk\\":\\"SPK/MJK/2026\\",\\"procurementModalBoq\\":250000000,\\"procurementPengeluaran\\":\\"110000000\\",\\"financeStatus\\":\\"Berjalan\\"}","startDate":"2026-08-01T00:00:00.000Z","sequence":1,"penawaranPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","penawaranDueDate":"2026-07-02T02:39:00.000Z","boqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","boqDueDate":"2026-07-02T02:39:00.000Z","rfqPicId":"ef5f70b3-dd85-4d3e-b937-0cecad282504","rfqDueDate":"2026-07-04T02:40:00.000Z","spkPicId":"3e122706-df9e-43fd-9abe-1fdbc0eccb03","spkDueDate":null,"progressPicId":"ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8","progressDueDate":null,"invoicePicId":"d6f33bb2-9329-4d2a-b85e-b22bcbea8c07","invoiceDueDate":null}	127.0.0.1	2026-07-30 06:43:20.548
\.


--
-- Data for Name: boq_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.boq_headers (id, document_id, total_amount, created_at, updated_at) FROM stdin;
7376d76c-d724-49a4-ad14-1e4c2c642faa	adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa	0	2026-07-30 02:42:08.202	2026-07-30 02:42:08.211
\.


--
-- Data for Name: boq_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.boq_items (id, boq_header_id, wbs_code, description, quantity, unit, rate_engineering, rate_procurement, total_price, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, sender_id, receiver_id, target_role, message, attachment_url, is_read, created_at) FROM stdin;
aa6d41fc-0894-4256-9dc6-0686195d1ae9	ef5f70b3-dd85-4d3e-b937-0cecad282504	13436f2e-2589-4bf5-ab69-b0dad33ce3da	\N	Oke aman bg	\N	t	2026-07-30 02:42:26.099
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, project_id, file_name, file_type, file_path, file_size, uploaded_by_id, status, created_at, updated_at, sub_folder_name) FROM stdin;
61022667-709c-4a3d-baac-3b6cf8180d4e	a2fee390-5517-4be1-b6a4-349c62e32405	012. PINV.AFI3.TGL.WS456.012.pdf	DRAWING	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\drawing\\012__PINV_AFI3_TGL_WS456_012-1785379237016-379402996.pdf	673895	ef5f70b3-dd85-4d3e-b937-0cecad282504	PENDING	2026-07-30 02:40:37.031	2026-07-30 02:40:37.031	\N
86058c82-aee6-4c84-a47f-41f3648b38d9	a2fee390-5517-4be1-b6a4-349c62e32405	Quo_AFI Penambahan Water Treatment di Gudang B7 (sistem) R5 23062026.pdf	PENAWARAN_DRAFT	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\penawaran_draft\\Quo_AFI_Penambahan_Water_Treatment_di_Gudang_B7__sistem__R5_23062026-1785379261917-704963392.pdf	585150	ef5f70b3-dd85-4d3e-b937-0cecad282504	PENDING	2026-07-30 02:41:01.923	2026-07-30 02:41:01.923	\N
2ad56e7d-1d2b-4a55-9509-86fce8170ee7	a2fee390-5517-4be1-b6a4-349c62e32405	Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.pdf	DRAWING_AS_BUILT	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\drawing_as_built\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379273368-850402260.pdf	1589261	ef5f70b3-dd85-4d3e-b937-0cecad282504	APPROVED	2026-07-30 02:41:13.382	2026-07-30 03:21:21.905	\N
40467674-1c78-48ce-90a8-adba991c01be	a2fee390-5517-4be1-b6a4-349c62e32405	GA PENAMBAHAN FAN BLOWER B9 (B9é¼é£æºæ°å¢) PT.AFI 1 220426.pdf	RAB	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\rab\\GA_PENAMBAHAN_FAN_BLOWER_B9__B9_________________PT_AFI_1_220426-1785379244965-351436158.pdf	8539322	ef5f70b3-dd85-4d3e-b937-0cecad282504	APPROVED	2026-07-30 02:40:45.023	2026-07-30 03:22:09.808	\N
d9fbf9d9-f924-42a5-b982-d210501b6a8f	a2fee390-5517-4be1-b6a4-349c62e32405	R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf	SUBKON_DOCS	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\subkon_docs\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379318294-92251685.pdf	12162652	ef5f70b3-dd85-4d3e-b937-0cecad282504	PO_PENDING	2026-07-30 02:41:58.348	2026-07-30 02:41:58.348	PT.Yunbo
a73c4898-6e42-4bd2-acd8-e6aa4666f4b4	a2fee390-5517-4be1-b6a4-349c62e32405	R4. åè½¦åºåºå£éè·¯å·¥ç¨ (PEKERJAAN JALAN KELUAR DARI PARKIRAN) PT.AFI1 080626.pdf	RFQ_SCAN_KOSONG	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\rfq_scan_kosong\\R4_______________________________PEKERJAAN_JALAN_KELUAR_DARI_PARKIRAN__PT_AFI1_080626-1785379294240-967597914.pdf	12162652	ef5f70b3-dd85-4d3e-b937-0cecad282504	APPROVED	2026-07-30 02:41:34.309	2026-07-30 03:21:38.184	\N
adaba2c6-7e3f-4d4d-8153-fe58ccb88ffa	a2fee390-5517-4be1-b6a4-349c62e32405	Quo_MJK - AFI (GA) Penambahan Fan Blower B9 R3 13.07.26 fix.xlsx	BOQ	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\ef5f70b3-dd85-4d3e-b937-0cecad282504\\boq\\Quo_MJK___AFI__GA__Penambahan_Fan_Blower_B9_R3_13_07_26_fix-1785379327406-211402516.xlsx	1070687	ef5f70b3-dd85-4d3e-b937-0cecad282504	APPROVED	2026-07-30 02:42:07.418	2026-07-30 03:22:06.737	\N
6e08d705-7302-46dc-bf14-ea9adaca1059	a2fee390-5517-4be1-b6a4-349c62e32405	012. PINV.AFI3.TGL.WS456.012.pdf	INVOICE	C:\\PROJECT\\assetmenagemen\\backend\\storage\\uploads\\users\\3e122706-df9e-43fd-9abe-1fdbc0eccb03\\invoice\\012__PINV_AFI3_TGL_WS456_012-1785380936793-285348925.pdf	673895	3e122706-df9e-43fd-9abe-1fdbc0eccb03	APPROVED	2026-07-30 03:08:56.805	2026-07-30 03:21:18.996	\N
\.


--
-- Data for Name: master_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_clients (id, code, name) FROM stdin;
564d3a3a-86e8-4185-bf73-a4b2166c0c72	TSH	PT TAH SUNG HUNG
070f45b2-e650-4f1d-bb9d-23852a666ec9	SHT	PT SHYANG HUNG TAH
c3dc463e-e8d4-4f2e-8c1e-ce462fcb00d6	STJ	PT SHYANG TAH JYUN
92566227-32f5-42be-b2bf-96293c751016	AFI1	PT ADONIA FOOTWEAR INDONESIA
390d6fa7-d11b-4568-ab46-c9379784e229	AFI3	PT AROMA FOOTWEAR INDONESIA
eb75cea8-c6ba-46fb-ae4f-bef622bb33d7	AFI5	PT ARMADA FOOTWEAR INDONESIA
9de14880-4460-4ce9-9699-f8467d469978	MPI	PT METRO PEARL INDONESIA
dd4c8941-faed-4a41-a35b-73ff0c67a20d	SSI	PT SILVER SKYLINE INDONESIA
e47dd0ae-5294-4f6f-851a-385d57ce6758	JYM	PT JIANGYI MOLD TECHNOLOGY INDONESIA
b6299cc3-89ce-4da1-a0c2-eb13cc102821	JWI	PT JIA WEI INDONESIA
da868b05-58c6-472d-9fe2-c00016cf7aa2	ZXI	PT ZHAN XIN INDONESIA
604f3d68-ba22-4ca1-bc89-60873a1daf7f	SBM	PT SAM BOUND MITRA INDONESIA
f64d9b6a-2b89-4d53-879c-12c3009d1584	SFII	PT SHOETOWN FOOTWEAR INDUSTRIAL INDONESIA
cd732e58-3bb4-467d-91e3-d47580c1b95f	XH	PT XING HAI
5d72d61c-1003-4c5b-b6a9-378cee732188	OPA	PT ONE PLUS ABADI
ee754b51-0a02-4dae-8420-cc6c2cec45fe	ISM	PT INTI SUKSES METALINDO
4bcc3b93-2510-4898-95aa-fbe05f2dd5bc	JAS	PT JAYA ABADI STEEL
a408652d-9bc8-4a8f-a92f-82b6e5a0af14	TRK	PT TRICON REKSADAYA KONSTRUKSI
0a1c6ccc-bd61-43b3-b379-e9f7e94c9a90	SFM	PT SINGAPURA FRESHGREEN MAKMUR
cd86e1f4-c4ac-4538-a2d9-27110f3029d4	YYFI	PT YIH YOU FOOTWARE INDONESIA
b6cb767c-8b1f-46bd-8c80-065687552593	KEM	PT KONTRUKSI ERA MaANDIRI
70870e0e-ec60-4e09-af03-a9423375ecd3	CHAOYUE	PT CHAOYUE TEKNIK MEKANIK LISTRIK
9cac58be-4298-4aeb-bc7a-f648074a701a	HYKJ	PT HUA RONG KEJI
db1f2e8a-b463-4e94-923d-be074a11204f	HOKI	PT HOKI
af790509-b7ab-4814-9590-10d64e3ca0be	PATAMA	PT PATAMA ADIJAYA STEEL
a48fbd2e-bbb3-4090-991d-b0c96aae599f	JKT	PT JAYA KARYA TERPADU
\.


--
-- Data for Name: master_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_companies (id, code, name) FROM stdin;
8e5e41bc-cc45-43b7-9261-d6fca6431ded	MJK	PT MODERN JAYA KONSTRUKSI
42afa36e-f9f0-44ce-9c21-f7514ef1afc4	DJI	PT DELTA JAYA INDOTAMA
7bf77773-1801-470a-9903-e5385856bfe2	IRI	PT INOVATIF RENOVALOGI INDONESIA
\.


--
-- Data for Name: master_numberings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_numberings (id, code, name, created_at) FROM stdin;
\.


--
-- Data for Name: master_subkons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_subkons (id, code, name) FROM stdin;
bef24b1c-8d57-428f-a5cd-92adaedcf7c8	MS-001	PT. Karya Subkon Mandiri
82bda9b9-4649-4f81-af51-8aad0ec4b83f	MS-002	CV. Sinar Teknik Subkon
0925d91a-7dc5-4cc1-bb6c-927ddc8cea49	MS-003	PT. Mitra Utama Konstruksi
c8590286-3f4c-426b-9075-8a8cba2b25c1	MS-004	PT. Steelindo Utama
80f470fa-09d6-4a4d-81a1-3ce2cef8ba4b	MS-005	CV. Medan Design Interior
2a4a809b-f97d-4590-a5dc-15c782d8d01c	MS-006	PT. Ready Mix Tangerang
2e78710d-2a25-4e45-9be5-db7130bece93	MS-007	PT. Environment Care
89e75e9a-b240-40de-b9bb-035463cdd15b	MS-008	PT. Cikarang Subkon Mandiri
67a3fd14-e958-4faa-a63f-851ef07374b1	MS-009	CV. Indo Plafon Gypsum
095ae0de-5c25-4cf1-8cc2-8e927703c298	MS-010	PT. Aspal Jaya Bandung
\.


--
-- Data for Name: penawaran_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penawaran_headers (id, document_id, vendor_name, quote_number, total_offer, validity_date, created_at) FROM stdin;
\.


--
-- Data for Name: penawaran_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penawaran_items (id, penawaran_header_id, item_no, description, quantity, unit, unit_price, total_price, notes) FROM stdin;
\.


--
-- Data for Name: project_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_jobs (id, project_id, uraian_pekerjaan, rfq_date, progress, subkon1_nama, subkon1_status, subkon2_nama, subkon2_status, subkon3_nama, subkon3_status, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: project_subkon_termins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_subkon_termins (id, project_subkon_id, nilai_jasa, pembayaran_persen, prosedur_penagihan, auto_rfq, auto_boq, auto_spk, auto_foto_progress, bapp, laporan_progress, surat_jalan, ceklist, bast_bas_t2, proforma_invoice, tanda_terima_tukar_faktur, invoice, kwitansi, tanggal_pengajuan, tanggal_dibayar, created_at, updated_at, npwp, spfkp_ktp) FROM stdin;
\.


--
-- Data for Name: project_subkons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_subkons (id, project_id, master_subkon_id, nama_pekerjaan, kategori, nilai_kontrak, created_at, updated_at, type) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, created_at, code, end_date, progress, remarks, start_date, sequence, boq_due_date, boq_pic_id, invoice_due_date, invoice_pic_id, penawaran_due_date, penawaran_pic_id, progress_due_date, progress_pic_id, rfq_due_date, rfq_pic_id, spk_due_date, spk_pic_id) FROM stdin;
37be48b3-267b-4eb1-a741-169bdc057691	Wc		2026-07-30 02:37:16.206	002 - MJK - AFI5	\N	0		\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	14540629-96da-446b-8151-4209570eb5a4
a2fee390-5517-4be1-b6a4-349c62e32405	Pembuatan jalan	{"reqBy":"Siswanto","reqDate":"2026-07-01"}	2026-07-30 02:36:29.101	001 - MJK - AFI1	2026-12-31 00:00:00	0	{"nilaiKontrak":250000000,"financeRemark":"Kontrak disetujui Finance","financeTerminList":[{"id":"t_default","termin":"Belum saatnya penagihan","nilaiInvoice":250000000,"pphType":"1.75","pphCustomRate":"10","pphCustomAmount":"","statusPenagihan":"Retensi","penagihanRemarks":"Belum ada penagihan","issue":"Belum waktunya","remark":"Kontrak disetujui Finance"}],"financeTermin":"Belum saatnya penagihan","financeNilai":250000000,"financePpn":27500000,"financePphType":"1.75","financePphRate":"10","financePph":4375000,"financeGrandTotal":273125000,"financeStatusPenagihan":"Retensi","financePenagihanRemarks":"Belum ada penagihan","financeIssue":"Belum waktunya","progressManual":"34%","statusPeninjauan":"Pending","statusPekerjaan":"Pending","remarksKeterangan":"Proses","progress":"34%","flow":"123","tglPenagihan":"10/7/2026","tglDibayar":"11/7/2026","pembayaranPersen":"70","invoice":"250.000.000","tandaTerima":"ada","permintaanPembayaran":"ada","prosedurPenagihan":"Secepatnya","procurementPt":"MJK","procurementClient":"AFI1","procurementNoSpk":"SPK/MJK/2026","procurementModalBoq":250000000,"procurementPengeluaran":"110000000","financeStatus":"Berjalan"}	2026-08-01 00:00:00	1	2026-07-02 02:39:00	ef5f70b3-dd85-4d3e-b937-0cecad282504	\N	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	2026-07-02 02:39:00	ef5f70b3-dd85-4d3e-b937-0cecad282504	\N	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	2026-07-04 02:40:00	ef5f70b3-dd85-4d3e-b937-0cecad282504	\N	3e122706-df9e-43fd-9abe-1fdbc0eccb03
9151cc70-c9a4-4342-ba8f-cc45f91c1b77	Pohon cemara		2026-07-30 02:37:28.262	003 - MJK - AFI3	\N	0		\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3e122706-df9e-43fd-9abe-1fdbc0eccb03
\.


--
-- Data for Name: rfq_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfq_headers (id, document_id, rfq_number, target_date, terms, created_at) FROM stdin;
\.


--
-- Data for Name: rfq_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfq_items (id, rfq_header_id, item_no, description, quantity, unit, specifications, notes) FROM stdin;
\.


--
-- Data for Name: user_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_folders (id, user_id, folder_path, created_at) FROM stdin;
1ba23c66-4fe3-4c79-bda1-f668106c1efc	13436f2e-2589-4bf5-ab69-b0dad33ce3da	storage/uploads/users/13436f2e-2589-4bf5-ab69-b0dad33ce3da	2026-07-30 02:19:14.247
0c96f86d-811b-4b69-bfcf-7478a216e454	14540629-96da-446b-8151-4209570eb5a4	storage/uploads/users/14540629-96da-446b-8151-4209570eb5a4	2026-07-30 02:19:14.254
c5dad26e-8372-4e28-af0d-2859d7cc5a63	ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	storage/uploads/users/ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	2026-07-30 02:19:14.258
a97e0d70-4bbb-4c7c-b631-e131f6770add	d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	storage/uploads/users/d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	2026-07-30 02:19:14.262
7799a7a6-2413-400b-8914-4353d424472a	7a0d6ed0-f90b-451d-a26f-08ff10480abe	storage/uploads/users/7a0d6ed0-f90b-451d-a26f-08ff10480abe	2026-07-30 02:19:14.266
126f3570-0f16-4d61-8aa7-fa6bcf55b0bc	7f7d8801-50c9-4b7c-abab-98723ee3b0e8	storage/uploads/users/7f7d8801-50c9-4b7c-abab-98723ee3b0e8	2026-07-30 02:19:14.272
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, created_at, updated_at, address, photo_url, manager_id) FROM stdin;
14540629-96da-446b-8151-4209570eb5a4	Siti (Proyek Admin)	proyekadmin@project.com	$2a$10$6piXpI6.IaubDYUhqv66guvlmhttxxp/hiiadwf.PkXU5HUaeqvxC	PROYEK_ADMIN	2026-07-30 02:19:14.253	2026-07-30 02:19:14.253	\N	\N	\N
ad65a30b-8d8d-4ca6-bb5b-3b050df02ae8	Agus (Procurement)	procurement@project.com	$2a$10$6piXpI6.IaubDYUhqv66gu0Nowkg1a1oTo.lcOxS.fjMjkqJ85Fae	PROCUREMENT	2026-07-30 02:19:14.256	2026-07-30 02:19:14.256	\N	\N	\N
d6f33bb2-9329-4d2a-b85e-b22bcbea8c07	Dewi (Finance)	finance@project.com	$2a$10$6piXpI6.IaubDYUhqv66gu119dvnKB63LprH6EKIJJI1eb7T3bo56	FINANCE	2026-07-30 02:19:14.26	2026-07-30 02:19:14.26	\N	\N	\N
7a0d6ed0-f90b-451d-a26f-08ff10480abe	Rudi (Monitoring)	adminmon@project.com	$2a$10$6piXpI6.IaubDYUhqv66guSNkGKnrHZImmbkGksN5e5N0BrLZfcCm	ADMIN_MONITORING	2026-07-30 02:19:14.264	2026-07-30 02:19:14.264	\N	\N	\N
7f7d8801-50c9-4b7c-abab-98723ee3b0e8	Super Administrator	superadmin@project.com	$2a$10$6piXpI6.IaubDYUhqv66gumSH.KPcN/77BMGAlfefydKWxArzJ.7S	SUPERADMIN	2026-07-30 02:19:14.268	2026-07-30 02:19:14.268	\N	\N	\N
13436f2e-2589-4bf5-ab69-b0dad33ce3da	Budi (Engineering)	engineering@project.com	$2a$10$XNgBKPQieZH.95Z20oQI7.q18kJnX19k6Dmt8TU.AJLRrdVRgX1Bi	ENGINEERING	2026-07-30 02:19:14.229	2026-07-30 02:35:16.289	\N	\N	\N
3e122706-df9e-43fd-9abe-1fdbc0eccb03	glori	glori@project.com	$2a$10$KG5etXBtE9WWLIDorcR0cuj.WKDRE.HnzCQ62qk1OvGPZycGEFDqq	PROYEK_ADMIN	2026-07-30 02:38:30.684	2026-07-30 02:38:30.684	\N	\N	14540629-96da-446b-8151-4209570eb5a4
ef5f70b3-dd85-4d3e-b937-0cecad282504	Jek	Jek@project.com	$2a$10$BcPigUUReO9E2Qh6PIVIseLDh7vBAxIlJ5G6iZuFxu5yct42DAXFu	ENGINEERING	2026-07-30 02:39:23.735	2026-07-30 02:39:23.735	\N	\N	13436f2e-2589-4bf5-ab69-b0dad33ce3da
\.


--
-- Data for Name: work_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_reports (id, user_id, date, title, description, created_at, updated_at, attachment_url) FROM stdin;
\.


--
-- Name: projects_sequence_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_sequence_seq', 190, true);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: boq_headers boq_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boq_headers
    ADD CONSTRAINT boq_headers_pkey PRIMARY KEY (id);


--
-- Name: boq_items boq_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boq_items
    ADD CONSTRAINT boq_items_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: master_clients master_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_clients
    ADD CONSTRAINT master_clients_pkey PRIMARY KEY (id);


--
-- Name: master_companies master_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_companies
    ADD CONSTRAINT master_companies_pkey PRIMARY KEY (id);


--
-- Name: master_numberings master_numberings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_numberings
    ADD CONSTRAINT master_numberings_pkey PRIMARY KEY (id);


--
-- Name: master_subkons master_subkons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_subkons
    ADD CONSTRAINT master_subkons_pkey PRIMARY KEY (id);


--
-- Name: penawaran_headers penawaran_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penawaran_headers
    ADD CONSTRAINT penawaran_headers_pkey PRIMARY KEY (id);


--
-- Name: penawaran_items penawaran_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penawaran_items
    ADD CONSTRAINT penawaran_items_pkey PRIMARY KEY (id);


--
-- Name: project_jobs project_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_jobs
    ADD CONSTRAINT project_jobs_pkey PRIMARY KEY (id);


--
-- Name: project_subkon_termins project_subkon_termins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_subkon_termins
    ADD CONSTRAINT project_subkon_termins_pkey PRIMARY KEY (id);


--
-- Name: project_subkons project_subkons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_subkons
    ADD CONSTRAINT project_subkons_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: rfq_headers rfq_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_headers
    ADD CONSTRAINT rfq_headers_pkey PRIMARY KEY (id);


--
-- Name: rfq_items rfq_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_items
    ADD CONSTRAINT rfq_items_pkey PRIMARY KEY (id);


--
-- Name: user_folders user_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_folders
    ADD CONSTRAINT user_folders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_reports work_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT work_reports_pkey PRIMARY KEY (id);


--
-- Name: master_clients_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX master_clients_code_key ON public.master_clients USING btree (code);


--
-- Name: master_companies_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX master_companies_code_key ON public.master_companies USING btree (code);


--
-- Name: master_numberings_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX master_numberings_code_key ON public.master_numberings USING btree (code);


--
-- Name: master_subkons_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX master_subkons_code_key ON public.master_subkons USING btree (code);


--
-- Name: rfq_headers_rfq_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX rfq_headers_rfq_number_key ON public.rfq_headers USING btree (rfq_number);


--
-- Name: user_folders_folder_path_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_folders_folder_path_key ON public.user_folders USING btree (folder_path);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: attendances attendances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: boq_headers boq_headers_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boq_headers
    ADD CONSTRAINT boq_headers_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boq_items boq_items_boq_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.boq_items
    ADD CONSTRAINT boq_items_boq_header_id_fkey FOREIGN KEY (boq_header_id) REFERENCES public.boq_headers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: penawaran_headers penawaran_headers_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penawaran_headers
    ADD CONSTRAINT penawaran_headers_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penawaran_items penawaran_items_penawaran_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penawaran_items
    ADD CONSTRAINT penawaran_items_penawaran_header_id_fkey FOREIGN KEY (penawaran_header_id) REFERENCES public.penawaran_headers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_jobs project_jobs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_jobs
    ADD CONSTRAINT project_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_subkon_termins project_subkon_termins_project_subkon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_subkon_termins
    ADD CONSTRAINT project_subkon_termins_project_subkon_id_fkey FOREIGN KEY (project_subkon_id) REFERENCES public.project_subkons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_subkons project_subkons_master_subkon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_subkons
    ADD CONSTRAINT project_subkons_master_subkon_id_fkey FOREIGN KEY (master_subkon_id) REFERENCES public.master_subkons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: project_subkons project_subkons_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_subkons
    ADD CONSTRAINT project_subkons_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rfq_headers rfq_headers_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_headers
    ADD CONSTRAINT rfq_headers_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rfq_items rfq_items_rfq_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfq_items
    ADD CONSTRAINT rfq_items_rfq_header_id_fkey FOREIGN KEY (rfq_header_id) REFERENCES public.rfq_headers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_folders user_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_folders
    ADD CONSTRAINT user_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_reports work_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_reports
    ADD CONSTRAINT work_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict wplmXnCChq1rsb6SHuSsVcH87jxah1GKr9uO9Y5NKUsBly7VKeJM39GnacXp7gV

