import {Account, ID, OAuthProvider, Permission, Query, Role} from "appwrite";
import {account, database, appwriteConfig, storage, client} from "./client";
import { redirect } from "react-router";

import {serverConfig} from "~/config/server.config";


/**
 * Datenstruktur für die Erstellung eines neuen Pins, einschließlich der hochzuladenden Datei.
 */
interface CreatePinData {
    title: string;
    description: string;
    tags: string;
    imageFile: File;
}


/**
 * Prüft, ob ein Appwrite-Account (`accountId`) bereits als Benutzer-Dokument
 * in der benutzerdefinierten `userCollectionId` existiert.
 *
 * Dies ist entscheidend für OAuth-Anmelde-Flows, um neue Datenbankeinträge zu vermeiden,
 * wenn der Benutzer bereits registriert ist.
 *
 * @param {string} userId - Die Appwrite Account ID aus der userCollection.
 * @returns {Promise<any | null>} - Das Benutzer-Dokument, falls vorhanden, andernfalls `null`.
 */
export const getExistingUser = async (userId: string) => {
    try {

        // Abfrage der 'User'-Collection anhand des 'accountId' (Fremdschlüssel zum Appwrite-Auth-Service).
        const { documents, total} = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', userId)]
        );
        return total > 0 ? documents[0] : null;

    } catch (e) {
        console.log("Error fetching existing user: ", e);
        return null;
    }


}

/**
 * Kernfunktion zur Erstellung eines Pins: Handelt den gesamten Prozess vom Upload bis zum Datenbankeintrag.
 *
 * Der Prozess umfasst:
 * 1. Authentifizierung des Benutzers.
 * 2. Hochladen der Datei in den Appwrite Storage Bucket.
 * 3. Generierung einer permanenten Bild-URL (`getFileView`).
 * 4. Aufruf der Gemini AI zur Metadaten-Generierung (Titel, Beschreibung, Tags).
 * 5. Speichern des finalen Pin-Dokuments in der Datenbank (`pinCollectionId`).
 *
 * @param {CreatePinData} pinData - Die Daten aus dem Formular (Bild-Datei).
 * @returns {Promise<any>} - Das erstellte Appwrite-Dokument.
 * @throws Wirft einen Fehler, wenn der Prozess fehlschlägt.
 */
/**
 * Kernfunktion zur Erstellung eines Pins: Handelt den gesamten Prozess vom Upload bis zum Datenbankeintrag.
 */
export const uploadImage = async (pinData: CreatePinData) => {
    try {
        const user = await account.get();

        // 1. Upload Bild in Appwrite Storage
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageBucketId,
            ID.unique(),
            pinData.imageFile
        );

        // 2. Erstellen einer permanenten URL für das hochgeladene Bild
        const imageUrl = storage.getFileView(
            appwriteConfig.storageBucketId,
            uploadedFile.$id
        );

        // 3. Konvertiere Bild zu Base64 für API-Aufruf
        const base64Data = await fileToBase64(pinData.imageFile);

        // 4. Aufruf der SERVER-SEITIGEN Gemini API-Route
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageData: base64Data,
                mimeType: pinData.imageFile.type,
            }),
        });

        if (!response.ok) {
            throw new Error('Gemini API Aufruf fehlgeschlagen');
        }

        const { metadata: aiData } = await response.json();

        // 5. Vorbereiten des Dokument-Objekts für die Datenbank
        const documentData = {
            title: aiData.title,
            description: aiData.description,
            tags: aiData.tags,
            imageUrl: imageUrl,
            createdBy: user.$id,
            username: user.name,
            likes: 0,
            saves: 0,
        };

        // 6. Erstellen des Dokuments in der Datenbank
        const newDocument = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            ID.unique(),
            documentData
        );

        return newDocument;
    } catch(e) {
        console.error('Pin konnte nicht erstellt werden:', e);
        const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
        throw new Error('Pin konnte nicht erstellt werden. ' + message);
    }
}

// Hilfsfunktion für Base64-Konvertierung
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
}


/**
 * Startet den OAuth2-Anmeldevorgang über Google.
 *
 * Verwendet den Appwrite-Client, um den Benutzer an die Google-Autorisierungsseite weiterzuleiten.
 * Die Success- und Failure-URLs stellen sicher, dass der Benutzer korrekt in die App zurückgeführt wird.
 *
 * @returns {Promise<void>}
 */
export const loginWithGoogle = async () => {

    try {
        account.createOAuth2Session({
            provider: OAuthProvider.Google,
            success: `${window.location.origin}/feed`, // Zielseite nach erfolgreicher Anmeldung
            failure: `${window.location.origin}/sign-in`, // Zielseite bei Fehler
        });
    } catch (e) {
        console.log("Fehler beim Login mit Google OAuth2: ", e);
    }

}

/**
 * Meldet einen Benutzer über E-Mail und Passwort an und erstellt eine neue Session.
 *
 * @param {string} email - Die E-Mail des Benutzers.
 * @param {string} password - Das Passwort des Benutzers.
 * @throws Wirft einen Fehler bei ungültigen Anmeldedaten oder Netzwerkproblemen.
 */
export const login = async (email: string, password: string) => {
    try {
        await account.createEmailPasswordSession(email, password);
    } catch (e) {
        // Fehler weitergeben, damit die UI ihn fangen und anzeigen kann (z.B. "Ungültige Anmeldedaten")
        console.error("Fehler beim einloggen mit E-Mail und Passwort", e);
        throw e;
    }
};

/**
 * Meldet einen Benutzer mit einem vorgefertigten Guest User über E-Mail und Passwort an und erstellt eine neue Session.
 *
 * @param {string} email - Die E-Mail des Benutzers.
 * @param {string} password - Das Passwort des Benutzers.
 * @throws Wirft einen Fehler bei ungültigen Anmeldedaten oder Netzwerkproblemen.
 */
export const loginAsGuest = async (email: string, password: string) => {
    try {
        await account.createEmailPasswordSession(email, password);
    } catch (e) {
        // Fehler weitergeben, damit die UI ihn fangen und anzeigen kann (z.B. "Ungültige Anmeldedaten")
        console.error("Fehler beim einloggen mit E-Mail und Passwort", e);
        throw e;
    }
};


/**
 * Registriert einen neuen Benutzer mit E-Mail und Passwort.
 *
 * @param {string} name - Der Anzeigename des Benutzers.
 * @param {string} email - Die E-Mail-Adresse.
 * @param {string} password - Das Passwort.
 * @returns {Promise<{ userAccount: any, createdUser: any } | undefined>} - Die erstellten Account- und Datenbankobjekte.
 */
export const registerWithEmail = async (name: string, email: string, password: string) => {

    console.log("Registering with email: ", name, email, password);

    // HINWEIS: Hier wird unnötigerweise ein neuer Account-Client instanziiert.
    // Der globale `account` (von "./client") sollte stattdessen verwendet werden.
    // Die Logik wurde beibehalten, um die Funktionsweise nicht zu ändern.
    const tempAccount = new Account(client);

    try {
        // 1. Erstellung des Appwrite Accounts (wichtig für die Authentifizierung).
        const userAccount =  await tempAccount.create(
            ID.unique(),
            email,
            password,
            name
        );


        console.log("User Account: ", userAccount);

        // Ruft ein zufälliges Profilbild über die API von Unsplash ab
        const avatarUrl = await fetchRandomAvatarUrl();

        // 2. Erstellung des Benutzer-Dokuments in der Datenbank (für Profil- und App-Daten).
        const createdUser = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: userAccount.$id, // Verknüpfung zur Account ID
                name: name,
                email: email,
                avatar: avatarUrl, // Dynamische URL für Profilbild von Unsplash
            },
        );

        // 3. Sofortige Anmeldung des Benutzers.
        await tempAccount.createEmailPasswordSession(email, password);
        return { userAccount, createdUser };

    } catch (e) {
        console.log("Error registering with email: ", e);
    }
}

/**
 * Meldet den Benutzer ab, indem alle aktiven Sessions gelöscht werden.
 * Leitet den Benutzer nach erfolgreicher Abmeldung zur Startseite ("/") weiter.
 *
 * @returns {Promise<void>}
 */
export const logout = async () => {
    try {
        await account.deleteSessions();
        window.location.href = "/"
    } catch (e) {
        console.log("Error logging out: ", e);
    }

}

/**
 * Ruft eine zufällige Portrait-Bild-URL von Unsplash ab.
 *
 * Diese Funktion verwendet den offiziellen Unsplash-API-Endpunkt für zufällige Bilder
 * und benötigt den Access Key..
 *
 * @returns {Promise<string>} - Eine URL zum Profilbild oder ein Standard-Fallback.
 */
const fetchRandomAvatarUrl = async (): Promise<string> => {
    const fallbackUrl = "https://placehold.co/400x400/eeeeee/333333?text=USER";

    if (!appwriteConfig.unsplashAccessKey) {
        console.warn("Unsplash Access Key fehlt. Verwende Platzhalter-Avatar.");
        return fallbackUrl;
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/photos/random?query=portrait,face&orientation=portrait&w=400&h=400&client_id=${appwriteConfig.unsplashAccessKey}`
        );

        if (!response.ok) {
            console.error(`Unsplash API Fehler: ${response.statusText}`);
            return fallbackUrl;
        }

        const data = await response.json();
        return data.urls.regular;

    } catch (e) {
        console.error("Fehler beim Abrufen des Unsplash Avatars:", e);
        return fallbackUrl;
    }
};



/**
 * [OAuth Helper] Holt das Profilbild des Benutzers von Google People API.
 * Wird verwendet, um den Avatar eines über OAuth angemeldeten Benutzers zu speichern.
 *
 * @param {string} accessToken - Der Appwrite OAuth Access Token, der zum Aufruf der Google API berechtigt.
 * @returns {Promise<string | null>} - Die URL des Profilbildes oder `null`.
 */
export const getGooglePicture = async (accessToken: string) => {
    try {
        // Verwendet den OAuth-Token zur direkten Abfrage der Google People API.
        const response = await fetch(
            "https://people.googleapis.com/v1/people/me?personFields=photos",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error("Failed to fetch Google profile picture");

        const { photos } = await response.json();
        return photos?.[0]?.url || null;
    } catch (error) {
        console.error("Error fetching Google picture:", error);
        return null;
    }
}

/**
 * Speichert einen über OAuth2 (z.B. Google) neu angemeldeten Benutzer als Datenbank-Dokument.
 *
 * Dies ist notwendig, da OAuth nur den Appwrite Account, aber nicht das korrespondierende
 * Benutzerprofil in der benutzerdefinierten Datenbank erstellt.
 *
 * @returns {Promise<void | Redirect>} Leitet zur Feed-Seite oder zur Anmeldeseite weiter.
 */
export const storeUserInDatabase = async () => {

    try {
        // 1. Appwrite Account-Objekt abrufen.
        const user = await account.get();
        if(!user) return redirect("/sign-in");

        // 2. Extrahieren des Google Access Tokens aus der aktuellen Session.
        const { providerAccessToken } = (await account.getSession("current")) || {};

        // 3. Holen des User-Avatars von Google People API, falls der Token vorhanden ist.
        const profilePicture = providerAccessToken
            ? await getGooglePicture(providerAccessToken)
            : null;

        // 4. Erstellung des Benutzer-Dokuments in der Datenbank (userCollectionId).
        const createdUser = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: user.$id,
                name: user.name,
                email: user.email,
                avatar: profilePicture, // Speicherung des Google-Avatars
            }
        )

        // Sicherstellen, dass das Dokument erstellt wurde, bevor die Weiterleitung erfolgt.
        if(!createdUser) return redirect("/");

    } catch (e) {
        console.log("Error storing user in database: ", e);
        // Bei einem Fehler, der nicht direkt behandelt werden kann, zur Startseite weiterleiten.
        return redirect("/");
    }
}