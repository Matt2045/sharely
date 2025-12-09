import {Outlet, redirect, useLoaderData} from "react-router";
import {account} from "../../../appwrite/client";
import {getExistingUser, storeUserInDatabase} from "../../../appwrite/auth";
import SearchBar from "../../../components/SearchBar";
import {useState} from "react";


/**
 * Loader-Funktion: Überprüft die Authentifizierung und stellt das Benutzerobjekt bereit.
 * 1. Prüft, ob eine Appwrite-Sitzung existiert.
 * 2. Prüft, ob ein entsprechender Benutzerdatensatz in der Datenbank existiert.
 * 3. Falls nicht, wird ein neuer Datensatz erstellt.
 *
 * @returns {Promise<Object | Response>} Das Benutzerobjekt (aus der DB) oder eine Umleitung.
 */
export async function clientLoader() {
    try {
        // 1. Appwrite-Sitzung abrufen. Dies schlägt fehl, wenn kein aktiver Token vorhanden ist.
        const user = await account.get();

        // Prüfen auf Authentifizierung: Wenn keine ID existiert, zur Anmeldeseite umleiten.
        if(!user.$id) return redirect("/sign-in");

        // 2. Datenbank-Synchronisation: Den zugehörigen DB-Eintrag abrufen.
        const existingUser = await getExistingUser(user.$id);

        // 3. Ergebnis zurückgeben:
        // Wenn der Benutzer in der DB existiert, diesen Datensatz zurückgeben.
        // Andernfalls, den Benutzer in der DB speichern und den neuen Datensatz zurückgeben.
        return existingUser?.$id ? existingUser : await storeUserInDatabase();

    } catch (e) {
        // Fehler beim Laden (z.B. Appwrite-API-Fehler):
        // Fängt Fehler ab (z.B. "Unauthorized") und leitet zur Anmeldeseite um.
        console.log("Error loading dashboard: ", e);
        return redirect("/");
    }
}

/**
 * Die Haupt-Layout-Komponente für alle angemeldeten Routen.
 * Sie verwaltet den globalen Zustand der Suchleiste und stellt das geladene Benutzerobjekt bereit.
 */
export default function PublicLayout() {

    // Ruft die vom clientLoader bereitgestellten Benutzerdaten ab (aus der Datenbank).
    const user = useLoaderData();

    // Lokaler Zustand für den Suchbegriff, der über die gesamte Anwendung geteilt wird.
    const [searchTerm, setSearchTerm] = useState("");



    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <header className="sticky top-0 z-10 bg-gray-800 shadow-xl border-b border-gray-700">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} user={user}/>
            </header>

            {/* Hauptinhalt der Anwendung */}
            <main className="pb-10">
                <Outlet context={{user, searchTerm, setSearchTerm}} />
            </main>
        </div>
    );
};
