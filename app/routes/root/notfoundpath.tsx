import React from 'react';
import { useNavigate } from 'react-router';

/**
 * 404 Fehlerseite (NotFound)
 * Zeigt eine Meldung an, wenn eine Route nicht gefunden wurde, und bietet Navigationsoptionen.
 * Das Design orientiert sich am dunklen Farbschema der Anmeldeseite.
 */
const NotFoundPath = () => {
    // Hook von React Router zur programmatischen Navigation.
    const navigate = useNavigate();


    // Navigiert einen Schritt im Browserverlauf zurück.
    const goBack = () => {
        // Versucht, zur vorherigen Seite im Browser-Verlauf zu gehen.
        navigate(-1);
    };


    // Navigiert zur Startseite oder zur Hauptansicht.
    const goToHome = () => {
        // Navigiert zum sicheren Einstiegspunkt der Anwendung
        navigate('/feed');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg p-8 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 text-center">

                <h1 className="text-8xl font-extrabold text-red-500 mb-4">404</h1>
                <h2 className="text-3xl font-bold text-white mb-3">
                    Seite nicht gefunden
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                    Entschuldigung, aber die von Ihnen gesuchte Seite existiert nicht mehr oder die Adresse ist falsch.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">

                    {/* 1. Hauptaktion: Zur Startseite (Roter Button, wie der Login-Button) */}
                    <button
                        className="w-full sm:w-auto py-3 px-6 bg-red-600 hover:bg-red-700 transition rounded-lg text-white font-semibold text-lg shadow-lg"
                        onClick={goToHome}
                    >
                        Zur Startseite
                    </button>

                    {/* 2. Sekundäre Aktion: Einen Schritt zurück */}
                    <button
                        className="w-full sm:w-auto py-3 px-6 text-gray-300 border border-gray-600 bg-gray-700 hover:bg-gray-600 transition rounded-lg font-semibold text-lg"
                        onClick={goBack}
                    >
                        Zurück
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPath;