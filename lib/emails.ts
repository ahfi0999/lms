import { readFileSync } from 'fs';
import path from 'path';
import { compile } from 'handlebars';

import logger from './logger';
import { EmailTemplate } from '../types/utils';
import FormData from 'form-data';
import Mailgun, { MailgunMessageData } from 'mailgun.js';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

export const sendEmail = async (mailData: MailgunMessageData) => {
  try {
    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, mailData);
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
