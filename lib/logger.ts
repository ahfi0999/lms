import pino from 'pino';

// TODO: https://nextjs.org/docs/pages/building-your-application/deploying/production-checklist#logging
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export default logger;
