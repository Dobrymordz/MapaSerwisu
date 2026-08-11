let syncingTasks = false;

// =====================================
// WYKONANIE SYNCHRONIZACJI
// =====================================

async function performSync(showButtonStatus = false) {

    if (syncingTasks) {
        return false;
    }

    syncingTasks = true;

    const button =
        document.getElementById("syncTasksButton");

    let originalHTML = null;

    if (button) {
        originalHTML = button.innerHTML;
    }

    try {

        // ---------------------------------
        // STAN PRZYCISKU
        // ---------------------------------

        if (showButtonStatus && button) {

            button.disabled = true;

            button.innerHTML = `
                <i class="fa-solid fa-arrows-rotate fa-spin"></i>
                <span>Synchronizowanie...</span>
            `;
        }


        // ---------------------------------
        // POBIERANIE AKTUALNYCH ZLECEŃ
        // ---------------------------------

        const response = await fetch(
            "/tasks?refresh=" + Date.now()
        );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const tasks =
            await response.json();


        // ---------------------------------
        // ZAPISZ AKTUALNE DANE
        // ---------------------------------

        window.currentTasks = tasks;


        // ---------------------------------
        // CZAS SYNCHRONIZACJI
        // ---------------------------------

        const syncTime =
            new Date();

        localStorage.setItem(
            "lastSync",
            syncTime.toISOString()
        );


        // ---------------------------------
        // AKTUALIZACJA MAPY
        // ---------------------------------

        if (
            typeof drawTasks === "function" &&
            document.getElementById("map")
        ) {

            drawTasks(tasks);

            if (
                typeof initMapFilters === "function"
            ) {

                await initMapFilters();

            }

        }


        // ---------------------------------
        // AKTUALIZACJA KALENDARZA
        // ---------------------------------

        if (
            typeof renderCalendar === "function" &&
            document.getElementById("calendarGrid")
        ) {

            await renderCalendar();

        }


        // ---------------------------------
        // SUKCES
        // ---------------------------------

        console.log(
            `Synchronizacja zakończona. Zleceń: ${tasks.length}`
        );


        if (showButtonStatus && button) {

            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>
                    Zaktualizowano ${syncTime.toLocaleTimeString("pl-PL")}
                </span>
            `;

            button.classList.add(
                "sync-success"
            );


            setTimeout(() => {

                if (!button) {
                    return;
                }

                button.innerHTML =
                    originalHTML;

                button.classList.remove(
                    "sync-success"
                );

                button.disabled = false;

            }, 2500);

        }


        updateLastSyncDisplay();

        return true;


    } catch (error) {

        console.error(
            "Błąd synchronizacji:",
            error
        );


        if (showButtonStatus && button) {

            button.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Błąd synchronizacji</span>
            `;

            button.classList.add(
                "sync-error"
            );


            setTimeout(() => {

                if (!button) {
                    return;
                }

                button.innerHTML =
                    originalHTML;

                button.classList.remove(
                    "sync-error"
                );

                button.disabled = false;

            }, 2500);

        }

        return false;


    } finally {

        syncingTasks = false;

    }

}


// =====================================
// RĘCZNA SYNCHRONIZACJA
// =====================================

async function syncTasks() {

    await performSync(true);

}


// =====================================
// OSTATNIA SYNCHRONIZACJA
// =====================================

function updateLastSyncDisplay() {

    const element =
        document.getElementById(
            "lastSync"
        );

    if (!element) {
        return;
    }

    const saved =
        localStorage.getItem(
            "lastSync"
        );

    if (!saved) {

        element.textContent =
            "Brak synchronizacji";

        return;

    }

    const date =
        new Date(saved);

    element.textContent =
        "Ostatnia synchronizacja: " +
        date.toLocaleTimeString(
            "pl-PL"
        );

}


// =====================================
// PODŁĄCZENIE PRZYCISKU
// =====================================

function initSyncButton() {

    const button =
        document.getElementById(
            "syncTasksButton"
        );

    if (!button) {
        return;
    }


    if (
        button.dataset.syncReady === "true"
    ) {

        updateLastSyncDisplay();

        return;

    }


    button.dataset.syncReady =
        "true";


    button.addEventListener(
        "click",
        syncTasks
    );


    updateLastSyncDisplay();

}


// =====================================
// AUTOMATYCZNA SYNCHRONIZACJA
// CO 60 SEKUND
// =====================================

setInterval(
    async () => {

        console.log(
            "🔄 Automatyczna synchronizacja..."
        );

        await performSync(false);

    },
    60 * 1000
);


// =====================================
// PIERWSZA SYNCHRONIZACJA
// PO URUCHOMIENIU APLIKACJI
// =====================================

setTimeout(
    async () => {

        console.log(
            "🔄 Pierwsza automatyczna synchronizacja..."
        );

        await performSync(false);

    },
    3000
);