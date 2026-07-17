const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const IdentityDocument = require('./IdentityDocument');
const ProfessionalProfile = require('./ProfessionalProfile');
const ProfessionalVerification = require('./ProfessionalVerification');
const Vehicle = require('./Vehicle');
const BeneficiaryLink = require('./BeneficiaryLink');
const MedicalRecord = require('./MedicalRecord');
const Service = require('./Service');
const Plan = require('./Plan');
const Subscription = require('./Subscription');
const MedicalRequest = require('./MedicalRequest');
const Assignment = require('./Assignment');
const MedicalCase = require('./MedicalCase');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Attachment = require('./Attachment');
const Payment = require('./Payment');
const QrConfirmation = require('./QrConfirmation');
const AgentLocation = require('./AgentLocation');
const Dependent = require('./Dependent');
const RequestMessage = require('./RequestMessage');
const Appointment = require('./Appointment');
const Recommendation = require('./Recommendation');
const Sinistre = require('./Sinistre');
const Notification = require('./Notification');
const Pays = require('./Pays');
const Departement = require('./Departement');
const Arrondissement = require('./Arrondissement');

const ROLES_PAR_DEFAUT = ['PATIENT', 'ADMIN', 'MEDECIN', 'AGENT_PROXIMITE', 'LIVREUR'];

const initialiserRoles = async () => {
  for (const nom of ROLES_PAR_DEFAUT) {
    await Role.findOrCreate({ where: { name: nom } });
  }
  console.log('✓ Rôles initialisés');
};

User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

User.hasMany(IdentityDocument, { foreignKey: 'user_id' });
IdentityDocument.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ProfessionalProfile, { foreignKey: 'user_id' });
ProfessionalProfile.belongsTo(User, { foreignKey: 'user_id' });

ProfessionalProfile.hasMany(ProfessionalVerification, { foreignKey: 'professional_profile_id' });
ProfessionalVerification.belongsTo(ProfessionalProfile, { foreignKey: 'professional_profile_id' });

User.hasMany(Vehicle, { foreignKey: 'user_id' });
Vehicle.belongsTo(User, { foreignKey: 'user_id' });

ProfessionalProfile.hasMany(Vehicle, { foreignKey: 'professional_profile_id' });
Vehicle.belongsTo(ProfessionalProfile, { foreignKey: 'professional_profile_id' });

User.hasMany(BeneficiaryLink, { foreignKey: 'responsible_user_id', as: 'ResponsibleLinks' });
User.hasMany(BeneficiaryLink, { foreignKey: 'beneficiary_user_id', as: 'BeneficiaryLinks' });
BeneficiaryLink.belongsTo(User, { foreignKey: 'responsible_user_id', as: 'ResponsibleUser' });
BeneficiaryLink.belongsTo(User, { foreignKey: 'beneficiary_user_id', as: 'BeneficiaryUser' });

User.hasOne(MedicalRecord, { foreignKey: 'user_id' });
MedicalRecord.belongsTo(User, { foreignKey: 'user_id' });
Dependent.hasOne(MedicalRecord, { foreignKey: 'dependent_id', as: 'medicalRecord' });
MedicalRecord.belongsTo(Dependent, { foreignKey: 'dependent_id' });

Service.hasMany(MedicalRequest, { foreignKey: 'service_id' });
MedicalRequest.belongsTo(Service, { foreignKey: 'service_id' });

Plan.hasMany(Subscription, { foreignKey: 'plan_id' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id' });

User.hasMany(Subscription, { foreignKey: 'user_id' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });
Subscription.belongsTo(Dependent, { foreignKey: 'dependent_id' });
Dependent.hasMany(Subscription, { foreignKey: 'dependent_id' });

User.hasMany(MedicalRequest, { foreignKey: 'created_by', as: 'CreatedRequests' });
User.hasMany(MedicalRequest, { foreignKey: 'beneficiary_id', as: 'BeneficiaryRequests' });
MedicalRequest.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });
MedicalRequest.belongsTo(User, { foreignKey: 'beneficiary_id', as: 'Beneficiary' });
MedicalRequest.belongsTo(Dependent, { foreignKey: 'dependent_id', as: 'BeneficiaryDependent' });
MedicalRequest.belongsTo(User, { foreignKey: 'medecin_id', as: 'Medecin' });

MedicalRequest.hasMany(Assignment, { foreignKey: 'request_id' });
Assignment.belongsTo(MedicalRequest, { foreignKey: 'request_id' });

User.hasMany(Assignment, { foreignKey: 'agent_id' });
Assignment.belongsTo(User, { foreignKey: 'agent_id', as: 'Agent' });

MedicalRequest.hasOne(MedicalCase, { foreignKey: 'request_id' });
MedicalCase.belongsTo(MedicalRequest, { foreignKey: 'request_id' });

User.hasMany(MedicalCase, { foreignKey: 'doctor_id', as: 'DoctorCases' });
MedicalCase.belongsTo(User, { foreignKey: 'doctor_id', as: 'Doctor' });

MedicalCase.hasMany(Prescription, { foreignKey: 'medical_case_id' });
Prescription.belongsTo(MedicalCase, { foreignKey: 'medical_case_id' });

Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id' });

User.hasMany(Payment, { foreignKey: 'payer_id', as: 'PaymentsMade' });
User.hasMany(Payment, { foreignKey: 'beneficiary_id', as: 'PaymentsReceived' });
Payment.belongsTo(User, { foreignKey: 'payer_id', as: 'Payer' });
Payment.belongsTo(User, { foreignKey: 'beneficiary_id', as: 'Beneficiary' });
Payment.belongsTo(MedicalRequest, { foreignKey: 'request_id' });
Payment.belongsTo(Subscription, { foreignKey: 'subscription_id' });

MedicalRequest.hasMany(QrConfirmation, { foreignKey: 'request_id' });
QrConfirmation.belongsTo(MedicalRequest, { foreignKey: 'request_id' });
User.hasMany(QrConfirmation, { foreignKey: 'patient_id', as: 'PatientConfirmations' });
User.hasMany(QrConfirmation, { foreignKey: 'agent_id', as: 'AgentConfirmations' });
QrConfirmation.belongsTo(User, { foreignKey: 'patient_id', as: 'Patient' });
QrConfirmation.belongsTo(User, { foreignKey: 'agent_id', as: 'Agent' });

User.hasMany(AgentLocation, { foreignKey: 'agent_id' });
AgentLocation.belongsTo(User, { foreignKey: 'agent_id', as: 'Agent' });

User.hasMany(Dependent, { foreignKey: 'user_id' });
Dependent.belongsTo(User, { foreignKey: 'user_id' });

MedicalRequest.hasMany(RequestMessage, { foreignKey: 'request_id' });
RequestMessage.belongsTo(MedicalRequest, { foreignKey: 'request_id' });
User.hasMany(RequestMessage, { foreignKey: 'sender_id', as: 'SentMessages' });
RequestMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });

MedicalRequest.hasMany(Payment, { foreignKey: 'request_id' });

MedicalRequest.hasMany(Appointment, { foreignKey: 'request_id' });
Appointment.belongsTo(MedicalRequest, { foreignKey: 'request_id' });
User.hasMany(Appointment, { foreignKey: 'created_by', as: 'CreatedAppointments' });
Appointment.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

MedicalRequest.hasMany(Recommendation, { foreignKey: 'request_id' });
Recommendation.belongsTo(MedicalRequest, { foreignKey: 'request_id' });
User.hasMany(Recommendation, { foreignKey: 'created_by', as: 'CreatedRecommendations' });
Recommendation.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

Recommendation.hasMany(Attachment, { foreignKey: 'entity_id', constraints: false, scope: { entity_type: 'RECOMMENDATION' }, as: 'attachments' });

User.hasMany(Sinistre, { foreignKey: 'user_id' });
Sinistre.belongsTo(User, { foreignKey: 'user_id' });
Vehicle.hasMany(Sinistre, { foreignKey: 'vehicle_id' });
Sinistre.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// Location associations
Pays.hasMany(Departement, { foreignKey: 'pays_id' });
Departement.belongsTo(Pays, { foreignKey: 'pays_id' });

Departement.hasMany(Arrondissement, { foreignKey: 'departement_id' });
Arrondissement.belongsTo(Departement, { foreignKey: 'departement_id' });

User.belongsTo(Departement, { foreignKey: 'departement_id', as: 'departementRef' });
User.belongsTo(Arrondissement, { foreignKey: 'arrondissement_id', as: 'arrondissementRef' });

const db = {
  sequelize, User, Role, UserRole, IdentityDocument, ProfessionalProfile,
  ProfessionalVerification, Vehicle, BeneficiaryLink, MedicalRecord,
  Service, Plan, Subscription, MedicalRequest, Assignment, MedicalCase,
  Prescription, PrescriptionItem, Attachment, Payment, QrConfirmation, AgentLocation, Dependent, RequestMessage,
  Appointment, Recommendation, Sinistre, Notification,
  Pays, Departement, Arrondissement,
  initialiserRoles,
};

module.exports = db;
