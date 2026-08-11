let map = null;

function initMap() {

    const mapElement = document.getElementById("map");

    if (!mapElement) {
        return;
    }


    // Jeżeli istnieje stara mapa,
    // ale należy do starego elementu HTML,
    // usuwamy ją i tworzymy nową.
    if (map) {

        try {

            const oldContainer = map.getContainer();

            if (oldContainer !== mapElement) {

                map.remove();

                map = null;

            } else {

                setTimeout(() => {

                    map.invalidateSize();

                }, 300);

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


    // Tworzymy nową mapę

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


    // Bardzo ważne przy dynamicznym przełączaniu stron

    setTimeout(() => {

        if (map) {
            map.invalidateSize();
        }

    }, 300);

}


// =====================================
// POKAŻ KONKRETNE ZLECENIE NA MAPIE
// =====================================

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


    // Jeżeli mapa jeszcze nie istnieje,
    // utwórz ją.

    if (!map) {
        initMap();
    }


    setTimeout(() => {

        if (!map) {
            return;
        }


        map.invalidateSize();


        map.setView(
            [
                Number(task.lat),
                Number(task.lng)
            ],
            15
        );


    }, 400);

}