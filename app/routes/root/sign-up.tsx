import React, {useState} from 'react';
import {loginWithGoogle, registerWithEmail} from "../../../appwrite/auth";
import {Link, useNavigate} from "react-router";


/**
 * Benutzerregistrierung (SignUp-Formular).
 */
const SignUp = () => {
    // Zustände für die Eingabefelder: Name, E-Mail und Passwort.
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Ladezustand, um den Button während des Registrierungsprozesses zu deaktivieren.
    const [isLoading, setIsLoading] = useState(false);
    // Zustand zum Speichern und Anzeigen von Fehlermeldungen (z.B. ungültiges Passwort, E-Mail existiert).
    const [error, setError] = useState<string | null>(null);

    // Hook von React Router, um programmatisch navigieren zu können
    const navigate = useNavigate();

    /**
     * Behandelt das Absenden des Registrierungsformulars.
     * @param {React.FormEvent} e Das Formular-Event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Verhindert den Standard-Reload des Browsers.
        setError(null);
        setIsLoading(true);

        try {
            // Prüfung der Mindestlänge für das Passwort (Best Practice: Appwrite erfordert mindestens 8 Zeichen).
            if (password.length < 8) {
                setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
                setIsLoading(false);
                return;
            }

            // Aufruf der Appwrite-Funktion zur Erstellung eines neuen Benutzerkontos.
            await registerWithEmail(name, email, password);

            // Weiterleitung nach erfolgreicher Registrierung.
            window.location.href = '/feed';

        } catch (err: any) {
            console.error("Registrierungsfehler:", err);
            // Verbesserte Fehlerbehandlung für gängige Appwrite-Fehler
            let errorMessage = "Registrierung fehlgeschlagen.";

            // Versucht, den Fehlertext aus der Appwrite-Antwort zu extrahieren
            if (err.message && err.message.includes('A user with the same id, email, or phone already exists')) {
                errorMessage = "Diese E-Mail-Adresse ist bereits registriert.";
            } else if (err.message) {
                // Generische Fehlermeldung aus Appwrite übernehmen.
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            // Wird nur ausgeführt, wenn der Login fehlschlägt (weil der Browser sonst neu lädt).
            setIsLoading(false);
        }
    }

    /**
     * Leitet den Benutzer zur Google OAuth-Anmeldung weiter.
     * Appwrite kümmert sich um den Redirect-Flow.
     */
    const handleGoogleLogin = async () => {
        try {
            // Startet den OAuth2-Flow über Appwrite, der automatisch weiterleitet
            await loginWithGoogle();
        } catch (err: any) {
            console.error("Google Registrierungsfehler:", err);
            setError("Registrierung mit Google fehlgeschlagen.");
        }
    };

    // --- Render-Funktion ---
    return (
        <div className="flex flex-col gap-6">
            {/* Überschrift */}
            <h2 className="text-3xl font-bold text-white text-center">Registrieren bei Sharely</h2>

            {/* Formular für E-Mail und Passwort */}
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name Input */}
                <div>
                    <input
                        type="text"
                        placeholder="Dein Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                </div>

                {/* E-Mail Input */}
                <div>
                    <input
                        type="email"
                        placeholder="E-Mail-Adresse"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                </div>

                {/* Passwort Input */}
                <div>
                    <input
                        type="password"
                        placeholder="Passwort (mind. 8 Zeichen)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                </div>

                {/* Fehlermeldung */}
                {error && (
                    <p className="text-sm text-center text-red-400 p-2 bg-gray-700 rounded-lg border border-red-500">
                        {error}
                    </p>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !name || !email || !password}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 transition rounded-lg text-white font-semibold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
                >
                    {isLoading ? 'Registriere...' : 'Registrieren'}
                </button>
            </form>

            {/* Trennlinie */}
            <div className="flex items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-500">oder</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Social Login Button */}
            <button
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition text-lg shadow-md flex items-center justify-center gap-2"
                disabled={isLoading}
            >
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_and_wordmark_of_Google_from_2017.svg"
                    alt="Google Logo"
                    className="w-5 h-5"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                Mit Google registrieren
            </button>


            {/* Link zur Anmeldung */}
            <p className="text-center text-gray-400 mt-4">
                Schon registriert?{' '}
                <Link to="/" className="text-red-400 hover:text-red-500 font-medium transition">
                    Jetzt anmelden
                </Link>
            </p>
        </div>
    );
};

export default SignUp;
