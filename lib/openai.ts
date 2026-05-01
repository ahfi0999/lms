import { OpenAI } from 'openai';

import logger from './logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getChatGPTResponse = async (question: string, userId: string) => {
  const prompt = `${question}.don't answer if question is not related to software industry. Format the response in markdown format.`;

  logger.info(
    {
      prompt,
      userId,
    },
    'Getting response from OpenAI'
  );
  let answer: string;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      user: String(userId),
      messages: [
        {
          content: prompt,
          role: 'user',
        },
      ],
    });
    answer = response.choices[0].message?.content || '';
    logger.info(
      {
        answer,
        userId,
      },
      'Got response from OpenAI'
    );
  } catch (error) {
    logger.error(
      {
        error,
        userId,
      },
      'Error while getting response from OpenAI'
    );
    answer =
      'Sorry, AI responses are not available currently. Please contact support team for any further assistance.';
  }

  return answer;
};

export default openai;
