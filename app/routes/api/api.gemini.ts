
// app/routes/api/api.gemini.ts
import { type ActionFunctionArgs } from 'react-router';
import { serverConfig } from '~/config/server.config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function action({ request }: ActionFunctionArgs) {
    try {
        console.log('Gemini API Route aufgerufen');

        // API Key validieren
        let apiKey: string;
        try {
            apiKey = serverConfig.gemini.apiKey;
            console.log('Gemini API Key erfolgreich geladen');
        } catch (keyError) {
            console.error('Fehler beim Laden des API Keys:', keyError);
            return Response.json(
                { error: 'Server-Konfigurationsfehler: API Key nicht verfügbar' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const body = await request.json();
        const { imageData, mimeType } = body;

        if (!imageData || !mimeType) {
            return Response.json(
                { error: 'imageData and mimeType are required' },
                { status: 400 }
            );
        }

        console.log('Sende Anfrage an Gemini API...');

        const prompt = `
Analyse this image and generate a JSON object with the following properties:
{ 
  title (maximum 32 characters): A short and pleasing title that summarizes the image 
  description (maximum 1000 characters): A detailed description including main subjects, setting, and any notable actions or objects.
  tags: an array of tags in lowercase that describe the image (max 12): ["tag1", "tag2", "tag3"]
}
Answer ONLY in JSON format.
        `;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageData,
                },
            }
        ]);

        console.log('Gemini API Antwort erhalten');

        const text = result.response.text();
        const cleanedText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const metadata = JSON.parse(cleanedText);

        console.log('Metadaten erfolgreich generiert:', metadata);

        return Response.json({ metadata });

    } catch (error) {
        console.error('Gemini API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : '';

        console.error('Error details:', {
            message,
            stack,
            name: error instanceof Error ? error.name : 'Unknown'
        });

        return Response.json(
            { error: 'Failed to generate metadata: ' + message },
            { status: 500 }
        );
    }
}