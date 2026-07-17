
-- MEDCONNECT - SQL Schema (Version simplifiée et extensible)

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dossier_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NULL,
    password VARCHAR(255) NULL,
    photo_profile VARCHAR(255) NULL,
    birth_date DATE,
    gender VARCHAR(20),
    verification_level ENUM('UNVERIFIED','IDENTITY_VERIFIED','PROFESSION_VERIFIED') DEFAULT 'UNVERIFIED',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE
);

CREATE TABLE user_roles (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY(user_id, role_id)
);

CREATE TABLE identity_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(50),
    document_number VARCHAR(100) UNIQUE,
    front_file VARCHAR(255),
    back_file VARCHAR(255),
    selfie_file VARCHAR(255),
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING'
);

CREATE TABLE professional_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    profession_type VARCHAR(100),
    organization_name VARCHAR(255),
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING'
);

CREATE TABLE professional_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    professional_profile_id BIGINT NOT NULL,
    document_file VARCHAR(255),
    reference_number VARCHAR(100),
    status ENUM('PENDING','APPROVED','REJECTED','EXPIRED') DEFAULT 'PENDING',
    rejection_reason TEXT NULL
);

CREATE TABLE vehicles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    professional_profile_id BIGINT,
    vehicle_type VARCHAR(50),
    registration_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100)
);

CREATE TABLE beneficiary_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    responsible_user_id BIGINT NOT NULL,
    beneficiary_user_id BIGINT NOT NULL,
    relationship_type VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE medical_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE NOT NULL,
    privacy_level ENUM('PRIVATE','SHARED_MEDCONNECT','PUBLIC') DEFAULT 'SHARED_MEDCONNECT',
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_history TEXT
);

CREATE TABLE services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    price DECIMAL(12,2),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150),
    monthly_price DECIMAL(12,2),
    annual_price DECIMAL(12,2)
);

CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('ACTIVE','EXPIRED','SUSPENDED')
);

CREATE TABLE medical_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(50) UNIQUE,
    created_by BIGINT NOT NULL,
    beneficiary_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    incident_type VARCHAR(100),
    reason VARCHAR(255),
    description TEXT,
    address TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    status ENUM('SUBMITTED','APPROVED','REJECTED','ASSIGNED','ON_ROUTE','IN_PROGRESS','COMPLETED','CANCELLED')
);

CREATE TABLE assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NULL
);

CREATE TABLE medical_cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT UNIQUE,
    doctor_id BIGINT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    observations TEXT
);

CREATE TABLE prescriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    medical_case_id BIGINT NOT NULL
);

CREATE TABLE prescription_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    prescription_id BIGINT NOT NULL,
    medication_name VARCHAR(255),
    dosage VARCHAR(255),
    duration VARCHAR(255)
);

CREATE TABLE attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    file_path VARCHAR(255)
);

CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payer_id BIGINT,
    beneficiary_id BIGINT,
    request_id BIGINT NULL,
    subscription_id BIGINT NULL,
    payment_type ENUM('REGISTRATION','SUBSCRIPTION','SERVICE'),
    method ENUM('MOBILE_MONEY','CARD','CASH'),
    amount DECIMAL(12,2),
    status ENUM('PENDING','CONFIRMED','FAILED')
);

CREATE TABLE qr_confirmations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    confirmation_type ENUM('QR_SCAN','BUTTON_CONFIRM'),
    confirmed_by_patient BOOLEAN DEFAULT FALSE,
    confirmed_by_agent BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP NULL
);

CREATE TABLE agent_locations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_id BIGINT NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    recorded_at TIMESTAMP NULL
);
