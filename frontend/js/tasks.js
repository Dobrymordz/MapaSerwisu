const markers = [];

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

    if (!Array.isArray(tasks)) {
        tasks = [];
    }


    // ===============================
    // STATYSTYKI
    // ===============================

    const planned =
        tasks.filter(
            t => t.status === "Zaplanowane"
        ).length;

    const progress =
        tasks.filter(
            t => t.status === "W trakcie"
        ).length;

    const failure =
        tasks.filter(
            t => t.status === "Awaria"
        ).length;


    const stats =
        document.getElementById("stats");


    if (stats) {

        stats.innerHTML = `
            📋 Wszystkie: <b>${tasks.length}</b><br>
            🟢 Zaplanowane: <b>${planned}</b><br>
            🟠 W trakcie: <b>${progress}</b><br>
            🔴 Awarie: <b>${failure}</b>
        `;

    }


    // ===============================
    // LISTA ZLECEŃ
    // ===============================

    const taskList =
        document.getElementById("taskList");


    if (taskList) {

        taskList.innerHTML = "";

    }


    // ===============================
    // USUWANIE STARYCH MARKERÓW
    // ===============================

    markers.forEach(marker => {

        if (map) {
            map.removeLayer(marker);
        }

    });

    markers.length = 0;


    const bounds = [];


    // ===============================
    // ZLECENIA
    // ===============================

    tasks.forEach(task => {


        // -------------------------------
        // KOLOR STATUSU
        // -------------------------------

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


        // -------------------------------
        // KARTA ZLECENIA
        // -------------------------------

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


            card.addEventListener(
                "click",
                () => {

                    showDetails(task);


                    if (map) {

                        map.flyTo(
                            [
                                Number(task.lat),
                                Number(task.lng)
                            ],
                            14,
                            {
                                duration: 1
                            }
                        );

                    }

                }
            );

        }


        // -------------------------------
        // SPRAWDZENIE WSPÓŁRZĘDNYCH
        // -------------------------------

        if (
            task.lat == null ||
            task.lng == null
        ) {

            return;

        }


        if (!map) {

            console.warn(
                "Mapa nie istnieje podczas rysowania zlecenia."
            );

            return;

        }


        const lat =
            Number(task.lat);

        const lng =
            Number(task.lng);


        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng)
        ) {

            return;

        }


        // -------------------------------
        // MARKER
        // -------------------------------

        const marker =
            L.marker(
                [lat, lng],
                {
                    icon:
                        icons[task.status] ||
                        icons["Zaplanowane"]
                }
            ).addTo(map);


        bounds.push([lat, lng]);

        markers.push(marker);


        // -------------------------------
        // POPUP
        // -------------------------------

        marker.bindPopup(`
            <b>${task.title || "Zlecenie"}</b><br>
            ${task.customer || ""}<br>
            ${task.city || ""}<br>
            <b>Status:</b> ${task.status || ""}
        `);


        // -------------------------------
        // KLIK MARKERA
        // -------------------------------

        marker.on(
            "click",
            () => {

                showDetails(task);

            }
        );


    });


    // ===============================
    // DOPASOWANIE MAPY
    // ===============================

    if (
        map &&
        bounds.length > 0
    ) {

        map.fitBounds(
            bounds,
            {
                padding: [50, 50]
            }
        );

    }

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