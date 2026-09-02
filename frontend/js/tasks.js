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

// =====================================
// RYSOWANIE ZLECEŃ
// =====================================

function drawTasks(tasks) {
    const taskList =
        document.getElementById("taskList");

    const visibleTasks =
        Array.isArray(tasks)
            ? tasks
            : [];

    // Usuwamy stare markery.
    for (const marker of markers.values()) {
        if (map) {
            map.removeLayer(marker);
        }
    }

    markers.clear();

    if (taskList) {
        taskList.innerHTML = "";
    }

    const statusColors = {
        "Otwarte": "#22c55e",
        "Aktualnie wykonywane": "#3b82f6",
        "Oczekiwanie na części": "#f97316",
        "Spauzowane": "#8b5cf6",
        "Wystaw fakturę": "#eab308",
        "Wykonaj ofertę": "#ef4444",
        "Zamknięte": "#6b7280"
    };

    /*
     * Lista zleceń.
     * Maksymalnie 100 elementów DOM,
     * żeby lista również nie zamulała przeglądarki.
     */
    if (taskList) {
        visibleTasks.slice(0, 100).forEach(task => {
            const card =
                document.createElement("div");

            card.className = "task";

            const statusColor =
                statusColors[
                    String(task.status || "").trim()
                ] || "#6b7280";

            card.innerHTML = `
                <div>
                    <div class="task-title">
                        ${task.title || "Zlecenie"}
                    </div>

                    <div class="task-customer">
                        ${task.customer || ""}
                    </div>

                    <div class="task-customer">
                        ${task.city || ""}
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

            card.addEventListener("click", () => {
                if (
                    typeof showDetails === "function"
                ) {
                    showDetails(task);
                }

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
                        Math.max(map.getZoom(), 14),
                        {
                            animate: false
                        }
                    );
                }
            });

            taskList.appendChild(card);
        });

        if (visibleTasks.length > 100) {
            const more =
                document.createElement("div");

            more.style.padding = "12px";
            more.style.textAlign = "center";
            more.style.opacity = "0.7";

            more.textContent =
                `Pokazano 100 z ${visibleTasks.length} zleceń. Przybliż mapę, aby zawęzić obszar.`;

            taskList.appendChild(more);
        }
    }

    /*
     * KAŻDE ZLECENIE = OSOBNA PINEZKA.
     * Bez klastrów i bez sumowania.
     */
    visibleTasks.forEach(task => {
        const lat = Number(task.lat);
        const lng = Number(task.lng);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            !map
        ) {
            return;
        }

        const taskId = String(
            task.firmaoTaskId ||
            task.firmaoId ||
            task.id
        );

        const marker =
            L.marker(
                [lat, lng],
                {
                    icon:
                        getStatusIcon(
                            task.status
                        )
                }
            ).addTo(map);

        marker.on("click", () => {
            if (
                typeof showDetails === "function"
            ) {
                showDetails(task);
            }
        });

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

        markers.set(taskId, marker);
    });
}

