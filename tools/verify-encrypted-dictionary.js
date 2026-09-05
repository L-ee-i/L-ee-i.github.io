'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { JSDOM } = require('jsdom');

const bundlePath = path.resolve(__dirname, '..', 'source', 'dictionary', 'knowledge.enc');
const password = process.env.DICTIONARY_PASSWORD || '';

if (!password) {
  console.error('Missing DICTIONARY_PASSWORD for encrypted dictionary test.');
  process.exit(1);
}

const decrypt = (bundle, secret) => {
  if (bundle.subarray(0, 8).toString('ascii') !== 'LEEKBD01') throw new Error('Invalid magic header.');
  const iterations = bundle.readUInt32BE(8);
  const salt = bundle.subarray(12, 28);
  const iv = bundle.subarray(28, 40);
  const encryptedAndTag = bundle.subarray(40);
  const encrypted = encryptedAndTag.subarray(0, -16);
  const tag = encryptedAndTag.subarray(-16);
  const key = crypto.pbkdf2Sync(secret, salt, iterations, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  key.fill(0);
  return JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
};

try {
  const bundle = fs.readFileSync(bundlePath);
  const payload = decrypt(bundle, password);
  const ids = new Set(payload.documents.map((doc) => doc.id));
  if (payload.documents.length < 100) throw new Error(`Expected at least 100 documents, got ${payload.documents.length}.`);
  if (ids.size !== payload.documents.length) throw new Error('Duplicate document IDs found.');
  const unsafeDocuments = payload.documents.filter((doc) => {
    const document = new JSDOM(`<!doctype html><body>${doc.html}</body>`).window.document;
    if (document.querySelector('script,iframe,object,embed,form,input,button,textarea,select,meta,link,base,svg,math')) return true;
    return [...document.querySelectorAll('*')].some((element) => [...element.attributes].some((attribute) =>
      attribute.name.toLowerCase().startsWith('on') || ['style', 'srcdoc', 'formaction'].includes(attribute.name.toLowerCase())));
  });
  if (unsafeDocuments.length) {
    throw new Error(`Unsafe executable HTML survived sanitization in: ${unsafeDocuments.slice(0, 5).map((doc) => doc.relativePath).join(', ')}`);
  }
  const missingTargets = [];
  for (const doc of payload.documents) {
    for (const match of doc.html.matchAll(/href="#\/doc\/([a-f0-9]{16})/g)) {
      if (!ids.has(match[1])) missingTargets.push(`${doc.relativePath} -> ${match[1]}`);
    }
  }
  if (missingTargets.length) throw new Error(`Missing encrypted document targets: ${missingTargets.slice(0, 5).join(', ')}`);
  if (bundle.includes(Buffer.from('SQL 注入'))) throw new Error('Plaintext marker found in encrypted bundle.');

  let wrongPasswordRejected = false;
  try { decrypt(bundle, `${password}-wrong`); } catch { wrongPasswordRejected = true; }
  if (!wrongPasswordRejected) throw new Error('Wrong password was not rejected.');

  console.log(`Encrypted dictionary verified: ${payload.documents.length} documents, ${payload.attachments.length} attachments, wrong password rejected.`);
} catch (error) {
  console.error(`Encrypted dictionary verification failed: ${error.message}`);
  process.exit(1);
}
