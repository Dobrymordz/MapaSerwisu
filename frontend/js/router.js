async function loadPage(page) {

    const response =
        await fetch(`pages/${page}.html`);

    if (!response.ok) {

        console.error(
            "Nie można załadować strony:",
            page
        );

        return;
    }

    const html =
        await response.text();

    const content =
        document.getElementById("content");

    if (!content) {

        console.error(
            "Nie znaleziono elementu #content."
        );

        return;
    }

    content.innerHTML = html;


    // =====================================
    // DASHBOARD
    // =====================================

    if (page === "dashboard") {

        if (
            typeof updateDashboard === "function"
        ) {

            await updateDashboard();

        }

        return;
    }


    // =====================================
    // ZLECENIA
    // =====================================

    if (page === "zlecenia") {

        if (
            typeof loadOrders === "function"
        ) {

            await loadOrders();

        }

        return;
    }


    // =====================================
    // MAPA
    // =====================================

    if (page === "mapa") {

        setTimeout(async () => {

            // Utwórz mapę
            if (typeof initMap === "function") {
                initMap();
            }

            // Ustaw filtry
            if (typeof initMapFilters === "function") {
                await initMapFilters();
            }

            // Włącz ładowanie zleceń tylko z aktualnego
            // obszaru mapy
            if (typeof initMapViewportLoading === "function") {
                initMapViewportLoading();
            }

            // Jeżeli użytkownik wszedł na mapę z konkretnego
            // zlecenia, pokaż je na mapie.
            if (
                window.selectedTaskOnMap &&
                typeof showTaskOnMap === "function"
            ) {

                const selectedTask =
                    window.selectedTaskOnMap;

                window.selectedTaskOnMap = null;

                setTimeout(() => {
                    showTaskOnMap(selectedTask);
                }, 500);
            }

        }, 150);

        return;
    }


    // =====================================
    // KALENDARZ
    // =====================================

    if (page === "kalendarz") {

        setTimeout(async () => {

            if (
                typeof initCalendar === "function"
            ) {

                await initCalendar();

            }

        }, 50);

        return;
    }

}


// =====================================
// MENU GŁÓWNE
// =====================================

document
    .querySelectorAll(".menu-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                document
                    .querySelectorAll(".menu-btn")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                const page =
                    button.dataset.page;


                if (page) {

                    await loadPage(page);

                }

            }
        );

    });


// =====================================
// STRONA STARTOWA
// =====================================

if (
    localStorage.getItem(
        "tp_logged"
    ) === "true"
) {

    loadPage("dashboard");

}


// =====================================
// WYSZUKIWARKA GÓRNA
// =====================================

if (
    typeof initSearch === "function"
) {

    initSearch();

}


// =====================================
// SYNCHRONIZACJA
// =====================================

if (
    typeof initSyncButton === "function"
) {

    initSyncButton();

}