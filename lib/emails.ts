import { readFileSync } from 'fs';
import path from 'path';
import { compile } from 'handlebars';

import logger from './logger';
import { EmailTemplate } from '../types/utils';
import FormData from 'form-data';
import Mailgun, { MailgunMessageData } from 'mailgun.js';

const mailgun = new Mailgun(FormData);

function getMg() {
  const key = process.env.MAILGUN_API_KEY;
  if (!key) throw new Error('MAILGUN_API_KEY is not configured');
  return mailgun.client({ username: 'api', key });
}

export const sendEmail = async (mailData: MailgunMessageData) => {
  try {
    const mg = getMg();
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN!, mailData);
    logger.info(
      {
        to: mailData.to,
        subject: mailData.subject,
        data,
      },
      'Email sent'
    );
  } catch (error) {
    logger.error(error);
  }
};

export const getEmailHtml = (templateFilename: EmailTemplate, data: unknown) => {
  console.log('templateFilename', __dirname);
  console.log(import.meta.url);
  console.log(process.cwd());
  const template = readFileSync(
    path.join(__dirname, `email-templates/${templateFilename}.hbs`),
    'utf8'
  );

  const compiledTemplate = compile(template);
  return compiledTemplate(data);
};
