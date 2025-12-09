import {useLoaderData, Link, useOutletContext, useLocation, useNavigate} from "react-router";
import {account, appwriteConfig, database} from "../../../appwrite/client";
import { PinCard } from "../../../components";
import { Query } from "appwrite";
import {getExistingUser} from "../../../appwrite/auth";
import {useEffect, useState} from "react";
import {getLikedPinIds, getSavedPinIds} from "../../../appwrite/pinActions";

// Typdefinitionen für den übergeordneten Context
type OutletContextType = {
    user?: {
        $id: string;
        name: string;
        email: string;
        imageUrl?: string;
        accountId: string;
        avatar?: string;
    };
    searchTerm: string;
    setSearchTerm: (v: string) => void;
};

// Typdefinition für den Ersteller des Pins (Creator)
type User = {
    $id: string;
    name: string;
    email: string;
    accountId: string;
    avatar?: string;

};
// Typdefinition für den Pin selbst
type Pin = {
    $id: string,
    title: string,
    imageUrl: string,
    description: string,
    likes: number,
    tags?: string[],
    createdBy: string,
    $createdAt: string,
    username: string,
    liked: boolean,
    saved: boolean,
    totalLikes: number,
};

/**
 * Loader-Funktion für die React Router Route: Holt alle notwendigen Daten, bevor die Komponente gerendert wird.
 * @param {string} params Der URL-Parameter, enthält die Pin ID.
 */
export async function loader({ params }: { params: { id: string } }) {

    try {
        const pinId = params.id;

        // 1. Pin-Dokument abrufen
        const pin = await database.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.pinCollectionId,
            pinId
        );


        return pin;
    } catch (error) {
        console.error("Fehler beim Laden des Pins:", error);
        // Wirft eine Response mit Status 404, die vom Error Boundary abgefangen werden kann.
        throw new Response("Pin nicht gefunden", { status: 404 });
    }
}

// Definiert eine Palette freundlicher Pastellfarben für die Tags
const colorPalette = [
    { baseBg: "bg-blue-100", text: "text-blue-700", hoverBg: "hover:bg-blue-200" },
    { baseBg: "bg-emerald-100", text: "text-emerald-700", hoverBg: "hover:bg-emerald-200" },
    { baseBg: "bg-purple-100", text: "text-purple-700", hoverBg: "hover:bg-purple-200" },
    { baseBg: "bg-yellow-100", text: "text-yellow-700", hoverBg: "hover:bg-yellow-200" },
    { baseBg: "bg-pink-100", text: "text-pink-700", hoverBg: "hover:bg-pink-200" },
    { baseBg: "bg-indigo-100", text: "text-indigo-700", hoverBg: "hover:bg-indigo-200" },
];


/**
 * Hauptkomponente zur Anzeige der Pin-Details.
 */
export default function PinDetail() {
    // Hole den eingeloggten Benutzer und die Suchfunktion aus dem Layout-Context
    const { user: currentUser, setSearchTerm } = useOutletContext<OutletContextType>();

    const navigate = useNavigate();
    const loadedPin = useLoaderData() as Pin | undefined;
    const [pin, setPin] = useState<Pin | null>(loadedPin || null);
    // State für die Daten des Erstellers
    const [creator, setCreator] = useState<User | null>(null)


    // Funktion, die ausgeführt wird, wenn ein Tag angeklickt wird.
    const handleTagClick = (tag: string) => {
        if (setSearchTerm) {
            // Setze den Tag in die Suchleiste
            setSearchTerm(tag);
            // Navigiere zum Haupt-Feed, um die Suchergebnisse anzuzeigen.
            navigate("/feed");
        }
    };


    useEffect(() => {
        if (!pin && loadedPin) {
            setPin(loadedPin);
        }
    }, [loadedPin]);

    useEffect(() => {
        if (!pin || !currentUser) return;

        // Nur prüfen, wenn der Pin die Felder noch nicht hat
        if (pin.liked === undefined || pin.saved === undefined) {
            (async () => {
                try {
                    // Alle gelikten und gespeicherten IDs des Users laden (parallel)
                    const [likedIds, savedIds] = await Promise.all([
                        getLikedPinIds(currentUser.accountId),
                        getSavedPinIds(currentUser.accountId),
                    ]);

                    // Sets zur schnellen Prüfung
                    const likedSet = new Set(likedIds);
                    const savedSet = new Set(savedIds);

                    // Pin-State aktualisieren
                    setPin(prev => prev ? {
                        ...prev,
                        liked: likedSet.has(prev.$id),
                        saved: savedSet.has(prev.$id),
                    } : prev);

                } catch (err) {
                    console.error("Fehler beim Laden von Like/Save-Status:", err);
                }
            })();
        }
    }, [pin, currentUser]);

    // Effekt, um die Daten des Pin-Erstellers abzurufen (Pin-Creator)
    useEffect(() => {
        // Abbruch, wenn keine Pin-Daten oder keine User-Daten vorhanden sind (um Fehler beim getExistingUser zu vermeiden)
        if(!pin || !currentUser) return;

        // 1. Prüfen, ob der Ersteller der aktuelle Benutzer ist
        if (pin.createdBy === currentUser.accountId) {
            // Verwendung lokal vorhandener currentUser-Daten als Creator
            setCreator(currentUser);
            return;
        }

        // 2. Creator aus der Datenbank laden
        async function loadCreator() {
            try {
                if(!pin) return;
                // Pin.createdBy enthält die Account ID der userCollection des Erstellers
                const creatorDoc = await getExistingUser(pin.createdBy);

                if (creatorDoc) {
                    // Mappen der Appwrite-Antwort auf den lokalen User-Typ
                    const mappedCreator: User = {
                        $id: creatorDoc.$id,
                        name: creatorDoc.name,
                        email: creatorDoc.email,
                        accountId: creatorDoc.accountId,
                        avatar: creatorDoc.avatar
                    }
                    setCreator(mappedCreator);
                }

            } catch (e) {
                console.error("Fehler beim laden des Creator:", e);
            }
        }


        loadCreator();

    }, [pin, currentUser]);


    if (!pin) {
        return (
            <div className="flex items-center justify-center h-96 text-gray-500">
                Pin wird geladen oder konnte nicht gefunden werden.
            </div>
        );
    }

    return (
        // Äusserer Container: Für das Zentrieren und Platzhalter
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8">

                {/* Bild (Linke Spalte) */}
                <div className="flex-1">
                    <PinCard
                        id={pin.$id}
                        imageUrl={pin.imageUrl}
                        title={pin.title}
                        description={pin.description}
                        createdBy={pin.createdBy}
                        $createdAt={pin.$createdAt}
                        userName={pin.username || "Unbekannt"}
                        likes={pin.likes || 0}
                        liked={pin.liked || false}
                        saved={pin.saved || false}
                    />
                </div>

                {/* Details (Rechte Spalte) */}
                <div className="md:w-1/3 flex flex-col gap-4">
                    <h1 className="text-3xl font-extrabold text-gray-900">{pin.title}</h1>
                    <p className="text-gray-700 whitespace-pre-line text-lg">{pin.description}</p>

                    {pin.tags && pin.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                            {pin.tags.map((tag: string, index: number) => {
                                // Wählt eine Farbe zyklisch aus der Palette
                                const color = colorPalette[index % colorPalette.length];
                                const tagClasses = `${color.baseBg} ${color.text} ${color.hoverBg}`;

                                return (
                                    <span
                                        key={tag}
                                        onClick={() => handleTagClick(tag)} // Klick-Handler
                                        className={`px-4 py-1.5 text-sm font-semibold cursor-pointer select-none 
                                                   rounded-full transition duration-150 shadow-sm
                                                   ${tagClasses}`} // Dynamische Chip-Stile
                                    >
                                        #{tag}
                                    </span>
                                )
                            })}
                        </div>
                    )}

                    {/* Creator Info */}
                    <div className="mt-auto pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            Erstellt von:
                            {creator ? (
                                <Link
                                    to={`/user/${pin.createdBy}`}
                                    className="font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-2 group"
                                >
                                    <img
                                        src={creator.avatar || 'https://placehold.co/40x40/cccccc/333333?text=A'} // Avatar Fallback
                                        alt={creator.name}
                                        className="w-8 h-8 rounded-full object-cover transition group-hover:ring-2 ring-blue-300"
                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/cccccc/333333?text=N/A' }}
                                    />
                                    {creator?.name || 'Unbekannt'}
                                </Link>
                            ) : (
                                <span className="font-medium text-gray-500">User nicht gefunden</span>
                            )}
                        </p>
                        {pin.$createdAt && (
                            <p className="text-xs text-gray-500 mt-1">
                                Veröffentlicht: {new Date(pin.$createdAt).toLocaleDateString("de-DE")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}