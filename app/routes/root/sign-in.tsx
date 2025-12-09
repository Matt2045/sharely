import React, {useState} from 'react';
import {login, loginAsGuest, loginWithGoogle} from "../../../appwrite/auth";
import {Link, useNavigate} from "react-router"; // Verwenden von react-router-dom für Navigation


/**
 * Benutzeranmeldung (Login-Formular).
 */
const SignIn = () => {

    // Zustand für die E-Mail-Adresse und das Passwort des Benutzers.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Zustand zur Deaktivierung des Buttons während des Ladevorgangs (Anmeldung).
    const [isLoading, setIsLoading] = useState(false);
    // Zustand für die Speicherung und Anzeige von Fehlermeldungen.
    const [error, setError] = useState<string | null>(null);

    // Hook von React Router zur programmatischen Navigation nach erfolgreichem Login.
    const navigate = useNavigate();

    /**
     * Behandelt das Absenden des Anmeldeformulars.
     * @param {React.FormEvent} e Das Formular-Event.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Verhindert das Standard-Reload-Verhalten des Browsers.
        setError(null);
        setIsLoading(true);

        try {
            // Asynchroner Login-Aufruf zur Appwrite-Authentifizierung.
            await login(email, password);

            // Bei Erfolg: Navigation zum Haupt-Feed.
            navigate('/feed');
        } catch (err: any) {
            console.error("Login-Fehler:", err);
            // Setzt eine benutzerfreundliche Fehlermeldung.
            setError(err.message || "Anmeldung fehlgeschlagen. Bitte überprüfe deine E-Mail und dein Passwort.");
        } finally {
            setIsLoading(false);
        }
    };


    /**
     * Leitet den Benutzer zur Google OAuth-Anmeldung weiter.
     * Appwrite kümmert sich um den Redirect-Flow.
     */
    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();

        } catch (err: any) {
            console.error("Google Login-Fehler:", err);
            setError("Anmeldung mit Google fehlgeschlagen.");
        }
    }

        const handleGuestLogin = async () => {
            try {
                await loginAsGuest("test@portfolio.at", "test1234");

                // Bei erfolgreicher Anmeldung leitet der Benutzer zum Feed um.
                navigate("/feed");

            } catch (error) {
                console.error("Failed to log in as guest:", error);
            }
        };


    return (
        <div className="flex flex-col gap-6">
            {/* Überschrift */}
            <h2 className="text-3xl font-bold text-white text-center">Anmelden bei Sharely</h2>

            {/* Formular für E-Mail und Passwort */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* E-Mail Input */}
                <div>
                    <input
                        type="email"
                        placeholder="E-Mail-Adresse"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        // Konsistentes, dunkles Input-Design
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                </div>

                {/* Passwort Input */}
                <div>
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        // Konsistentes, dunkles Input-Design
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
                    disabled={isLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 transition rounded-lg text-white font-semibold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
                >
                    {isLoading ? 'Melde an...' : 'Anmelden'}
                </button>

                {/* Trennlinie */}
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-500">oder</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                {/* Button für Gast-Login */}
                <button
                    type="button"
                    className="w-full py-3 bg-white hover:bg-gray-200 text-gray-900 transition rounded-lg font-semibold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
                    onClick={handleGuestLogin}
                >
                    <span className="p-18-semibold">Als Gast anmelden</span>
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
                Mit Google anmelden
            </button>


            {/* Link zur Registrierung */}
            <p className="text-center text-gray-400 mt-4">
                Noch kein Konto?{' '}
                <Link to="/sign-up" className="text-red-400 hover:text-red-500 font-medium transition">
                    Jetzt registrieren
                </Link>
            </p>
        </div>
    );
};

export default SignIn;
