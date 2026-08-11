cat > frontend/js/mapFilters.js <<'EOF'
async function initMapFilters() {

    const citySelect =
        document.getElementById("cityFilter");

    if (!citySelect) {
        return;
    }

    const tasks = await getTasks(true);

    // Zapamiętaj aktualnie wybrane miasto
    const currentCity = citySelect.value;

    // Pobierz wszystkie miasta
    const cities = [
        ...new Set(
            tasks
                .map(task =>
                    String(task.city || "").trim()
                )
                .filter(city => city !== "")
        )
    ];

    // Sortowanie alfabetyczne
    cities.sort((a, b) =>
        a.localeCompare(b, "pl")
    );

    // Wyczyść listę
    citySelect.innerHTML = `
        <option value="">🏙️ Wszystkie miasta</option>
    `;

    // Dodaj miasta
    cities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;
        option.textContent = city;

        citySelect.appendChild(option);

    });

    // Przywróć wybór
    if (cities.includes(currentCity)) {
        citySelect.value = currentCity;
    }

}


async function filterMap() {

    const customerInput =
        document.getElementById("customerFilter");

    const cityInput =
        document.getElementById("cityFilter");

    const typeInput =
        document.getElementById("typeFilter");

    const statusInput =
        document.getElementById("statusFilter");

    if (
        !customerInput ||
        !cityInput ||
        !typeInput ||
        !statusInput
    ) {
        console.error(
            "Nie znaleziono pól filtrów mapy."
        );

        return;
    }

    const customer =
        customerInput.value
            .trim()
            .toLowerCase();

    const city =
        cityInput.value
            .trim()
            .toLowerCase();

    const type =
        typeInput.value;

    const status =
        statusInput.value;

    const tasks =
        await getTasks(true);

    const filtered =
        tasks.filter(task => {

            const taskCustomer =
                String(
                    task.customer || ""
                ).toLowerCase();

            const taskCity =
                String(
                    task.city || ""
                ).toLowerCase();

            const taskStatus =
                String(
                    task.status || ""
                );

            const taskType =
                typeof getTaskType === "function"
                    ? getTaskType(
                        task.title || ""
                    )
                    : "";

            const okCustomer =
                !customer ||
                taskCustomer.includes(
                    customer
                );

            const okCity =
                !city ||
                taskCity === city;

            const okType =
                !type ||
                taskType === type;

            const okStatus =
                !status ||
                taskStatus === status;

            return (
                okCustomer &&
                okCity &&
                okType &&
                okStatus
            );

        });

    drawTasks(filtered);
}
EOF