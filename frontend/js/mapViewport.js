let mapViewportTimer = null;
let mapViewportRequest = 0;
let mapViewportController = null;

async function loadMapTasksInViewport() {
    if (typeof map === "undefined" || !map) {
        return;
    }

    const zoom = map.getZoom();
    const bounds = map.getBounds();

    const statusSelect =
        document.getElementById("statusFilter");

    let selectedStatus =
        statusSelect
            ? statusSelect.value
            : "__ACTIVE__";

    let statusKey = "";

    if (selectedStatus === "Otwarte") {
        statusKey = "OPEN";
    } else if (selectedStatus === "__ACTIVE__") {
        statusKey = "__ACTIVE__";
    } else if (
        selectedStatus === "Wszystkie" ||
        selectedStatus === ""
    ) {
        statusKey = "";
    } else {
        statusKey = selectedStatus;
    }

    const params = new URLSearchParams({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        statusKey
    });

    const requestId =
        ++mapViewportRequest;

    if (mapViewportController) {
        mapViewportController.abort();
    }

    mapViewportController =
        new AbortController();

    try {
        const response =
            await fetch(
                `/map-tasks?${params.toString()}`,
                {
                    signal:
                        mapViewportController.signal
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const tasks =
            await response.json();

        if (
            requestId !== mapViewportRequest
        ) {
            return;
        }

        window.currentMapTasks =
            Array.isArray(tasks)
                ? tasks
                : [];

        if (
            typeof drawTasks === "function"
        ) {
            drawTasks(
                window.currentMapTasks
            );
        }

        const counter =
            document.getElementById(
                "mapTaskCount"
            );

        if (counter) {
            counter.textContent =
                `${window.currentMapTasks.length} zleceń w tym obszarze`;
        }

    } catch (error) {
        if (
            error &&
            error.name === "AbortError"
        ) {
            return;
        }

        console.error(
            "Błąd pobierania zleceń dla mapy:",
            error
        );
    }
}

function scheduleMapViewportLoad() {
    clearTimeout(
        mapViewportTimer
    );

    mapViewportTimer =
        setTimeout(() => {
            loadMapTasksInViewport();
        }, 350);
}

function initMapViewportLoading() {
    if (
        typeof map === "undefined" ||
        !map
    ) {
        return;
    }

    if (
        map._viewportLoadingInitialized
    ) {
        // Mapa już ma aktywny mechanizm.
        // Wymuszamy jednak natychmiastowe
        // pierwsze pobranie.
        scheduleMapViewportLoad();
        return;
    }

    map._viewportLoadingInitialized =
        true;

    /*
     * Reagujemy dopiero po zakończeniu
     * przesuwania / zoomowania.
     */
    map.on(
        "moveend",
        scheduleMapViewportLoad
    );

    /*
     * Pierwsze pobranie po pełnej
     * inicjalizacji Leafleta.
     */
    map.whenReady(() => {
        setTimeout(() => {
            loadMapTasksInViewport();
        }, 500);
    });
}
