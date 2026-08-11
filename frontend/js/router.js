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

            // -----------------------------
            // URUCHOM MAPĘ
            // -----------------------------

            if (
                typeof initMap === "function"
            ) {

                initMap();

            }


            // -----------------------------
            // POBIERZ AKTUALNE ZLECENIA
            // -----------------------------

            let tasks = [];

            if (
                typeof getTasks === "function"
            ) {

                tasks =
                    await getTasks(true);

                window.currentTasks =
                    tasks;

            }


            // -----------------------------
            // UZUPEŁNIJ LISTĘ MIAST
            // -----------------------------

            if (
                typeof initMapFilters === "function"
            ) {

                await initMapFilters();

            }


            // -----------------------------
            // NARYSUJ ZLECENIA
            // -----------------------------

            if (
                typeof drawTasks === "function"
            ) {

                drawTasks(tasks);

            }


            // -----------------------------
            // ZLECENIE WYBRANE Z WYSZUKIWARKI
            // LUB KALENDARZA
            // -----------------------------

            if (
                window.selectedTaskOnMap &&
                typeof showTaskOnMap === "function"
            ) {

                const selectedTask =
                    window.selectedTaskOnMap;

                window.selectedTaskOnMap =
                    null;


                setTimeout(() => {

                    showTaskOnMap(
                        selectedTask
                    );

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