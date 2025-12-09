import {account} from "../../../appwrite/client";
import {Outlet, redirect} from "react-router";
import React from 'react';

// Loader-Funktion, die von react-router aufgerufen wird, bevor die Seite gerendert wird.
/**
 * Überprüft, ob bereits eine aktive Appwrite-Sitzung existiert.
 * Ist ein Benutzer eingeloggt, wird er zur Haupt-Feed-Seite (`/`) umgeleitet.
 *
 * @returns {Promise<Response | null>} Eine Umleitungs-Response oder null, um die Komponenten-Ladung fortzusetzen.
 *  */
export async function clientLoader() {
    try {
        const user = await account.get();

        if(user && user?.$id) {
            return redirect("/feed");
        }

    } catch (e) {
        // Keine aktive Sitzung gefunden.
        // Erwartetes Verhalten für Gäste, die sich anmelden oder registrieren wollen.
        console.log("Keine aktive Session gefunden (erwarteter Fehler Appwrite: expected error for guests).", e);
    }
    // Keine aktive Sitzung gefunden oder Umleitung ausgelöst: Loader gibt null zurück und die AuthLayout-Komponente wird geladen.
    return null;
}

/**
 * Das Layout für alle Authentifizierungsseiten (Signup & Signin).
 * Stellt den zentrierten Container bereit.
 * Die spezifischen Formulare werden über <Outlet /> gerendert.
 */
export default function AuthLayout() {
    return (
        <main className="font-sans min-h-screen flex justify-center items-start bg-gray-900 text-white px-4 py-8 md:py-12">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 opacity-90"></div>

            <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 my-auto">
                <h1 className="text-center text-4xl font-extrabold text-red-500 mb-8">
                    Sharely
                </h1>

                <Outlet />
            </div>
        </main>
    );
};