const cron = require('node-cron');
const Appointment = require('./models/Appointment');
const { Op } = require('sequelize');

const startAppointmentScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const updated = await Appointment.update(
        { status: 'COMPLETED' },
        {
          where: {
            date: { [Op.lt]: now },
            status: { [Op.in]: ['SCHEDULED', 'CONFIRMED'] },
          },
        }
      );

      if (updated[0] > 0) {
        console.log(`[Scheduler] ${updated[0]} rendez-vous marqués comme terminés.`);
      }
    } catch (err) {
      console.error('[Scheduler] Erreur:', err.message);
    }
  });

  console.log('[Scheduler] Appointment auto-completion démarré (toutes les minutes).');
};

module.exports = startAppointmentScheduler;
