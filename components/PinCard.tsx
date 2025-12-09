import { Link } from "react-router";
import React, {useState, useEffect} from "react";
import { Heart, Bookmark} from "lucide-react"
import {likePin, savePin, unlikePin, unsavePin} from "../appwrite/pinActions";


/**
 * Komponente für die Pins mit Funktionalitäten (Like/Unlike, Merken/Entfernen).
 */
export default function PinCard(pin: { imageUrl: string, title: string, description: string, createdBy: string, userName: string, id: string, liked: boolean, saved: boolean, likes: number,  $createdAt: string, }) {
    // Lokaler State für den Like-Status, initialisiert durch die Props.
    const [isLiked, setIsLiked] = useState(pin.liked || false);
    // Lokaler State für den Save-Status, initialisiert durch die Props.
    const [isSaved, setIsSaved] = useState(pin.saved || false);
    // Lokaler State für die Anzahl der Likes.
    const [likeCount, setLikeCount] = useState(pin.likes || 0);

    // Diese Effekte stellen sicher, dass, wenn der Pin von außen aktualisiert wird, der lokale UI-Zustand überschrieben wird.

    useEffect(() => {
        setIsLiked(pin.liked || false);
    }, [pin.liked]);

    useEffect(() => {
        setIsSaved(pin.saved || false);
    }, [pin.saved]);

    useEffect(() => {
        setLikeCount(pin.likes || 0);
    }, [pin.likes]);


    /**
     * Behandelt das Liken/Unliken eines Pins. Nutzt optimistische UI-Updates.
     */
    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Verhindert, dass der Klick die Link-Navigation auslöst.

        // Zustand sofort ändern, um schnelle Reaktion zu zeigen.
        const newLikedState = !isLiked;
        const newLikeCount = newLikedState ? likeCount + 1 : (likeCount > 0 ? likeCount - 1 : 0);

        setIsLiked(newLikedState);
        setLikeCount(newLikeCount);


        try {
            // Appwrite API Call: Echte Zustandsänderung im Backend vornehmen.
            if (newLikedState) {
                await likePin(pin.id);
            } else {
                await unlikePin(pin.id);
            }
        } catch (e) {
            console.error("Fehler beim Liken/Unliken:", e);

            ///Rollback: Bei einem Fehler muss der lokale Zustand zurückgesetzt werden.
            setIsLiked(!newLikedState);
            setLikeCount(newLikedState ? newLikeCount - 1 : newLikeCount + 1);
        }
    };

    /**
     * Behandelt das Speichern/Entfernen eines Pins. Nutzt optimistische UI-Updates.
     */
    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Verhindert, dass der Klick die Link-Navigation auslöst

        // Zustand sofort ändern, um schnelle Reaktion zu zeigen
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);

        try {
            // Appwrite API Call: Echte Zustandsänderung im Backend vornehmen.
            if(newSavedState) {
                await savePin(pin.id);
            } else {
                await unsavePin(pin.id);
            }

        } catch (e) {
            console.error("Fehler beim Speichern/Entfernen:", e);
            ///Rollback: Bei einem Fehler muss der lokale Zustand zurückgesetzt werden.
            setIsSaved(!newSavedState);
        }
    }

    // --- Rendering der Pin-Karte ---
    return (
        <Link
            to={`/pin/${pin.id}`}
              className="block">
            <div className="relative rounded-xl overflow-hidden shadow-2xl transition duration-300 group hover:shadow-red-500/50">

                {/* Pin Bild */}
                <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    className="w-full object-cover rounded-xl transition duration-300 group-hover:opacity-95"
                />

                <div className={`
                    absolute top-2 right-2 flex items-center gap-2 transition duration-300
                    opacity-100 translate-y-0
                    md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0
                    md:translate-y-[-10px] // Startet etwas höher und bewegt sich beim Hover rein
                `}>

                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`p-1.5 rounded-full backdrop-blur-md bg-white/20 transition hover:bg-white/40 shadow-lg ${isLiked ? 'text-red-500' : 'text-white'}`}
                        aria-label={isLiked ? "Unlike Pin" : "Like Pin"}
                    >
                        <Heart
                            size={18}
                            className={`${isLiked ? "fill-red-500" : "fill-transparent"}`}
                        />
                    </button>

                    {/* Merken/Speichern Button */}
                    <button
                        onClick={handleSave}
                        className={`p-1.5 rounded-full backdrop-blur-md transition shadow-lg ${
                            isSaved
                                ? "bg-red-500 text-white hover:bg-red-600" 
                                : "bg-white/20 text-white hover:bg-white/40" 
                        }`}
                        aria-label={isSaved ? "Unsave Pin" : "Save Pin"}
                    >
                        <Bookmark size={18} className={`${isSaved ? "fill-white" : "fill-transparent"}`} />
                    </button>
                </div>



                <div className={`
                    absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 transition duration-300 opacity-100 translate-y-0 
                    md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0
                    md:translate-y-[10px] // Startet etwas tiefer und bewegt sich beim Hover rein
                `}>
                    <h3 className="text-white text-base font-bold truncate transition duration-300 group-hover:text-red-400">
                        {pin.title}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-300 text-xs font-medium truncate">
                            {pin.userName}
                        </span>
                        {/* Like Count */}
                        <div className="flex items-center gap-0.5 text-gray-300 text-xs font-semibold">
                            <Heart size={12} className="fill-red-500 text-red-500" />
                            <span>{likeCount}</span>
                        </div>
                    </div>
                </div>

            </div>
        </Link>
    );
}
