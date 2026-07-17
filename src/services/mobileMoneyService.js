const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/mobileMoney');

class MobileMoneyService {
  async processPayment(provider, phone, amount, reference) {
    const providerConfig = config[provider];
    if (!providerConfig) {
      throw new Error(`Opérateur non supporté: ${provider}`);
    }

    const isDefaultUrl = providerConfig.apiUrl === 'https://proxy.momoapi.mtn.com';
    const shouldSimulate = config.simulation || !providerConfig.apiKey || isDefaultUrl;

    console.log(`[MobileMoney] Traitement ${providerConfig.name}:`, {
      phone,
      amount,
      reference,
      simulation: shouldSimulate,
    });

    if (shouldSimulate) {
      return this._simulateSuccess(provider, phone, amount, reference);
    }

    return this._callApi(provider, phone, amount, reference);
  }

  async _simulateSuccess(provider, phone, amount, reference) {
    console.log(`[MobileMoney] ✓ Paiement simulé réussi: ${amount} FCFA via ${provider}`);
    return {
      success: true,
      transactionId: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      provider,
      phone,
      amount,
      reference,
      message: 'Paiement simulé avec succès',
    };
  }

  async _callApi(provider, phone, amount, reference) {
    const providerConfig = config[provider];

    if (provider === 'mtn') {
      return this._callMtnApi(providerConfig, phone, amount, reference);
    }
    if (provider === 'airtel') {
      return this._callAirtelApi(providerConfig, phone, amount, reference);
    }

    throw new Error(`API non configurée pour ${provider}`);
  }

  _mtnApi(path) {
    return `${config.mtn.apiUrl.replace(/\/+$/, '')}${path}`;
  }

  async _mtnAuth(providerConfig) {
    const credentials = Buffer.from(`${providerConfig.apiKey}:${providerConfig.apiSecret}`).toString('base64');

    const res = await axios.post(
      this._mtnApi('/collection/token/'),
      null,
      {
        timeout: 10000,
        headers: {
          Authorization: `Basic ${credentials}`,
          'Ocp-Apim-Subscription-Key': providerConfig.primaryKey,
          'Content-Length': 0,
        },
      }
    );

    return res.data.access_token;
  }

  async _callMtnApi(providerConfig, phone, amount, reference) {
    console.log(`[MobileMoney] Appel API MTN: ${providerConfig.apiUrl}`);

    const token = await this._mtnAuth(providerConfig);
    const xReferenceId = crypto.randomUUID();

    const cleanPhone = phone.startsWith('+') ? phone.slice(1) : phone;

    const payeePhone = providerConfig.collectionPhone?.replace(/^\+/, '') || '';

    const body = {
      amount: String(amount),
      currency: 'EUR',
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: cleanPhone,
      },
      payerMessage: 'Paiement MedConnect',
      payeeNote: payeePhone ? `Paiement vers ${payeePhone} - MedConnect` : 'Services MedConnect',
    };

    console.log(`[MobileMoney] Envoi requête requesttopay:`, {
      xReferenceId,
      amount,
      payer: cleanPhone,
      payee: payeePhone || 'compte API',
    });

    await axios.post(
      this._mtnApi('/collection/v1_0/requesttopay'),
      body,
      {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': xReferenceId,
          'X-Target-Environment': providerConfig.environment,
          'Ocp-Apim-Subscription-Key': providerConfig.primaryKey,
          'Content-Type': 'application/json',
        },
      }
    );

    await new Promise((r) => setTimeout(r, 3000));

    const statusRes = await axios.get(
      this._mtnApi(`/collection/v1_0/requesttopay/${xReferenceId}`),
      {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': providerConfig.environment,
          'Ocp-Apim-Subscription-Key': providerConfig.primaryKey,
        },
      }
    );

    const status = statusRes.data;

    console.log(`[MobileMoney] Statut paiement:`, status);

    if (status.status === 'SUCCESSFUL') {
      return {
        success: true,
        transactionId: status.referenceId || xReferenceId,
        provider: 'mtn',
        phone,
        amount,
        reference,
        message: 'Paiement MTN Mobile Money réussi',
        financialTransactionId: status.financialTransactionId || null,
      };
    }

    if (status.status === 'PENDING') {
      return {
        success: true,
        transactionId: xReferenceId,
        provider: 'mtn',
        phone,
        amount,
        reference,
        message: 'Paiement MTN Mobile Money en attente de validation',
        pending: true,
      };
    }

    throw new Error(`Paiement MTN Mobile Money échoué: ${status.status} - ${status.failReason || 'Motif inconnu'}`);
  }

  async _callAirtelApi(providerConfig, phone, amount, reference) {
    console.log(`[MobileMoney] Appel API Airtel: ${providerConfig.apiUrl}`);

    // TODO: Implémenter l'appel API Airtel Money
    // Documentation: https://developers.airtel.africa/
    //
    // 1. Générer un token via POST /auth/oauth2/token
    // 2. POST /merchant/v1/payments/
    //    Headers: Authorization, X-Country, X-Currency
    //    Body: { reference, subscriber: { country, currency, msisdn }, transaction: { amount, type: "MERCHANT" } }
    throw new Error('API Airtel Money pas encore implémentée');
  }
}

module.exports = new MobileMoneyService();
