import { logout } from "../appwrite/auth"; // Pfad beibehalten, wie vom Benutzer gewünscht
import { LogOut, Plus, X } from "lucide-react"; // X (Close/Clear) Icon importieren
import React from "react";
import {Link, useNavigate, useLocation} from "react-router";

type SearchBarProps = {
    user?: {
        $id: string;
        name: string;
        email: string;
        avatar?: string;
    }
    searchTerm: string;
    setSearchTerm: (value: string) => void;
};

/**
 * Komponente für die SearchBar mit Navigation (Pin erstellen, Profil, Logout).
 */
export default function SearchBar({searchTerm, setSearchTerm, user}: SearchBarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);

        // Navigation zur Hauptseite, wenn man von einer Unterseite sucht
        if (location.pathname !== "/feed") {
            navigate("/feed");
        }
    };

    /**
     * Setzt den Suchbegriff auf einen leeren String zurück.
     */
    const handleClearSearch = () => {
        setSearchTerm("");
    };

    return (
        <div className="flex items-center justify-between px-6 py-3">

            {/* 1. Logo */}
            <Link to={`/feed`} className="block pr-4">
                <div className="text-2xl font-extrabold text-red-500">Sharely</div>
            </Link>

            {/* 2. Suchleiste Container */}
            <div className="flex-1 mx-4 max-w-xl relative">

                <input
                    type="text"
                    placeholder="Woran denkst du gerade?"
                    value={searchTerm}
                    onChange={handleChange}
                    className="w-full pl-4 py-2 text-white bg-gray-700 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400 transition pr-10"
                />

                {/* Löschen-Button (X) */}
                {searchTerm.length > 0 && (
                    <button
                        onClick={handleClearSearch}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2
                                   h-full px-3 text-gray-400 hover:text-white transition
                                   rounded-r-full" // Sorgt für saubere Abdeckung am Rand
                        title="Suchbegriff löschen"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 3. User Aktionen (Create Pin, Profil, Logout) */}
            <div className="flex items-center gap-4 pl-4">

                <button
                    onClick={() => navigate(`/share-pin`)}
                    className="flex items-center justify-center
                               w-12 h-12 rounded-full

                               bg-gradient-to-br from-red-600 to-red-800
                               text-white shadow-2xl shadow-red-900/70

                               hover:from-red-500 hover:to-red-700
                               transition transform duration-200 hover:scale-105 active:scale-95
                               border-2 border-red-400"
                    title="Pin erstellen"
                >

                    <Plus className="w-7 h-7 text-white" strokeWidth={3} />
                </button>


                {user && (
                    /* User Profil Avatar*/
                    <div
                        className="flex items-center gap-3 cursor-pointer p-1 rounded-full
                                   transition transform duration-200 hover:scale-105 active:scale-95
                                   hover:bg-gray-700"
                        onClick={() => navigate(`/user/${user.$id}`)}
                        title={`Zum Profil von ${user.name}`}
                    >
                        <img
                            src={user.avatar || `https://placehold.co/40x40/999999/ffffff?text=${user.name.charAt(0)}`}
                            alt={user.name.charAt(0)}
                            className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-red-500"
                            onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/999999/ffffff?text=${user.name.charAt(0)}` }}
                        />
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-gray-700 transition"
                    title="Logout"
                >
                    <LogOut className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    );
}