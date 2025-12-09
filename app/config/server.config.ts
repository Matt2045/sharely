
// app/config/server.config.ts

// Lazy loading - wird nur aufgerufen wenn tatsächlich gebraucht
function getServerEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required server environment variable: ${key}`);
    }
    return value;
}

// Export als Getter-Funktionen statt direkter Werte
export const serverConfig = {
    gemini: {
        get apiKey() {
            return getServerEnv('GEMINI_API_KEY');
        }
    },
    unsplash: {
        get secretKey() {
            return getServerEnv('UNSPLASH_API_SECRET_KEY');
        }
    }
};