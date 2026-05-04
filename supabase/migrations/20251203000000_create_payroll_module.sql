-- Create Payroll Module Tables

-- 1. Reference Table: Barème ITS
CREATE TABLE IF NOT EXISTS ref_bareme_its (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID DEFAULT NULL, -- Global if null, or specific to tenant
    montant_min DECIMAL(12, 2) NOT NULL,
    montant_max DECIMAL(12, 2) NOT NULL,
    montant_impot DECIMAL(12, 2) NOT NULL,
    ecart DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ref_bareme_its ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON ref_bareme_its
    FOR SELECT TO authenticated USING (true);

-- Policy: Allow write for authenticated users (assuming HR/Admin)
CREATE POLICY "Allow write access for authenticated users" ON ref_bareme_its
    FOR ALL TO authenticated USING (true);


-- 2. Employees Table (Specific for Payroll)
CREATE TABLE IF NOT EXISTS paie_employes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true)::uuid),
    nom_complet VARCHAR(255) NOT NULL,
    fonction VARCHAR(255),
    salaire_base DECIMAL(12, 2) NOT NULL DEFAULT 0,
    prime_fonction_fixe DECIMAL(12, 2) DEFAULT 0,
    prime_responsabilite_fixe DECIMAL(12, 2) DEFAULT 0,
    prime_transport_fixe DECIMAL(12, 2) DEFAULT 0,
    prime_logement_fixe DECIMAL(12, 2) DEFAULT 0,
    retenue_waqf_fixe DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE paie_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy for paie_employes" ON paie_employes
    FOR ALL TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));


-- 3. Payroll Periods
CREATE TABLE IF NOT EXISTS paie_periodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true)::uuid),
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    annee INT NOT NULL,
    est_cloture BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, mois, annee)
);

ALTER TABLE paie_periodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy for paie_periodes" ON paie_periodes
    FOR ALL TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));


-- 4. Variable Elements (Monthly)
CREATE TABLE IF NOT EXISTS paie_elements_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true)::uuid),
    periode_id UUID NOT NULL REFERENCES paie_periodes(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES paie_employes(id) ON DELETE CASCADE,
    prime_specifique DECIMAL(12, 2) DEFAULT 0,
    prime_forfaitaire DECIMAL(12, 2) DEFAULT 0,
    retenue_absences DECIMAL(12, 2) DEFAULT 0,
    retenue_avance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(periode_id, employe_id)
);

ALTER TABLE paie_elements_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy for paie_elements_variables" ON paie_elements_variables
    FOR ALL TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));


-- 5. Bulletins (Historical/Calculated Data)
CREATE TABLE IF NOT EXISTS paie_bulletins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true)::uuid),
    periode_id UUID NOT NULL REFERENCES paie_periodes(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES paie_employes(id) ON DELETE CASCADE,
    
    -- Snapshot of values used for calculation
    salaire_base DECIMAL(12, 2) NOT NULL,
    prime_fonction DECIMAL(12, 2) DEFAULT 0,
    prime_responsabilite DECIMAL(12, 2) DEFAULT 0,
    prime_specifique DECIMAL(12, 2) DEFAULT 0,
    prime_forfaitaire DECIMAL(12, 2) DEFAULT 0,
    prime_transport DECIMAL(12, 2) DEFAULT 0,
    prime_logement DECIMAL(12, 2) DEFAULT 0,
    
    -- Calculated values
    total_primes_imposables DECIMAL(12, 2) DEFAULT 0,
    total_retenues_absences DECIMAL(12, 2) DEFAULT 0,
    salaire_brut DECIMAL(12, 2) NOT NULL,
    
    cnss_salariale DECIMAL(12, 2) NOT NULL,
    cnss_patronale DECIMAL(12, 2) NOT NULL,
    
    salaire_imposable DECIMAL(12, 2) NOT NULL,
    montant_its DECIMAL(12, 2) NOT NULL,
    
    retenue_waqf DECIMAL(12, 2) DEFAULT 0,
    retenue_avance DECIMAL(12, 2) DEFAULT 0,
    
    salaire_net DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(periode_id, employe_id)
);

ALTER TABLE paie_bulletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy for paie_bulletins" ON paie_bulletins
    FOR ALL TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid));


-- Initial Data Injection for Barème ITS
INSERT INTO ref_bareme_its (montant_min, montant_max, montant_impot, ecart) VALUES
(50000, 54999, 3650, 750),
(55000, 59999, 4400, 750),
(60000, 64999, 5150, 750),
(65000, 69999, 5900, 750),
(70000, 74999, 6650, 750),
(75000, 79999, 7400, 750),
(80000, 84999, 8150, 750),
(85000, 89999, 8900, 750),
(90000, 94999, 9650, 750),
(95000, 99999, 10400, 750),
(100000, 104999, 11150, 750),
(105000, 109999, 11900, 750),
(110000, 114999, 12650, 750),
(115000, 119999, 13400, 750),
(120000, 124999, 14150, 750),
(125000, 129999, 14900, 750),
(130000, 134999, 15650, 750),
(135000, 139999, 16400, 750),
(140000, 144999, 17150, 750),
(145000, 149999, 17900, 1100),
(150000, 154999, 19000, 1100),
(155000, 159999, 20100, 1100),
(160000, 164999, 21200, 1100),
(165000, 169999, 22300, 1100),
(170000, 174999, 23400, 1100),
(175000, 179999, 24500, 1100),
(180000, 184999, 25600, 1100),
(185000, 189999, 26700, 1100),
(190000, 194999, 27800, 1100),
(195000, 199999, 28900, 1100),
(200000, 204999, 30000, 1100),
(205000, 209999, 31100, 1100),
(210000, 214999, 32200, 1100),
(215000, 219999, 33300, 1100),
(220000, 224999, 34400, 1100),
(225000, 229999, 35500, 1100),
(230000, 234999, 36600, 1100),
(235000, 239999, 37700, 1100),
(240000, 244999, 38800, 1100),
(245000, 249999, 39900, 1100),
(250000, 254999, 41000, 1100),
(255000, 259999, 42100, 1100),
(260000, 264999, 43200, 1100),
(265000, 269999, 44300, 1100),
(270000, 274999, 45400, 1100),
(275000, 279999, 46500, 1100),
(280000, 284999, 47600, 1100),
(285000, 289999, 48700, 1100),
(290000, 294999, 49800, 1100),
(295000, 299999, 50900, 1250),
(300000, 304999, 52150, 1250),
(305000, 309999, 53400, 1250),
(310000, 314999, 54650, 1250),
(315000, 319999, 55900, 1250),
(320000, 324999, 57150, 1250),
(325000, 329999, 58400, 1250),
(330000, 334999, 59650, 1250),
(335000, 339999, 60900, 1250);
