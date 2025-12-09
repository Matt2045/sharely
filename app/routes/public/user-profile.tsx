import {useOutletContext, useParams} from "react-router";
import { useEffect, useState } from "react";
import {MasonryFeed} from "../../../components";
import {getCreatedPinsByUser, getLikedPinsByUserId, getSavedPinsByUserId} from "../../../appwrite/pinActions";
import {getExistingUser} from "../../../appwrite/auth";
import { Heart, PlusCircle, Bookmark } from "lucide-react"; // Icons for tabs

// Typisierung des Context-Objekts, das vom Outlet-Layout bereitgestellt wird.
type userContext = {
    // Enthält die Informationen des aktuell eingeloggten Benutzers.
    user: {
        $id: string;
        accountId: string;
        name: string;
        email: string;
        imageUrl?: string;
    }
    // 'currentUser' ist hier ein Alias für 'user' und wird für die Klarheit im Code verwendet.
    currentUser?: {
        $id: string;
        accountId: string;
        name: string;
        email: string;
        imageUrl?: string;
    }
}

// --- Hauptkomponente ---

export default function UserProfile() {
    // Extrahiert die User ID aus dem URL-Parameter (z.B. /user/:id). Dies ist die ID, deren Profil angezeigt wird.
    const { id } = useParams(); // userId
    // Holt den eingeloggten Benutzer (currentUser) aus dem übergeordneten Layout-Context.
    const {user: currentUser} = useOutletContext<userContext>();

    // Zustand für das Benutzerprofil, das gerade angezeigt wird (kann der eingeloggte User selbst oder ein Fremder sein)
    const [userProfile, setUserProfile] = useState<any>(null);
    // Zustände zum Speichern der Pins für die verschiedenen Tabs.
    const [pins, setPins] = useState<any[]>([]);
    const [likedPins, setLikedPins] = useState<any[]>([]);
    const [savedPins, setSavedPins] = useState<any[]>([]);
    // Zustand für den aktiven Tab (standardmäßig "created").
    const [activeTab, setActiveTab] = useState<"created" | "liked" | "saved">("created");
    // Ladezustand des gesamten Profils.
    const [isLoading, setIsLoading] = useState(true);

    // 1. useEffect: Laden der User-Daten für das angezeigte Profil
    // Abhängigkeiten: 'id' (URL-Parameter) und 'currentUser' (falls sich der eingeloggte User ändert).
    useEffect(() => {
        // Abbruch, wenn die ID nicht vorhanden ist.
        if (!id) return;

        const fetchUser = async () => {
            setIsLoading(true);
            try {
                // Prüfe: Ist das Profil, das wir anzeigen wollen, das des eingeloggten Benutzers?
                if (currentUser && currentUser.$id === id) {
                    // Wenn ja, verwende die bereits vorhandenen Context-Daten, um einen unnötigen Datenbank-Call zu vermeiden.
                    setUserProfile(currentUser);
                    setIsLoading(false); // Ladezustand beenden, da User bekannt
                    return;
                }

                // Wenn es ein fremdes Profil ist: User-Daten aus der Datenbank laden.
                const fetched = await getExistingUser(id);
                if (fetched) setUserProfile(fetched);
                else setUserProfile(null);
            } catch (error) {
                console.error("Failed to fetch userProfile:", error);
                setUserProfile(null);
            } finally {
                // Beendet den Ladevorgang, auch im Fehlerfall.
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [id, currentUser]);

    // 2. useEffect: Laden der Pins basierend auf dem User-Profil und dem aktiven Tab
    // Abhängigkeiten: 'userProfile' (muss zuerst geladen sein) und 'activeTab' (wechselt bei Klick).
    useEffect(() => {
        // Abbruch, falls das Profil noch lädt oder nicht gefunden wurde.
        if (!userProfile) return; // warte, bis userProfile geladen ist

        const fetchPins = async () => {
            let fetchedPins: any[] = [];

            try {
                if (activeTab === "created") {
                    // Lade alle vom User erstellten Pins.
                    fetchedPins = await getCreatedPinsByUser(20, userProfile.accountId);
                    setPins(fetchedPins);
                } else if (activeTab === "liked") {
                    // Lade alle vom User gelikten Pins.
                    fetchedPins = await getLikedPinsByUserId(20, currentUser?.accountId, userProfile.accountId);
                    console.log("Fetched Liked Pins:", fetchedPins);
                    setLikedPins(fetchedPins);
                } else if (activeTab === "saved") {
                    // Lade alle vom User gespeicherten Pins.
                    // Gespeicherte Pins sind private Daten, daher ist dieser Tab nur für den Inhaber sichtbar
                    fetchedPins = await getSavedPinsByUserId(20, userProfile.accountId);
                    setSavedPins(fetchedPins);
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} pins:`, error);
            }
        };

        fetchPins();
    }, [userProfile, activeTab]); // Führt bei jedem Tab-Wechsel oder Profil-Wechsel neu aus.


    // Wählt die anzuzeigenden Pins basierend auf dem aktiven Tab.
    const displayedPins =
        activeTab === "created" ? pins : activeTab === "liked" ? likedPins : savedPins;

    // --- Rendern des Ladezustands und des Fehlerzustands ---
    if (isLoading) {
        return <div className="text-center py-20 text-xl text-gray-400">Lade Profil...</div>
    }

    if (!userProfile && !isLoading) {
        return <div className="text-center py-20 text-xl text-red-500">Benutzer nicht gefunden.</div>
    }

    // Hilfsvariable, um festzustellen, ob der eingeloggte Benutzer das angezeigte Profil ist
    const isOwner = currentUser && currentUser.$id === userProfile.$id;

    // --- Haupt-Render-Block des Profils ---
    return (
        <div className="max-w-7xl mx-auto px-4 py-10">

            {/* 1. Header Sektion: Avatar und Name */}
            <div className="flex flex-col items-center text-center mb-12">
                <img
                    src={userProfile.avatar || 'https://placehold.co/128x128/333333/ffffff?text=U'}
                    alt={userProfile.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-red-500 shadow-xl transition-all duration-300 hover:scale-105"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/128x128/333333/ffffff?text=U' }}
                />
                <h2 className="text-4xl font-extrabold mt-6 text-white">{userProfile.name}</h2>
                <p className="text-gray-400 text-lg mt-1">{userProfile.email}</p>
            </div>

            {/* 2. Tabs für Pin-Kategorien (Modernes Design) */}
            <div className="flex justify-center border-b border-gray-700 mb-8">

                {/* Eigene Pins */}
                <button
                    onClick={() => setActiveTab("created")}
                    className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition duration-300 
                        ${activeTab === "created"
                        ? "text-red-500 border-b-4 border-red-500"
                        : "text-gray-400 hover:text-white"
                    }`}
                >
                    <PlusCircle className="w-5 h-5" />
                    Erstellt
                </button>

                {/* Gelikte Pins */}
                <button
                    onClick={() => setActiveTab("liked")}
                    className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition duration-300 
                        ${activeTab === "liked"
                        ? "text-red-500 border-b-4 border-red-500"
                        : "text-gray-400 hover:text-white"
                    }`}
                >
                    <Heart className="w-5 h-5" />
                    Gelikt
                </button>

                {/* Gemerkte Pins (nur für den Eigentümer sichtbar) */}
                {isOwner && (
                    <button
                        onClick={() => setActiveTab("saved")}
                        className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition duration-300 
                            ${activeTab === "saved"
                            ? "text-red-500 border-b-4 border-red-500"
                            : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <Bookmark className="w-5 h-5" />
                        Gemerkt
                    </button>
                )}
            </div>

            {/* 3. Pins anzeigen */}
            {displayedPins.length > 0 ? (
                <MasonryFeed
                    pins={displayedPins}
                    user={userProfile}
                    onLoadMore={() => console.log("Infinite Scrolling ist nicht implementiert auf UserProfile")}
                    hasMore={false}
                    isLoadingMore={false}
                />
            ) : (
                <div className="text-center py-20 text-xl text-gray-500">
                    Dieser Benutzer hat noch keine {activeTab === "created" ? "Pins erstellt" : activeTab === "liked" ? "Pins gelikt" : "Pins gemerkt"}.
                </div>
            )}
        </div>
    );
}
