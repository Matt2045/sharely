import CreatePin from "../../../components/CreatePin";


// Die loader-Funktion kann hier leer bleiben
export async function loader() {
    return null;
}


/**
 * Seite für das Erstellen und Hochladen eines neuen Pins.
 * Verwendet die CreatePin-Komponente, um das Formular anzuzeigen.
 *
 */

export default function SharePin(){


    return (
        <div className="pt-8">
            {/* 1. Bereich für das Pin-Erstellungsformular*/}
            <div className="flex justify-center mb-10 px-4">
                <div className="w-full max-w-xl bg-gray-900 shadow-2xl rounded-xl p-8">
                    <CreatePin />
                </div>
            </div>
        </div>
    );
};
