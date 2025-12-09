import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {sentryReactRouter, type SentryReactRouterBuildOptions} from "@sentry/react-router";



const sentryConfig: SentryReactRouterBuildOptions = {
    org: "9bbb58663a85",
    project: "sharely",

    // An auth token is required for uploading source maps;
    // store it in an environment variable to keep it secure.
    authToken: "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",
    // ...
};



export default defineConfig(config => {
    return {
        plugins: [tailwindcss(), tsconfigPaths(), reactRouter(), sentryReactRouter(sentryConfig, config)],
        sentryConfig,
        build: {
            sourcemap: false
        },

        ssr: {
            noExternal:  [/@syncfusion/]
        }
    };


});


