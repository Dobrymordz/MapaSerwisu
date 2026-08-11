let ordersCache = [];


async function loadOrders() {

    const table = document.getElementById("taskTable");

    if (!table) {
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="6">
                Ładowanie zleceń...
            </td>
        </tr>
    `;

    try {

        const tasks = await getTasks(true);

        ordersCache = Array.isArray(tasks) ? tasks : [];

        renderOrders(ordersCache);

        initOrdersFilters();

    } catch (error) {

        console.error("Błąd podczas ładowania zleceń:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Nie udało się pobrać zleceń.
                </td>
            </tr>
        `;

    }

}


function renderOrders(tasks) {

    const table = document.getElementById("taskTable");
    const count = document.getElementById("ordersCount");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (count) {

        count.textContent =
            `${tasks.length} ${tasks.length === 1 ? "zlecenie" : "zleceń"}`;

    }

    if (tasks.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty-orders">
                    Brak zleceń
                </td>
            </tr>
        `;

        return;

    }


    tasks.forEach(task => {

        const row = document.createElement("tr");

        const statusClass = getStatusClass(task.status);

        row.innerHTML = `

            <td>
                ${task.id ?? "-"}
            </td>

            <td>
                <strong>${task.customer ?? "-"}</strong>
            </td>

            <td>
                ${task.city ?? "-"}
            </td>

            <td>
                ${task.technician ?? task.servicePerson ?? "-"}
            </td>

            <td>

                <span class="order-status ${statusClass}">
                    ${task.status ?? "-"}
                </span>

            </td>

            <td>
                ${task.date ?? task.startDate ?? "-"}
            </td>

        `;

        row.addEventListener("click", () => {

            if (
                typeof showDetails === "function"
            ) {

                showDetails(task);

            }

            if (
                typeof map !== "undefined" &&
                map &&
                task.lat &&
                task.lng
            ) {

                map.flyTo(
                    [task.lat, task.lng],
                    14,
                    {
                        duration: 1
                    }
                );

            }

        });

        table.appendChild(row);

    });

}


function getStatusClass(status) {

    switch (status) {

        case "Zaplanowane":
            return "status-planned";

        case "W trakcie":
            return "status-progress";

        case "Awaria":
            return "status-failure";

        default:
            return "status-default";

    }

}


function initOrdersFilters() {

    const search = document.getElementById("searchTask");
    const status = document.getElementById("orderStatusFilter");

    if (!search || !status) {
        return;
    }

    search.oninput = filterOrders;
    status.onchange = filterOrders;

}


function filterOrders() {

    const search =
        document
            .getElementById("searchTask")
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        document
            .getElementById("orderStatusFilter")
            ?.value || "";


    const filtered = ordersCache.filter(task => {

        const text = `

            ${task.id ?? ""}
            ${task.customer ?? ""}
            ${task.city ?? ""}
            ${task.technician ?? ""}
            ${task.servicePerson ?? ""}
            ${task.status ?? ""}
            ${task.date ?? ""}

        `.toLowerCase();

        const matchesSearch =
            !search ||
            text.includes(search);

        const matchesStatus =
            !status ||
            task.status === status;

        return matchesSearch && matchesStatus;

    });


    renderOrders(filtered);

}