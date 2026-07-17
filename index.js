require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const http = require('http');
const path = require('path');
const db = require('./src/models');
const { initSocket } = require('./src/socket');

const authRoutes = require('./src/routes/auth');
const identityRoutes = require('./src/routes/identity');
const professionalRoutes = require('./src/routes/professional');
const professionalVerificationRoutes = require('./src/routes/professionalVerification');
const vehicleRoutes = require('./src/routes/vehicle');
const beneficiaryLinkRoutes = require('./src/routes/beneficiaryLink');
const medicalRecordRoutes = require('./src/routes/medicalRecord');
const serviceRoutes = require('./src/routes/service');
const planRoutes = require('./src/routes/plan');
const subscriptionRoutes = require('./src/routes/subscription');
const medicalRequestRoutes = require('./src/routes/medicalRequest');
const assignmentRoutes = require('./src/routes/assignment');
const medicalCaseRoutes = require('./src/routes/medicalCase');
const prescriptionRoutes = require('./src/routes/prescription');
const attachmentRoutes = require('./src/routes/attachment');
const paymentRoutes = require('./src/routes/payment');
const qrConfirmationRoutes = require('./src/routes/qrConfirmation');
const agentLocationRoutes = require('./src/routes/agentLocation');
const userRoutes = require('./src/routes/user');
const roleRoutes = require('./src/routes/role');
const dependentRoutes = require('./src/routes/dependent');
const appointmentRoutes = require('./src/routes/appointment');
const recommendationRoutes = require('./src/routes/recommendation');
const onboardingRoutes = require('./src/routes/onboarding');
const dashboardRoutes = require('./src/routes/dashboard');
const sinistreRoutes = require('./src/routes/sinistre');
const notificationRoutes = require('./src/routes/notifications');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
const PORT = process.env.PORT || 5000;

const fs = require('fs');
['uploads', 'uploads/profils', 'uploads/documents', 'uploads/vehicules'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const cors = require('cors');
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/professional', professionalRoutes);
app.use('/api/professional-verifications', professionalVerificationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/beneficiary-links', beneficiaryLinkRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/medical-requests', medicalRequestRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/medical-cases', medicalCaseRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr-confirmations', qrConfirmationRoutes);
app.use('/api/agent-locations', agentLocationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dependents', dependentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sinistres', sinistreRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/geo', require('./src/routes/geo'));

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur Medconnect API by curtis fila' });
});

const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Serveur démarré sur ${PORT}`);
});

const demarrer = async (retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Tentative de connexion à la base de données (${attempt}/${retries})...`);
      await db.sequelize.authenticate();
      console.log('✓ Connexion à la base de données établie');
      break;
    } catch (err) {
      console.error(`Échec connexion DB (tentative ${attempt}):`, err.message);
      if (attempt < retries) {
        const delay = attempt * 5000;
        console.log(`Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('Toutes les tentatives de connexion DB ont échoué. Le serveur continue sans base de données.');
        return;
      }
    }
  }

  try {
    try {
      await db.sequelize.sync();
      console.log('✓ Base de données synchronisée');
    } catch (syncErr) {
      console.error('⚠ sync() a échoué:', syncErr.message);
      console.error('→ Si la DB a déjà des tables, vide-la d\'abord puis relance.');
      console.error('→ Ou utilise: sequelize.sync({ force: true }) pour recréer.');
    }

    await db.initialiserRoles();
    console.log('✓ Rôles initialisés');

    await require('./src/seeders/seed-admin')();
    await require('./src/seeders/seed-geo')();

    const startAppointmentScheduler = require('./src/scheduler');
    startAppointmentScheduler();
    console.log('✓ Scheduler démarré');
  } catch (err) {
    console.error('Erreur de démarrage:', err.message);
    console.error(err.stack);
  }
};

demarrer();
