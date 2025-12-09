import * as Sentry from "@sentry/react-router";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
Sentry.init({
    dsn: "https://c1600bd40d9159755f8df7578c87b3b7@o4509990219350016.ingest.de.sentry.io/4510343068319824",
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    // Enable logs to be sent to Sentry
    enableLogs: true,
    // Add our Profiling integration
    integrations: [nodeProfilingIntegration()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    // We recommend adjusting this value in production
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#tracesSampleRate
    tracesSampleRate: 1.0,
    // Set profilesSampleRate to 1.0 to profile 100%
    // of sampled transactions.
    // This is relative to tracesSampleRate
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#profilesSampleRate
    profilesSampleRate: 1.0,
});