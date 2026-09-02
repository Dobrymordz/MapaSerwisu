async function initMapFilters() {

    const citySelect = document.getElementById("cityFilter");
    const statusSelect = document.getElementById("statusFilter");

    if (!citySelect) {
        return;
    }

    // Domyślnie tylko otwarte
    if (statusSelect && !statusSelect.dataset.initialized) {
        statusSelect.innerHTML = `
            <option value="__ACTIVE__">🟢 Wszystkie aktywne</option>
            <option value="Otwarte">🟢 Otwarte</option>
            <option value="">📋 Wszystkie statusy</option>
        `;

        statusSelect.value = "__ACTIVE__";
        statusSelect.dataset.initialized = "1";
    }

    // Miasta zostawiamy do filtrowania na podstawie
    // zleceń pobranych dla aktualnego obszaru mapy.
    citySelect.innerHTML = `
        <option value="">🏙️ Wszystkie miasta</option>
    `;
}


async function filterMap() {

    // Nie pobieramy już całych 18 tys. zleceń.
    // Ładowany jest wyłącznie aktualny obszar mapy.
    if (typeof loadMapTasksInViewport === "function") {
        await loadMapTasksInViewport();
        return;
    }

    console.warn(
        "[Mapa] loadMapTasksInViewport() nie jest dostępne."
    );
}
