import {ID, Query} from "appwrite";
import { database, appwriteConfig, account} from "./client";

// --- Private Helper Functions for Status Enrichment ---

/**
 * [Private Helper] Ruft eine Liste von IDs aller Pins ab, die der gegebene Benutzer geliked hat.
 * Diese Funktion dient der Anreicherung von Pin-Objekten mit dem korrekten Like-Status des Viewers.
 *
 * @param {string} userId - Die Appwrite Account ID des Benutzers (Viewers).
 * @returns {Promise<string[]>} - Ein Array von Pin IDs, die der Benutzer geliked hat.
 */
export async function getLikedPinIds(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
        console.log("User in getLikedPinIds: ", userId)
        // Abfrage der Verknüpfungstabelle 'likedPinsCollectionId'.
        // Query.select(["pinId"]) minimiert die Datenlast, indem nur die Pin ID zurückgegeben wird.
        const likedRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.likedPinsCollectionId,
            [
                Query.equal("userId", userId), // Abfrage anhand der Account ID
                Query.select(["pinId"]),
                Query.limit(200) // Höhere Grenze zur Sicherstellung der Vollständigkeit der Status-IDs
            ]
        );
        console.log("Liked Res getLikedPinsIDs: ", likedRes)
        // Mappen der Dokumente, um ein sauberes Array von Pin IDs zu erhalten.
        return likedRes.documents.map(doc => doc.pinId);
    } catch (e) {
        console.error("Error fetching liked pin IDs:", e);
        return [];
    }
}

/**
 * [Private Helper] Ruft eine Liste von IDs aller Pins ab, die der gegebene Benutzer gespeichert/gemerkt hat.
 * Diese Funktion dient der Anreicherung von Pin-Objekten mit dem korrekten Save-Status des Viewers.
 *
 * @param {string} userId - Die Appwrite Account ID des Benutzers (Viewers).
 * @returns {Promise<string[]>} - Ein Array von Pin IDs, die der Benutzer gespeichert hat.
 */
export async function getSavedPinIds(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
        // Abfrage der Verknüpfungstabelle 'savedPinsCollectionId'.
        const savedRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.savedPinsCollectionId,
            [
                Query.equal("userId", userId), // Abfrage anhand der Account ID
                Query.select(["pinId"]),
                Query.limit(200)
            ]
        );
        // Mappen der Dokumente, um ein sauberes Array von Pin IDs zu erhalten.
        return savedRes.documents.map(doc => doc.pinId);
    } catch (e) {
        console.error("Error fetching saved pin IDs:", e);
        return [];
    }
}


// --- Haupt-Abfragefunktionen ---

/**
 * Ruft Pins basierend auf Paginierung und optionalem Suchbegriff ab.
 *
 * Diese Funktion implementiert eine mehrspaltige, OR-ähnliche Suche über Appwrite,
 * indem sie parallele Datenbankabfragen verwendet und die Ergebnisse dedupliziert.
 * Die gefundenen Pins werden anschließend mit dem Like/Save-Status des aktuellen Viewers angereichert.
 *
 * @param {number} limit - Die maximale Anzahl der zurückzugebenden Pins für die Paginierung (Standard: 20).
 * @param {string} [search=""] - Der optionale Suchstring, der in Titel, Beschreibung oder Tags gesucht wird.
 * @param {number} offset - Der Versatz für die Paginierung (Standard: 0).
 * @param {string} [currentUserId] - Die ID des aktuell eingeloggten Benutzers zur Anreicherung des Status.
 * @returns {Promise<any[]>} - Ein Array von Pin-Dokumenten, angereichert mit `liked` und `saved` Status.
 */
export async function getPins(limit = 20, search = "", offset = 0, currentUserId?: string) {
    try {
        const queries = [Query.limit(limit), Query.offset(offset)];
        let pinDocuments: any[] = [];

        // 1. Pins abrufen: Unterscheidung zwischen einfacher Paginierung und Suchlogik.
        if (search.trim() === "") {
            // Einfache Paginierung ohne Suche.
            const res = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.pinCollectionId,
                queries
            );
            pinDocuments = res.documents;
        } else {
            // Erweiterte Suche: Da Appwrite keine direkte OR-Suche über mehrere Attribute unterstützt,
            // werden hier parallele Abfragen für "title", "description" und "tags" mit Promise.all ausgeführt.
            const searchQueries = [
                Query.search("title", search),
                Query.search("description", search),
                Query.search("tags", search),
            ];

            const [res1, res2, res3] = await Promise.all([
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, [searchQueries[0], ...queries]),
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, [searchQueries[1], ...queries]),
                database.listDocuments(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, [searchQueries[2], ...queries]),
            ]);

            // Ergebnisse zusammenführen und Deduplizierung:
            // Verwendung von `Array.from(new Map(...))` ist die effiziente JavaScript-Methode zur Entfernung von Duplikaten
            // basierend auf der eindeutigen Appwrite-ID (`$id`).
            const combined = [...res1.documents, ...res2.documents, ...res3.documents];
            pinDocuments = Array.from(new Map(combined.map(d => [d.$id, d])).values());

            console.log("Search results: ", pinDocuments);
        }

        // 2. Status anreichern: Wird nur ausgeführt, wenn ein authentifizierter User (`currentUserId`) vorhanden ist.
        if (currentUserId && pinDocuments.length > 0) {
            // Paralleler Abruf der Like- und Save-IDs für optimale Performance.
            const [likedIds, savedIds] = await Promise.all([
                getLikedPinIds(currentUserId),
                getSavedPinIds(currentUserId),
            ]);

            const likedSet = new Set(likedIds);
            const savedSet = new Set(savedIds);

            // Mapping: Anreicherung jedes Pins mit den booleschen Status-Flags.
            return pinDocuments.map(pin => ({
                ...pin,
                liked: likedSet.has(pin.$id),
                saved: savedSet.has(pin.$id),
            }));
        }

        return pinDocuments;

    } catch (e) {
        console.error("Error fetching pins:", e);
        // Robuste Rückgabe eines leeren Arrays, um UI-Abstürze zu verhindern.
        return [];
    }
}


/**
 * Ruft alle Pins ab, die ein bestimmter Benutzer (targetUserId) gelikt hat.
 *
 * Die Logik adressiert das Szenario, dass ein Viewer (`currentUserId`) das Profil eines anderen
 * Benutzers (`profileUserId`) ansieht. Die abgerufenen Pins werden mit dem Like/Save-Status
 * des Viewers angereichert, nicht des Profilinhabers.
 *
 * @param {number} limit - Die maximale Anzahl der zurückzugebenden Pins für die Paginierung (Standard: 20).
 * @param {string} currentUserId - Die ID des aktuell eingeloggten Benutzers (Viewers). Wichtig für die Anreicherung.
 * @param {string} [profileUserId] - Die ID des Benutzers, dessen Profil angezeigt wird. Wenn weggelassen, wird currentUserId verwendet.
 * @param {number} offset - Der Versatz für die Paginierung (Standard: 0).
 * @returns {Promise<any[]>} - Ein Array von Pin-Dokumenten, angereichert mit `liked` und `saved` Status.
 */
export async function getLikedPinsByUserId(limit = 20, currentUserId: string, profileUserId?: string, offset = 0): Promise<any[]> {
    try {
        // Bestimmen Sie den Benutzer, dessen gelikte Pins abgefragt werden sollen (Profileigentümer).
        const targetUserId = profileUserId ?? currentUserId;

        // 1. Abrufen der Verknüpfungsdokumente (Liked-Pins) anhand der Ziel-Benutzer-ID.
        const likedRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.likedPinsCollectionId,
            [
                Query.equal("userId", targetUserId),
                Query.select(["pinId"]), // Nur die Pin ID abrufen
                Query.limit(limit),
                Query.offset(offset)
            ]
        );

        const likedDocs = likedRes.documents;
        if (likedDocs.length === 0) {
            return [];
        }

        // Extrahieren der Pin IDs.
        const pinIds = likedDocs.map(doc => doc.pinId);

        // 2. Abrufen der eigentlichen Pin-Dokumente aus der Pin-Collection mittels der extrahierten IDs.
        const pinsRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            [Query.equal("$id", pinIds)] // Abfragen aller Pins in der Liste
        );

        const pinDocuments = pinsRes.documents;

        // 3. Anreicherung: Gleichzeitiges Abrufen der 'Liked' und 'Saved' IDs des Viewers (`currentUserId`).
        const [likedIds, savedIds] = await Promise.all([
            getLikedPinIds(currentUserId),
            getSavedPinIds(currentUserId),

        ]);

        const likedSet = new Set(likedIds);
        const savedSet = new Set(savedIds);

        // 4. Mappen und Anreichern der Pin-Objekte mit dem Status des Viewers.
        return pinDocuments.map(pin => ({
            ...pin,
            liked: likedSet.has(pin.$id),
            saved: savedSet.has(pin.$id),
        }));

    } catch (e) {
        console.error("Error fetching user liked pins:", e);
        return [];
    }
}

/**
 * Ruft alle Pins ab, die ein bestimmter Benutzer (targetUserId) gespeichert hat.
 *
 * Ähnlich wie `getLikedPinsByUserId` ermöglicht diese Funktion die Anzeige von
 * gespeicherten Pins im Profil eines anderen Benutzers und reichert sie mit dem
 * Like/Save-Status des Viewers (`currentUserId`) an.
 *
 * @param {number} limit - Die maximale Anzahl von Dokumenten für die Paginierung (Standard: 20).
 * @param {string} currentUserId - Aktueller User der Anwendung (Viewer)
 * @param {string} [profileUserId] - User des Userprofiles, wenn bei userProfile (optional)
 * @param {number} offset - Versatz für die Paginierung.
 * @returns {Promise<any[]>} - Array der Pin-Dokumente angereichert mit Like/Save-Status des Viewers.
 */
export async function getSavedPinsByUserId(limit = 20, currentUserId: string, profileUserId?: string, offset = 0) {
    try {
        // Setzen des targetUserId (Profilinhaber)
        const targetUserId = profileUserId ?? currentUserId;

        // 1. Holen der Verknüpfungsdokumente aus der 'savedPinsCollectionId'.
        const savedRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.savedPinsCollectionId,
            [
                Query.equal("userId", targetUserId),
                Query.select(["pinId"]),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );

        const savedDocs = savedRes.documents;
        if (savedDocs.length === 0) return [];


        // Extrahieren der Pin IDs.
        const pinIds = savedDocs.map(doc => doc.pinId);

        // 2. Holen der eigentlichen Pin-Dokumente.
        const pinsRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            [Query.equal("$id", pinIds)]
        )

        const pinDocuments = pinsRes.documents;

        // 3. Anreicherung mit Status des Viewers (`currentUserId`).
        const [likedIds, savedIds] = await Promise.all([
            getLikedPinIds(currentUserId),
            getSavedPinIds(currentUserId),
        ])

        const likedSet = new Set(likedIds);
        const savedSet = new Set(savedIds);

        // 4. Mappen und Anreichern der Pin-Objekte.
        return pinDocuments.map(pin => ({
            ...pin,
            liked: likedSet.has(pin.$id),
            saved: savedSet.has(pin.$id),
        }))

    } catch (e) {
        console.error("Error fetching user saved pins:", e);
        return [];
    }
}


/**
 * Ruft alle Pins ab, die von einem bestimmten Benutzer (`profileUserId`) erstellt wurden.
 *
 * Die Pins werden direkt über das `createdBy`-Attribut in der Pin-Collection abgefragt.
 * Anschließend werden sie mit dem Like/Save-Status des Viewers (`currentUserId`) angereichert.
 *
 * @param {number} limit - Die maximale Anzahl von Dokumenten für die Paginierung (Standard: 20).
 * @param {string} currentUserId - Aktueller User der Anwendung (Viewer)
 * @param {string} profileUserId - User des Userprofiles, dessen erstellte Pins angezeigt werden.
 * @param {number} offset - Versatz für die Paginierung.
 * @returns {Promise<any[]>} - Array der Pin-Dokumente angereichert mit Like/Save-Status des Viewers.
 */
export async function getCreatedPinsByUser(limit = 20, currentUserId: string, profileUserId?: string, offset = 0) {
    try {

        // Bestimmen des Zielbenutzers (Profilinhaber - entweder fremdes oder eigenes Profil).
        const targetUserId = profileUserId ?? currentUserId;

        // 1. Direkte Abfrage der Pin-Dokumente über das 'createdBy'-Attribut.
        const createdRes = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            [
                Query.equal("createdBy", targetUserId),
                Query.limit(limit),
                Query.offset(offset)
            ]
        )

        const createdDocs = createdRes.documents;
        if (createdDocs.length === 0) return [];

        const pinDocuments = createdRes.documents; // Tatsächliche Pins

        // 2. Anreicherung: Gleichzeitiges Abrufen der Status-IDs des Viewers.
        const [likedIds, savedIds] = await Promise.all([
            getLikedPinIds(currentUserId),
            getSavedPinIds(currentUserId),
        ])
        const likedSet = new Set(likedIds);
        const savedSet = new Set(savedIds);

        // 3. Mappen und Anreichern.
        return pinDocuments.map(pin => ({
            ...pin,
            liked: likedSet.has(pin.$id),
            saved: savedSet.has(pin.$id),
        }))

    } catch (e) {
        console.error("Error fetching user created pins:", e);
        return [];
    }

}


// --- Pin Merken/Speichern Aktionen ---

/**
 * Speichert einen Pin in der 'Saved Pins' Collection und erhöht den globalen Save-Zähler des Pins.
 *
 * Diese Funktion führt mehrere Appwrite-Operationen durch:
 * 1. Abrufen der aktuellen Benutzerinformationen.
 * 2. Prüfung auf Duplikate, um mehrfaches Speichern zu verhindern.
 * 3. Erstellung des Verknüpfungsdokuments in der `savedPinsCollectionId`.
 * 4. Atomares Hochzählen des `saves`-Attributs im Pin-Dokument (zweiter Datenbank-Update).
 *
 * @param {string} pinId - Die ID des Pins, der gespeichert werden soll.
 * @throws Wirft einen Fehler, wenn Appwrite-Operationen fehlschlagen.
 */
export async function savePin(pinId: string) {
    try {
        // Holen des Appwrite Account Objekts, um die $id zu erhalten.
        const user = await account.get();

        // Abrufen des User Document ID, das für die Appwrite Relationen benötigt wird.
        const userDoc = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", user.$id)]
        )

        // Duplikate prüfen: Vermeidung von unnötigen Operationen und Datenmüll.
        const existing = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.savedPinsCollectionId,
            [Query.equal("userId", user.$id), Query.equal("pinId", pinId)]
        );
        if (existing.total > 0) return;


        // 1. Erstellung des Verknüpfungsdokuments (Saved Pin).
        await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savedPinsCollectionId,
            ID.unique(),
            {
                userId: user.$id,
                pinId: pinId,
                pin: pinId, // Relationship zum Pin-Dokument (Appwrite Relationen)
                user: userDoc.documents[0].$id // Relationship zum User-Dokument
            }
        )

        // 2. Saves Counter erhöhen: Zuerst Pin abrufen, dann den Zähler aktualisieren.
        const pin = await database.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            pinId
        )

        await database.updateDocument(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, pinId, {
            saves: (pin.saves || 0) + 1,
        });

    } catch (e) {
        console.error("Error saving pin:", e);
        throw e;
    }
}

/**
 * Entfernt einen Pin aus der 'Saved Pins' Collection und dekrementiert den globalen Save-Zähler.
 *
 * @param {string} pinId - Die ID des Pins, der entfernt werden soll.
 * @throws Wirft einen Fehler, wenn Appwrite-Operationen fehlschlagen.
 */
export async function unsavePin (pinId: string) {
    try {
        const user = await account.get();
        // Suche nach dem existierenden Saved Pin-Dokument zur Löschung.
        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.savedPinsCollectionId,
            [Query.equal("userId", user.$id), Query.equal("pinId", pinId)]
        );
        if(documents.length) {
            // 1. Löschen des Verknüpfungsdokuments.
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.savedPinsCollectionId,
                documents[0].$id
            )


            // 2. Save Counter reduzieren (Atomares Update).
            const pin = await database.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.pinCollectionId,
                pinId
            )
            await database.updateDocument(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, pinId, {
                // Stellt sicher, dass der Zähler nicht negativ wird.
                saves: Math.max((pin.saves || 1) - 1, 0),
            });
        }
    } catch (e) {
        console.error("Error unsaving pin:", e);
        throw e;
    }
}

// --- Pin Liken Aktionen ---
/**
 * Fügt einen Like für einen Pin hinzu und erhöht den globalen Like-Zähler.
 *
 * Diese Funktion verwaltet die Like-Verknüpfungstabelle und den Zähler im Pin-Dokument.
 *
 * @param {string} pinId - Die ID des Pins, der geliket werden soll.
 * @throws Wirft einen Fehler, wenn Appwrite-Operationen fehlschlagen.
 */
export async function likePin(pinId: string) {
    try {
        const user = await account.get();

        // Abrufen des User Document ID für die Relationen.
        const userDoc = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", user.$id)]
        )

        // Duplikate verhindern (Idempotenz der Funktion sicherstellen).
        const existing = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.likedPinsCollectionId,
            [Query.equal("userId", user.$id), Query.equal("pinId", pinId)]
        );
        if (existing.total > 0) return;

        // 1. Like speichern: Erstellung des Verknüpfungsdokuments.
        await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.likedPinsCollectionId,
            ID.unique(),
            {
                userId: user.$id,
                pinId: pinId,
                pin: pinId,
                user: userDoc.documents[0].$id
            }
        );

        // 2. Like Counter erhöhen (Atomares Update).
        const pin = await database.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            pinId
        )
        await database.updateDocument(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, pinId, {
            likes: (pin.likes || 0) + 1,
        });

    } catch (e) {
        console.error("Error liking pin:", e);
        throw e;
    }
}

/**
 * Entfernt einen Like für einen Pin und reduziert den globalen Like-Zähler.
 *
 * @param {string} pinId - Die ID des Pins, für den der Like entfernt werden soll.
 * @throws Wirft einen Fehler, wenn Appwrite-Operationen fehlschlagen.
 */
export async function unlikePin(pinId: string) {
    try {
        const user = await account.get();
        // Suchen des Like-Dokuments zur Identifizierung der zu löschenden Entität.
        const { documents} = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.likedPinsCollectionId,
            [Query.equal("userId", user.$id), Query.equal("pinId", pinId)]
        )
        if (documents.length) {
            // 1. Like-Dokument löschen (Verknüpfung).
            await database.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.likedPinsCollectionId,
                documents[0].$id
            );

            // 2. Like Counter reduzieren (Atomares Update).
            const pin = await database.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.pinCollectionId,
                pinId
            )
            await database.updateDocument(appwriteConfig.databaseId, appwriteConfig.pinCollectionId, pinId, {
                // Stellt sicher, dass der Zähler nicht negativ wird.
                likes: Math.max((pin.likes || 1) - 1, 0),
            });
        }
    } catch (e) {
        console.error("Error unliking pin:", e);
        throw e;
    }
}