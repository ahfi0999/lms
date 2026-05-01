declare module 'topbar';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      MODE: 'local' | 'production' | 'qa' | 'development';
      DATABASE_URL: string;
      AZURE_STORAGE_CONNECTION_STRING: string;
      AZURE_STORAGE_CONTAINER_PREFIX: string;
      MAILGUN_API_KEY: string;
      MAILGUN_DOMAIN: string;
      OPENAI_API_KEY?: string | undefined;
      AUTH0_SECRET: string;
      AUTH0_BASE_URL: string;
      AUTH0_ISSUER_BASE_URL: string;
      AUTH0_CLIENT_ID: string;
      AUTH0_CLIENT_SECRET: string;
      AUTH0_API_APP_RESOURCE_ID: string;
      NEXT_PUBLIC_AUTH0_API_APP_IDENTIFIER: string;
      AUTH0_DB_CONNECTION_ID: string;
      NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL: string;
      NEXT_PUBLIC_FRONTEND_URL: string;
      NEXT_PUBLIC_AUTH0_CLIENT_ID: string;
      AUTH0_LEARNER_ROLE_ID: string;
      LINEAR_API_KEY: string;
      LINEAR_TEAM_ID: string;
      NEXT_PUBLIC_DOCS_SITE_URL: string;
      NEXT_PUBLIC_ACCOUNT: string;
    }
  }
}

export {};
