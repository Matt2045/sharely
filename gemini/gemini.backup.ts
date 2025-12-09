
    import { GoogleGenerativeAI} from "@google/generative-ai";
    import {appwriteConfig} from "../appwrite/client";
    import {serverConfig} from "~/config/server.config";

    // Erzeugt eine neue GoogleGenerativeAI-Instanz, die für alle API-Aufrufe verwendet wird.
    // Der API-Schlüssel wird aus der globalen Appwrite-Konfiguration gelesen.
    const genAI = new GoogleGenerativeAI(serverConfig.gemini.apiKey);

    /**
     * Generiert Pin-Metadaten (Titel, Beschreibung, Tags) basierend auf einem hochgeladenen Bild.
     *
     * @param file - Das File-Objekt (das hochgeladene Bild).
     * @returns Ein Promise, das mit dem geparsten JSON-Objekt der Metadaten aufgelöst wird.
     */
    export async function generatePinMetadata(file: File) {


        // Wählt das Modell aus. "gemini-2.5-flash" ist ideal für schnelle Bildanalyse
        // und das Generieren von strukturierten JSON-Antworten.
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});

        // Konvertiert die hochgeladene Datei (Image) in einen Base64-String,
        // der für die Gemini-API als Inline-Daten benötigt wird.
    const dataBase64 = await fileToBase64(file);

        // Der System-Prompt, der die Anweisung an das Modell enthält.
    const prompt = `
    Analyse this image and generate a JSON object with the following properties:
    { 
    title (maximum 32 characters): A short and pleasing title that summarizes the image 
    description (maximum 1000 characters): A detailed description including main subjects, setting, and any notable actions or objects.
    an array of tags in lowercase that describe the image (max 12): ["tag1", "tag2", "tag3"]
    }
    Answer ONLY in JSON format.
    `;

        // Führt den API-Aufruf an das Gemini-Modell durch.
    const result = await model.generateContent([
        { text: prompt}, // Der Text-Prompt (die Anweisung)
        {
            // Die Inline-Bilddaten, bestehend aus MimeType und Base64-String
            inlineData: {
                mimeType: file.type,
                data: dataBase64,
            },
        }
    ]);

        // Rohantwort des Modells (kann ```json enthalten)
    const text = result.response.text();

        // Text bereinigt von JSON-Struktur
    const cleanedText = cleanJsonResponse(text);

        // Parsen der bereinigten JSON-Zeichenkette in ein JavaScript-Objekt
    return JSON.parse(cleanedText);
}

    /**
     * Bereinigt die JSON-Antwort, da Modelle manchmal zusätzliche Markdown-Code-Blöcke
     * (wie ```json ... ```) zur Formatierung hinzufügen.
     *
     * @param text - Die Rohantwort des Gemini-Modells.
     * @returns Die bereinigte JSON-Zeichenkette.
     */
    function cleanJsonResponse(text: string) {
        // Falls Gemini mit ```json anfängt oder ``` am Ende hat → wegtrimmen
        return text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
    }

    /**
     * Hilfsfunktion zur Konvertierung eines File-Objekts in einen Base64-String.
     *
     * @param file - Das File-Objekt (z.B. ein Bild).
     * @returns Ein Promise, das mit dem Base64-String der Datei aufgelöst wird.
     */
    function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file); // liest die Datei als Data URL
            reader.onload = () => {
                // Ergebnis sieht so aus: "data:image/jpeg;base64,/9j/4AAQSk..."
                const base64 = (reader.result as string).split(",")[1]; // nur Base64-Teil nehmen
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    }
