import React, {useEffect, useState, useCallback, useRef} from 'react'
import * as Sentry from '@sentry/react';
import {useOutletContext} from "react-router";
// Import der Komponente für die Kachel-Ansicht (Masonry-Layout).
import {MasonryFeed} from "../../../components";
// Konstante für die Paginierung (Best Practice: Feste Seitengröße)
import {getPins, likePin, unlikePin} from "../../../appwrite/pinActions";


// Konstante für die Paginierung (Best Practice: Feste Seitengröße)
const PINS_PER_PAGE = 20;

// Typdefinition für den erwarteten Benutzer-Context aus dem Layout.
type userContext = {
    user?: {
        $id: string; // Appwrite Document ID des Benutzers (optional, falls ein Doc-ID existiert)
        accountId: string // Appwrite Account ID des Users aus user Collection
        name: string;
        email: string;
        avatar?: string;
    }
}
// Typdefinition für den erwarteten Suchbegriff-Context aus dem Layout/Header.
type searchTermContext = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}



/**
 * Die Feed-Komponente ist für das Laden, Anzeigen und Paginieren (Infinite Scroll)
 * aller Pins zuständig, basierend auf dem aktuellen Suchbegriff.
 */
export default function Feed(){
    // Abrufen des angemeldeten Benutzers vom übergeordneten Layout.
    const { user } = useOutletContext<userContext>();
    // Abrufen des aktuellen Suchbegriffs vom übergeordneten Layout (Header/Suche).
    const { searchTerm } = useOutletContext<searchTermContext>();

    // States für Pins und Pagination
    const [pins, setPins] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    // Gibt an, ob potenziell weitere Pins geladen werden können.
    const [hasMore, setHasMore] = useState(true);

    // States für Ladezustände
    // Initialer Ladezustand (wird beim ersten Laden und bei jeder neuen Suche auf true gesetzt).
    const [loading, setLoading] = useState(true);
    // Ladezustand für das Infinite Scroll (wird nur beim Anhängen neuer Seiten auf true gesetzt).
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Zustand zur Speicherung von API- oder Ladefehlern.
    const [error, setError] = useState<string | null>(null);

    /**
     * Lade Pins aus Appwrite mit Paginierung und Suchbegriff.
     * Nutzt useCallback, um die Funktion stabil zu halten, solange Abhängigkeiten sich nicht ändern.
     * @param {boolean} isLoadMore Gibt an, ob Pins angehängt (true) oder die Liste ersetzt werden soll (false).
     */
    const loadPins = useCallback(async (isLoadMore: boolean) => {
        // Die Appwrite Account ID des angemeldeten Benutzers (wird für Sicherheit/Filterung benötigt)
        const currentUserId = user?.accountId;

        // Berechnet, welche Seite geladen werden soll (1 bei neuer Suche/Initial-Load, ansonsten 'page').
        const pageToFetch = isLoadMore ? page : 1;
        // Berechnet den Offset für die Datenbankabfrage (z.B. Seite 2: Offset = 20).
        const offset = (pageToFetch - 1) * PINS_PER_PAGE;

        // Sicherheits-Check: Blockiert erneutes Laden, wenn bereits ein Ladevorgang (Infinite Scroll) läuft
        if (isLoadingMore) return;

        setError(null);
        // Setzt den korrekten Ladezustand, abhängig davon, ob es ein Initial-Load oder Infinite Scroll ist.
        isLoadMore ? setIsLoadingMore(true) : setLoading(true);

        try {
            // Führt die Datenbankabfrage durch.
            const fetchedPins = await getPins(PINS_PER_PAGE, searchTerm, offset, currentUserId);

            if (isLoadMore) {
                // Pins anhängen, wenn die Funktion durch Infinite Scroll aufgerufen wurde.
                setPins(prevPins => [...prevPins, ...fetchedPins]);
            } else {
                // Pins ersetzen (bei Initial-Load oder wenn der Suchbegriff geändert wurde).
                setPins(fetchedPins);
            }

            // Prüfen, ob noch mehr Pins verfügbar sind: Die Anzahl der geladenen Pins muss der Seitengröße entsprechen.
            const moreAvailable = fetchedPins.length === PINS_PER_PAGE;
            setHasMore(moreAvailable);
            // Inkrementiert die Seitenzahl für den nächsten Ladevorgang.
            setPage(pageToFetch + 1);

        } catch (e) {
            console.error("Fehler beim Laden der Pins:", e);
            setError("Fehler beim Laden der Pins. Bitte versuche es später erneut.");
            setPins([]);
            setHasMore(false);
        } finally {
            // Beendet den jeweiligen Ladezustand.
            isLoadMore ? setIsLoadingMore(false) : setLoading(false);
        }
    }, [page, searchTerm, isLoadingMore, user]);


    /**
     * Handler-Funktion, die an die MasonryFeed-Komponente übergeben wird.
     * Wird getriggert, wenn der Benutzer zum Ende der Seite scrollt.
     */
    const handleLoadMore = useCallback(() => {
        // Lädt nur, wenn noch Pins verfügbar sind UND gerade kein Ladevorgang läuft.
        if (hasMore && !isLoadingMore) {
            loadPins(true); // Ruft loadPins mit isLoadMore=true auf.
        }
    }, [hasMore, isLoadingMore, loadPins]);


    // useEffect für Initial-Load und Suchbegriff-Änderung
    useEffect(() => {
        // Bei Suchbegriff-Änderung oder User-Änderung (z.B. nach Login/Logout):
        // 1. States zurücksetzen, um einen neuen, sauberen Feed zu starten.
        setPins([]);
        setPage(1);
        setHasMore(true);

        // 2. Lade die erste Seite neu.
        loadPins(false);

    }, [searchTerm, user?.$id]); // Lädt bei jeder Änderung des Suchbegriffs oder der User ID neu


    // --- Ladezustände und Fehlerbehandlung (Volle Seite) ---

    // Initialer Ladezustand (wenn noch keine Pins im State sind)

    if (loading && pins.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xl text-gray-400">
                Lade Pins... <span className="animate-spin inline-block">🔄</span>
            </div>
        );
    }
    // Fehleranzeige
    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xl text-red-500">
                {error}
            </div>
        );
    }
    // Keine Ergebnisse bei aktiver Suche
    if (pins.length === 0 && searchTerm) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-300">Nichts gefunden.</h2>
                <p className="text-gray-500 mt-2">Versuche einen anderen Suchbegriff oder erstelle einen neuen Pin!</p>
            </div>
        );
    }
    // Keine Pins im System (erster Start)
    if (pins.length === 0 && !searchTerm) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-300">Willkommen auf Sharely!</h2>
                <p className="text-gray-500 mt-2">Es sind noch keine Pins vorhanden. Beginne damit, einen Pin zu erstellen!</p>
            </div>
        );
    }

    // --- Haupt-Feed-Anzeige ---
    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <MasonryFeed
                pins={pins}
                user={user}
                // Props für Infinite Scrolling
                onLoadMore={handleLoadMore} // Callback, wenn mehr geladen werden soll
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
            />
        </div>
    )
}
