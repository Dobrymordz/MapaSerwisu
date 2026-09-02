const markers = new Map();

function createStatusIcon(status) {

    const colors = {
        "Otwarte": "#22c55e",
        "Aktualnie wykonywane": "#3b82f6",
        "Oczekiwanie na części": "#f97316",
        "Spauzowane": "#8b5cf6",
        "Wystaw fakturę": "#eab308",
        "Wykonaj ofertę": "#ef4444",
        "Zamknięte": "#6b7280"
    };

    const color =
        colors[String(status || "").trim()] ||
        "#6b7280";

    return L.divIcon({
        className: "custom-status-marker",
        html: `
            <div style="
                width: 28px;
                height: 28px;
                background: white;
                border: 4px solid ${color};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 2px 8px rgba(0,0,0,.35);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    border-radius: 50%;
                "></div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
}

function getStatusIcon(status) {
    return createStatusIcon(status);
}

async function getTasks(forceRefresh = false) {

    try {

        const response = await fetch("/tasks");

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const tasks = await response.json();

        console.log(
            "Pobrano zlecenia:",
            tasks
        );

        return tasks;

    } catch (error) {

        console.error(
            "Nie udało się pobrać zleceń:",
            error
        );

        return [];

    }

}


// =====================================
// RYSOWANIE ZLECEŃ
// =====================================

function drawTasks(tasks) {

    const taskList = document.getElementById("taskList");

    // =====================================
    // LISTA ZLECEŃ
    // =====================================

    if (taskList) {
        taskList.innerHTML = "";
    }


    // =====================================
    // ZBIERAMY ID AKTUALNYCH ZLECEŃ
    // =====================================

    const currentIds = new Set();


    visibleTasks.forEach(task => {

        const taskId = String(
            task.firmaoTaskId ||
            task.firmaoId ||
            task.id
        );

        currentIds.add(taskId);


        // =====================================
        // KOLOR STATUSU
        // =====================================

        let statusColor = "#6b7280";

        switch (task.status) {

            case "Zaplanowane":
                statusColor = "#22c55e";
                break;

            case "W trakcie":
                statusColor = "#f59e0b";
                break;

            case "Awaria":
                statusColor = "#ef4444";
                break;

        }


        // =====================================
        // KARTA ZLECENIA
        // =====================================

        if (taskList) {

            const card =
                document.createElement("div");

            card.className = "task";

            card.innerHTML = `
                <div>
                    <div class="task-title">
                        ${task.title || "Zlecenie"}
                    </div>

                    <div class="task-customer">
                        ${task.customer || ""}
                    </div>
                </div>

                <i class="fa-solid fa-chevron-right"></i>

                <span
                    class="task-status"
                    style="
                        background:${statusColor}20;
                        color:${statusColor};
                    "
                >
                    ${task.status || ""}
                </span>
            `;

            taskList.appendChild(card);


            // =====================================
            // KLIKNIĘCIE ZLECENIA
            // =====================================

            card.addEventListener("click", () => {

                showDetails(task);

                const lat = Number(task.lat);
                const lng = Number(task.lng);

                if (
                    map &&
                    Number.isFinite(lat) &&
                    Number.isFinite(lng)
                ) {

                    map.stop();

                    map.setView(
                        [lat, lng],
                        14,
                        {
                            animate: false
                        }
                    );
                }

            });

        }


        // =====================================
        // WSPÓŁRZĘDNE
        // =====================================

        const lat = Number(task.lat);
        const lng = Number(task.lng);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            !map
        ) {
            return;
        }


        // =====================================
        // ISTNIEJĄCY MARKER
        // =====================================

        let marker = markers.get(taskId);

        if (marker) {

            marker.setLatLng([lat, lng]);

            marker.setIcon(
                getStatusIcon(task.status)
            );

        }


        // =====================================
        // NOWY MARKER
        // =====================================

        if (!marker) {

            marker =
                L.marker(
                    [lat, lng],
                    {
                        icon:
                            getStatusIcon(task.status)
                    }
                ).addTo(map);


            // =====================================
            // KLIK MARKERA
            // =====================================

            marker.on("click", () => {
                showDetails(task);
            });


            markers.set(taskId, marker);

        }


        // =====================================
        // POPUP
        // =====================================

        const firmaoId =
            task.firmaoTaskId ||
            task.firmaoId ||
            task.id;

        let firmaoButton = "";

        if (firmaoId) {

            firmaoButton = `
                <br>
                <button
                    onclick="
                        window.open(
                            'https://system.firmao.pl/technologiaplusspzoo#view=task&id=${firmaoId}',
                            '_blank'
                        )
                    "
                    style="
                        margin-top:10px;
                        width:100%;
                        padding:8px 12px;
                        border:none;
                        border-radius:8px;
                        background:#0E6BA8;
                        color:white;
                        cursor:pointer;
                        font-weight:600;
                    "
                >
                    📋 Otwórz zlecenie w Firmao
                </button>
            `;

        }


        marker.bindPopup(`
            <b>${task.title || "Zlecenie"}</b><br>
            ${task.customer || ""}<br>
            ${task.city || ""}<br>
            <b>Status:</b> ${task.status || ""}
            ${firmaoButton}
        `);

    });


    // =====================================
    // USUWAMY MARKERY, KTÓRYCH JUŻ NIE MA
    // =====================================

    for (const [id, marker] of markers.entries()) {

        if (!currentIds.has(id)) {

            if (map) {
                map.removeLayer(marker);
            }

            markers.delete(id);
        }
    }


    // =====================================
    // NIE ROBIMY FITBOUNDS PRZY KAŻDYM SYNCU
    // =====================================

}


// =====================================
// SZCZEGÓŁY ZLECENIA
// =====================================

function showDetails(task) {

    const detailsPanel =
        document.getElementById(
            "detailsPanel"
        );

    const detailsTitle =
        document.getElementById(
            "detailsTitle"
        );

    const detailsContent =
        document.getElementById(
            "detailsContent"
        );


    if (
        !detailsPanel ||
        !detailsTitle ||
        !detailsContent
    ) {

        return;

    }


    detailsPanel.style.display =
        "block";


    detailsTitle.innerHTML =
        task.title ||
        task.customer ||
        "Zlecenie";


    detailsContent.innerHTML = `
        <b>👤 Klient</b><br>
        ${task.customer || "-"}<br><br>

        <b>📍 Miasto</b><br>
        ${task.city || "-"}<br><br>

        <b>📍 Adres</b><br>
        ${task.address || "-"}<br><br>

        <b>📊 Status</b><br>
        ${task.status || "-"}<br><br>

        <b>👨‍🔧 Serwisant</b><br>
        ${task.technician || "-"}<br><br>

        <button
            onclick="
                window.open(
                    'https://www.google.com/maps?q=${task.lat},${task.lng}'
                )
            "
        >
            🚗 Nawiguj
        </button>
    `;

}