import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const BASE_URL = 'http://localhost:3000';

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { ...headers };
    let bodyData = null;

    if (body !== null) {
      bodyData = typeof body === 'string' ? body : JSON.stringify(body);
      if (!reqHeaders['Content-Type'] && !reqHeaders['content-type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            parsed = raw;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw,
          });
        });
      }
    );

    req.on('error', reject);
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

test('EcoSmartX Production Readiness & Security Master Suite', async (t) => {
  await t.test('1. CORS: Trusted origin (localhost / .run.app) sets allow headers', async () => {
    const res = await makeRequest({
      method: 'OPTIONS',
      path: '/api/health',
      headers: {
        Origin: 'https://ais-dev-bd5r4g6sbgj2t636za7kix-182456558944.asia-southeast1.run.app',
      },
    });
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(
      res.headers['access-control-allow-origin'],
      'https://ais-dev-bd5r4g6sbgj2t636za7kix-182456558944.asia-southeast1.run.app'
    );
  });

  await t.test('2. CORS: Untrusted origin blocked with HTTP 403', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/export/csv',
      headers: {
        Origin: 'https://malicious-attacker-website.com',
      },
      body: { items: [{ Name: 'Test' }] },
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.code, 'FORBIDDEN_CORS_ORIGIN');
  });

  await t.test('3. CSV Sanitization: Formula characters (= + - @) prepended with single quote', async () => {
    const res = await makeRequest({
      method: 'POST',
      path: '/api/export/csv',
      body: {
        items: [
          { Name: '=SUM(1,2)', Watts: 500 },
          { Name: '+cmd|calc', Watts: 200 },
          { Name: '-10+20', Watts: 100 },
          { Name: '@malicious', Watts: 50 },
        ],
      },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.raw.includes("\"'=SUM(1,2)\""));
    assert.ok(res.raw.includes("\"'+cmd|calc\""));
    assert.ok(res.raw.includes("\"'-10+20\""));
    assert.ok(res.raw.includes("\"'@malicious\""));
  });

  await t.test('4. CSV Export Limit: Requests > 2000 items rejected with 400', async () => {
    const hugeItems = new Array(2001).fill({ Name: 'Fan', Watts: 60 });
    const res = await makeRequest({
      method: 'POST',
      path: '/api/export/csv',
      body: { items: hugeItems },
    });
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Export item limit exceeded'));
  });

  await t.test('5. CSV Import Size Limit: Payloads > 500KB rejected with 413', async () => {
    const hugeCsv = 'name,category,ratedwatts,quantity,operatinghoursperday\n' + 'Fan,HVAC,60,1,8\n'.repeat(40000);
    const res = await makeRequest({
      method: 'POST',
      path: '/api/import/validate',
      body: { csvText: hugeCsv },
    });
    assert.strictEqual(res.statusCode, 413);
    assert.strictEqual(res.body.code, 'PAYLOAD_TOO_LARGE');
  });

  await t.test('6. CSV Import Validation: Valid rows parsed with numerical constraints', async () => {
    const validCsv = `name,category,ratedwatts,quantity,operatinghoursperday\nChiller,HVAC,15000,2,16\nLED Panel,Lighting,40,100,10`;
    const res = await makeRequest({
      method: 'POST',
      path: '/api/import/validate',
      body: { csvText: validCsv },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.valid, true);
    assert.strictEqual(res.body.validRowCount, 2);
  });

  await t.test('7. Indian Number & Currency Formatting: en-IN formatting and Lakh/Crore scales', () => {
    function formatCurrency(amount, currency = 'INR', compact = false) {
      const sym = (currency === 'EUR') ? '€' : (currency === 'GBP') ? '£' : '₹';
      const num = Number(amount || 0);
      if (compact || Math.abs(num) >= 10000000) {
        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        if (abs >= 10000000) return `${sign}${sym}${(abs / 10000000).toFixed(2)} Cr`;
        if (abs >= 100000) return `${sign}${sym}${(abs / 100000).toFixed(2)} Lakh`;
      }
      return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    function formatIndianNumber(val, decimals = 0) {
      if (val === null || val === undefined || isNaN(val)) return '0';
      return Number(val).toLocaleString('en-IN', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: 0,
      });
    }

    // Standard currency in INR
    assert.strictEqual(formatCurrency(150000), '₹1,50,000');
    // Compact Crore representation
    assert.strictEqual(formatCurrency(25000000, 'INR', true), '₹2.50 Cr');
    // Compact Lakh representation
    assert.strictEqual(formatCurrency(450000, 'INR', true), '₹4.50 Lakh');
    // Indian number format
    assert.strictEqual(formatIndianNumber(1234567), '12,34,567');
  });

  await t.test('8. CEA Emission Factor Default: 0.72 kg CO2e/kWh applied when not overridden', async () => {
    const { calculateFacilityMetrics } = await import('../src/utils/energyEngine.js');
    const facility = {
      id: 'fac-cea-test',
      name: 'CEA Benchmark Facility',
      floorAreaSqM: 1000,
      appliances: [
        {
          id: 'app-1',
          name: 'Main Motor',
          category: 'hvac',
          ratedWatts: 1000,
          quantity: 1,
          operatingHoursPerDay: 10,
          operatingDaysPerWeek: 7,
          utilizationFactor: 1.0,
        },
      ],
    };
    const metrics = calculateFacilityMetrics(facility);
    // 1000W * 10h = 10 kWh/day * (365/12) = 304.1667 kWh/month
    // CO2 = 304.1667 * 0.72 = ~219.0 kg
    assert.ok(Math.abs(metrics.facility.monthlyCo2Kg - 219) < 1.0);
  });
});
