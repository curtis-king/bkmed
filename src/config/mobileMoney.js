const config = {
  simulation: process.env.MOBILE_MONEY_SIMULATION !== 'false',
  registrationFee: Number(process.env.REGISTRATION_FEE) || 5000,

  mtn: {
    name: 'MTN Mobile Money',
    apiUrl: process.env.MTN_MOMO_API_URL || 'https://proxy.momoapi.mtn.com',
    apiKey: process.env.MTN_MOMO_API_KEY || '',
    apiSecret: process.env.MTN_MOMO_API_SECRET || '',
    primaryKey: process.env.MTN_MOMO_PRIMARY_KEY || '',
    collectionPhone: process.env.MTN_MOMO_COLLECTION_PHONE || '',
    environment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
  },

  airtel: {
    name: 'Airtel Money',
    apiUrl: process.env.AIRTEL_MONEY_API_URL || 'https://openapi.airtel.africa',
    clientId: process.env.AIRTEL_MONEY_CLIENT_ID || '',
    clientSecret: process.env.AIRTEL_MONEY_CLIENT_SECRET || '',
    environment: process.env.AIRTEL_MONEY_ENVIRONMENT || 'sandbox',
  },
};

module.exports = config;
