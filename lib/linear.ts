import { LinearClient } from '@linear/sdk';
import logger from './logger';

const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});

const digitalLyncTeamId = process.env.LINEAR_TEAM_ID;

export const createIssue = async (title: string, description?: string) => {
  let issue;
  try {
    issue = await linear.createIssue({
      title: `KonaLMS: ${title}`,
      description,
      teamId: digitalLyncTeamId,
    });
  } catch (error) {
    logger.error(error, 'Error creating issue');
  }

  return issue;
};

export default linear;
