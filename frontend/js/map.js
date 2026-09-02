let map = null;

function initMap() {
    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }

    if (map) {
        try {
            const oldContainer =
                map.getContainer();

            if (oldContainer !== mapElement) {
                map.remove();
                map = null;
            } else {
                setTimeout(() => {
                    if (map) {
                        map.invalidateSize();
                    }
                }, 100);

                if (
                    typeof initMapViewportLoading === "function"
                ) {
                    initMapViewportLoading();
                }

                return;
            }
        } catch (error) {
            console.warn(
                "Usuwanie starej mapy:",
                error
            );

            map = null;
        }
    }

    map = L.map("map", {
        zoomControl: true
    }).setView(
        [51.1079, 17.0385],
        8
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

    /*
     * Leaflet musi najpierw dostać prawidłowy
     * rozmiar kontenera.
     */
    setTimeout(() => {
        if (!map) {
            return;
        }

        map.invalidateSize();

        /*
         * Dopiero teraz pobieramy zlecenia
         * z aktualnego obszaru.
         */
        if (
            typeof initMapViewportLoading === "function"
        ) {
            initMapViewportLoading();
        }
    }, 300);
}

function showTaskOnMap(task) {
    if (
        !task ||
        task.lat == null ||
        task.lng == null
    ) {
        console.warn(
            "Zlecenie nie ma współrzędnych:",
            task
        );
        return;
    }

    if (!map) {
        initMap();
    }

    setTimeout(() => {
        if (!map) {
            return;
        }

        const lat = Number(task.lat);
        const lng = Number(task.lng);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return;
        }

        map.invalidateSize();

        map.setView(
            [lat, lng],
            Math.max(map.getZoom(), 14),
            {
                animate: false
            }
        );
    }, 300);
}
