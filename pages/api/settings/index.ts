import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import db from '../../../lib/db';


const SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  platformName: 'LMS Platform',
  supportEmail: '',
  timezone: 'UTC',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back soon.',
  selfEnrollment: true,
  defaultBatchCapacity: 30,
  waitlistEnabled: false,
  notifyOnEnrollment: true,
  notifyOnCompletion: true,
  notifyOnCertificate: true,
  adminAlertEmail: '',
  certificateIssuer: '',
  autoIssueCertificate: false,
  allowedDomains: [] as string[],
  sessionTimeoutMinutes: 1440,
};

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      let settings = await db.appSettings.findUnique({ where: { id: SETTINGS_ID } });
      if (!settings) {
        settings = await db.appSettings.create({ data: { id: SETTINGS_ID, ...DEFAULT_SETTINGS } });
      }
      return res.status(200).json(settings);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to load settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const updated = await db.appSettings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS, ...body },
        update: body,
      });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
