import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';

let apiInstance = null;

if (process.env.BREVO_API_KEY) {
  apiInstance = new TransactionalEmailsApi();
  apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  console.log('[Brevo] Transactional Email API initialized successfully');
} else {
  console.warn('[Brevo] No BREVO_API_KEY provided. Operating in mock email mode.');
}

export const getBrevoApi = () => apiInstance;
export { SendSmtpEmail };
