import React, { useState, useRef, useCallback } from 'react';
import { uploadImage } from "../appwrite/auth";
import { useNavigate } from "react-router";
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';


/**
 * Kernkomponente zur Erstellung eines Pins.
 * Sie verwaltet die Bildauswahl (Click/Drag & Drop) und startet den Upload-Prozess,
 * bei dem die KI (Gemini) die Metadaten generiert.
 */

const CreatePin = () => {

    // Zustand zur Speicherung der ausgewählten Datei (File-Objekt).
    const [imageFile, setImageFile] = useState<File | null>(null);
    // Zustand, der den Ladevorgang (während Upload und KI-Analyse) steuert.
    const [isLoading, setIsLoading] = useState(false);
    // Zustand für Fehlermeldungen (z.B. wenn kein Bild ausgewählt ist).
    const [error, setError] = useState<string | null>(null);
    // Zustand für Erfolgsmeldungen nach abgeschlossenem Upload.
    const [success, setSuccess] = useState<string | null>(null);

    // Hook zur programmatischen Navigation nach erfolgreichem Upload.
    const navigate = useNavigate();
    // Ref-Objekt, um auf das versteckte native <input type="file"> Element zuzugreifen.
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Öffnet den nativen Dateiauswahldialog, wenn der Benutzer auf den Upload-Bereich klickt.
     */
    const handleUploadAreaClick = () => {
        // Stellt sicher, dass das Feld existiert und gerade kein Upload läuft.
        if (!isLoading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    /**
     * Verarbeitet die Dateiauswahl über den nativen Dateidialog.
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Prüft, ob Dateien ausgewählt wurden und nimmt die erste Datei.
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    /**
     * Verarbeitet das Ablegen (Drop) einer Datei im Upload-Bereich (Drag & Drop).
     */
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Prüft die übertragenen Dateien und setzt die erste als 'imageFile'.
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setImageFile(e.dataTransfer.files[0]);
        }
    }, []);

    /**
     * Verhindert das Standardverhalten des Browsers beim Überziehen (Drag Over),
     * damit die Datei abgelegt werden kann.
     */
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Zeigt dem Benutzer, dass die Datei kopiert werden kann.
        e.dataTransfer.dropEffect = 'copy';
    }, []);


    /**
     * Hauptlogik zum Senden des Pins an den Server und Starten der KI-Analyse.
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validierung: Es muss ein Bild ausgewählt sein.
        if (!imageFile) {
            setError('Bitte wähle zuerst ein Bild aus.');
            return;
        }
        // Setzt den Ladezustand und entfernt alte Statusmeldungen.
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Aufruf der Upload-Funktion. Wir übergeben nur die Bilddatei.
            // Titel, Beschreibung und Tags sind leer, da diese von der KI generiert werden.
            const created = await uploadImage({
                title: '',
                description: '',
                tags: '',
                imageFile: imageFile,
            });

            // Bei Erfolg: Feedback und State zurücksetzen.
            console.log('Dein Pin wurde erfolgreich erstellt!', created);
            setSuccess('Dein Pin wurde erfolgreich erstellt!');

            // Formular-State zurücksetzen
            setImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // File Input zurücksetzen, falls nötig
            }

            // Navigation zur Detailseite des neu erstellten Pins.
            navigate(`/pin/${created.$id}`);

        } catch (e) {
            // Fehlerbehandlung
            console.log(e, 'Fehler beim Erstellen des Pins:');
            const msg = e instanceof Error ? e.message : 'Fehler beim Erstellen des Pins.';
            setError(msg);
        } finally {
            // Unabhängig vom Ergebnis wird der Ladezustand beendet.
            setIsLoading(false);
        }
    };

    /**
     * Hilfsfunktion zum Rendern des Upload-Bereichs (Standard-Ansicht oder Bild ausgewählt).
     */
    const renderUploadArea = () => (
        <div
            // Tailwind-Klassen für Styling, Übergänge, Drag & Drop Handler und Klick-Funktionalität.
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition h-96 
                        ${imageFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onClick={handleUploadAreaClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* Das native File Input ist versteckt, wird aber durch Klick auf das Div getriggert. */}
            <input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {imageFile ? (
                // Ansicht, wenn ein Bild ausgewählt ist (zeigt Dateinamen).
                <div className="text-center">
                    <ImageIcon className="w-10 h-10 text-green-500 mb-2 mx-auto" />
                    <p className="font-semibold text-gray-700">{imageFile.name}</p>
                    <p className="text-sm text-gray-500 mt-4">Klicke, um ein anderes Bild zu wählen.</p>
                </div>
            ) : (
                // Anfängliche Ansicht (Aufforderung zum Upload).
                <div className="text-center text-gray-500">
                    <Upload className="w-12 h-12 mb-4 mx-auto" />
                    <p className="font-semibold">Klicke oder ziehe dein Bild hierher</p>
                    <p className="text-sm mt-2">Unterstützte Formate: JPG, PNG, GIF</p>
                </div>
            )}
        </div>
    );

    /**
     * Hilfsfunktion zum Rendern des Ladezustands, während die KI die Metadaten generiert.
     */
    const renderLoadingState = () => (
        <div className="flex flex-col items-center justify-center p-8 h-96 bg-blue-50 rounded-lg text-center">
            {/* Ladeanimation: Spinner mit Pulswirkung */}
            <div className="relative">
                {/* Ping-Effekt simuliert KI-Aktivität/Verarbeitung */}
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <div className="absolute inset-0 bg-blue-600 rounded-full opacity-30 animate-ping duration-1000" />
            </div>

            <h3 className="text-xl font-bold text-blue-700 mt-6 mb-2">Pin wird erstellt...</h3>
            <p className="text-md text-blue-600 max-w-xs">
                Gemini analysiert das Bild, generiert Titel, Beschreibung und Tags.
            </p>
            <p className="text-xs text-gray-500 mt-4">Bitte warte einen Moment, bis die KI-Analyse abgeschlossen ist.</p>
        </div>
    );

    // --- MAIN RENDER ---

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-2xl rounded-2xl border border-gray-100">

            {/* CTA/Header */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                    Share what moves you...
                </h1>
                <p className="text-md text-gray-500 mt-2">
                    Lade ein Bild hoch. Gemini erstellt automatisch alle Details für deinen Pin.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {isLoading ? (
                    // Zeigt den Ladezustand, wenn der Upload läuft.
                    renderLoadingState()
                ) : (
                    <>
                        {/* Zeigt den Upload-Bereich, wenn kein Upload läuft. */}
                        {renderUploadArea()}

                        {/* Submit Button */}
                        <div className="mt-6">
                            <button
                                type="submit"
                                // Deaktiviert den Button, wenn kein Bild ausgewählt oder wenn geladen wird.
                                disabled={!imageFile || isLoading}
                                className={`w-full py-3 rounded-xl font-semibold transition shadow-lg transform hover:scale-[1.01] ${
                                    imageFile && !isLoading
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Pin erstellen &amp; veröffentlichen
                            </button>
                        </div>
                    </>
                )}
            </form>

            {/* Statusmeldungen für Fehler und Erfolg */}
            {error && <p className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</p>}
            {success && <p className="text-green-600 text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200">{success}</p>}
        </div>
    );
};

export default CreatePin;
