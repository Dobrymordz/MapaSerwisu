const markers = new Map();

const icons = {

    "Zaplanowane": new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),

    "W trakcie": new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),

    "Awaria": new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })

};


// =====================================
// POBIERANIE ZLECEŃ
// =====================================

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
    // FILTRUJEMY ZAMKNIĘTE
    // =====================================

    const visibleTasks = (Array.isArray(tasks) ? tasks : []).filter(task => {

        const status =
            String(task.status || "")
                .trim()
                .toLowerCase();

        const statusKey =
            String(task.statusKey || "")
                .trim()
                .toUpperCase();

        return status !== "zamknięte" && statusKey !== "CLOSED";
    });


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

                    setTimeout(() => {

                        if (map) {
                            map.invalidateSize({
                                pan: false
                            });
                        }

                    }, 50);
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

            const icon =
                icons[task.status] ||
                icons["Zaplanowane"];

            if (icon) {
                marker.setIcon(icon);
            }

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
                            icons[task.status] ||
                            icons["Zaplanowane"]
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