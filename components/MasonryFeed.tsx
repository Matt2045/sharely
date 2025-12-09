import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import {PinCard} from "../components";

type masonryFeedProps = {
    pins: any[],
    user?: {
        $id: string;
        name: string;
        email: string;
        imageUrl?: string;
    }
    onLoadMore: () => void;
    isLoadingMore: boolean;
    hasMore: boolean;
}

/**
 * Stellt Pins in einem responsiven Masonry-Layout dar und implementiert Infinite Scrolling.
 */
const MasonryFeed = ({ pins, onLoadMore, isLoadingMore, hasMore, user }: masonryFeedProps) => {

    // useInView: Erstellt eine Ref (`ref`) für das Trigger-Element und liefert den Sichtbarkeitsstatus (`inView`).
    const { ref, inView } = useInView({
        // threshold: 0 bedeutet, dass der Callback ausgelöst wird, sobald 0% des Elements sichtbar sind.
        threshold: 0,
        // rootMargin: Löst das Event 200px VOR dem Erreichen des Viewports aus (Pre-loading).
        rootMargin: '200px',
    });

    // Effekt, der das Nachladen auslöst, wenn der Trigger sichtbar wird.
    useEffect(() => {
        // Logik: Löst onLoadMore aus, wenn:
        // 1. Der Trigger sichtbar ist (`inView`).
        // 2. KEINE Ladevorgänge laufen (`!isLoadingMore`).
        // 3. NOCH MEHR Daten verfügbar sind (`hasMore`).
        if (inView && !isLoadingMore && hasMore) {
            // Ruft die vom Parent bereitgestellte Ladefunktion auf.
            onLoadMore();
        }
    }, [inView, isLoadingMore, hasMore, onLoadMore]);


    return (
        <div className="pt-4 pb-12">
            {/* 1. Masonry Grid (CSS-Columns) */}
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
                {pins?.map((pin) => (
                    <div key={pin.$id} className="mb-4 break-inside-avoid">
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
                ))}
            </div>

            {/* 2. Scroll-Trigger und Ladeanzeige */}
            {(hasMore || isLoadingMore) && (
                <div
                    ref={ref}
                    className="flex justify-center items-center py-8"
                >
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-xl font-medium text-red-500">
                            Lade mehr Pins...
                            <span className="animate-spin inline-block">
                                🔄
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Ende der Ergebnisse */}
            {!hasMore && pins.length > 0 && (
                <div className="text-center text-gray-500 py-10">
                    Du hast das Ende des Feeds erreicht!
                </div>
            )}
        </div>
    );
}

export default MasonryFeed;
