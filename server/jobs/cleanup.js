const cron = require('node-cron');
const { cleanupExpired } = require('../services/events');

function startCleanupJob() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    try {
      const deleted = cleanupExpired();
      if (deleted > 0) {
        console.log(`[cleanup] Removed ${deleted} expired event(s)`);
      }
    } catch (err) {
      console.error('[cleanup] Error during cleanup:', err);
    }
  });

  console.log('[cleanup] Daily cleanup job scheduled (2:00 AM)');
}

module.exports = { startCleanupJob };
