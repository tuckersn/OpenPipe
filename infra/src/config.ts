import * as pulumi from "@pulumi/pulumi";

const cfg = new pulumi.Config();

type SecretKey =
  | "DATABASE_URL"
  | "OPENAI_API_KEY"
  | "NEXTAUTH_SECRET"
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET"
  | "SENTRY_AUTH_TOKEN"
  | "SMTP_PASSWORD"
  | "OPENPIPE_API_KEY"
  | "AUTHENTICATED_SYSTEM_KEY"
  | "AZURE_STORAGE_ACCOUNT_KEY"
  | "AZURE_OPENAI_API_KEY_EASTUS2"
  | "AZURE_OPENAI_API_KEY_EASTUS"
  | "AZURE_OPENAI_API_KEY_WESTUS"
  | "AZURE_OPENAI_API_KEY_CANADAEAST"
  | "AZURE_OPENAI_API_KEY_AUSTRALIAEAST"
  | "AZURE_OPENAI_API_KEY_FRANCECENTRAL"
  | "AZURE_OPENAI_API_KEY_JAPANEAST"
  | "AZURE_OPENAI_API_KEY_NORWAYEAST"
  | "AZURE_OPENAI_API_KEY_SOUTHINDIA"
  | "ANYSCALE_INFERENCE_API_KEY";

type ConfigKey =
  | "WORKER_CONCURRENCY"
  | "PG_MAX_POOL_SIZE"
  | "NODE_ENV"
  | "NEXT_PUBLIC_SENTRY_DSN"
  | "NEXT_PUBLIC_POSTHOG_KEY"
  | "SMTP_LOGIN"
  | "AZURE_STORAGE_CONTAINER_NAME"
  | "AZURE_STORAGE_ACCOUNT_NAME"
  | "MODAL_ENVIRONMENT"
  | "SMTP_HOST"
  | "NEXT_PUBLIC_DEPLOY_ENV"
  | "SENDER_EMAIL"
  | "deployDomain"
  | "ANYSCALE_INFERENCE_BASE_URL";

export const getSecret = (key: SecretKey) => cfg.requireSecret(key);
export const getConfig = (key: ConfigKey) => cfg.require(key);
