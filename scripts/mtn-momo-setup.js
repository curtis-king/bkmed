const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

const PRIMARY_KEY = process.env.MTN_MOMO_PRIMARY_KEY || '3f0189edb5344cac8952176cbd17b9f7';
const BASE_URL = 'sandbox.momodeveloper.mtn.com';
const API_USER_UUID = crypto.randomUUID();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((r) => rl.question(q, r));

console.log('=== Configuration API MTN Mobile Money (Sandbox) ===\n');

// Étape 1 : Créer un API User
const createApiUser = () => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      providerCallbackHost: 'localhost:5000',
    });

    const options = {
      hostname: BASE_URL,
      path: '/v1_0/apiuser',
      method: 'POST',
      headers: {
        'X-Reference-Id': API_USER_UUID,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log(`[1/2] API User créé (status ${res.statusCode})`);
        console.log(`    UUID: ${API_USER_UUID}\n`);
        resolve();
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
};

// Étape 2 : Générer une API Key pour cet utilisateur
const createApiKey = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: `/v1_0/apiuser/${API_USER_UUID}/apikey`,
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': PRIMARY_KEY,
        'Content-Length': 0,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(body);
          console.log('[2/2] API Key générée avec succès !\n');
          console.log('=== Ajoute ces valeurs dans ton .env ===\n');
          console.log(`MTN_MOMO_API_KEY=${API_USER_UUID}`);
          console.log(`MTN_MOMO_API_SECRET=${result.apiKey}`);
          console.log(`MTN_MOMO_PRIMARY_KEY=${PRIMARY_KEY}`);
          console.log(`MOBILE_MONEY_SIMULATION=false\n`);
          console.log(`MTN_MOMO_ENVIRONMENT=sandbox\n`);
          resolve(result);
        } else {
          console.log(`[2/2] Erreur (status ${res.statusCode}): ${body}`);
          reject(new Error(body));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
};

(async () => {
  try {
    const collectionPhone = await ask('Numero MTN qui recoit les paiements (ex: +242XXXXXXXXX) : ');

    await createApiUser();
    await createApiKey();

    console.log(`MTN_MOMO_COLLECTION_PHONE=${collectionPhone}\n`);
    console.log('=== IMPORTANT ===');
    console.log('Ajoute aussi ce numero comme "Provider Party" dans le portail MTN MoMo');
    console.log('(Sandbox: https://sandbox.momodeveloper.mtn.com)');
    console.log('Pour que les fonds soient recus sur ce numero.');
    console.log('=================\n');
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    rl.close();
  }
})();
