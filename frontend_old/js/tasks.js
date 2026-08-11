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

function drawTasks(tasks){

    const planned = tasks.filter(t => t.status === "Zaplanowane").length;
    const progress = tasks.filter(t => t.status === "W trakcie").length;
    const failure = tasks.filter(t => t.status === "Awaria").length;

    document.getElementById("stats").innerHTML = `
        📋 Wszystkie: <b>${tasks.length}</b><br>
        🟢 Zaplanowane: <b>${planned}</b><br>
        🟠 W trakcie: <b>${progress}</b><br>
        🔴 Awarie: <b>${failure}</b>
    `;

    const bounds = [];
    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0;

    tasks.forEach(task => {

        let statusColor = "#6b7280";

        switch(task.status){

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

        const card = document.createElement("div");

        card.className = "task";

        card.style.borderLeft = `6px solid ${statusColor}`;

        card.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.customer}</p>

            <span class="status" style="background:${statusColor}">
                ${task.status}
            </span>
        `;

        taskList.appendChild(card);

        const marker = L.marker(
            [task.lat, task.lng],
            {
                icon: icons[task.status]
            }
        ).addTo(map);

        bounds.push([task.lat, task.lng]);

        markers.push(marker);

        marker.bindPopup(`
            <b>${task.title}</b><br>
            ${task.customer}<br>
            <b>Status:</b> ${task.status}
        `);

        marker.on("click", () => {

            showDetails(task);

        });

        card.addEventListener("click", () => {

            showDetails(task);

            map.flyTo([task.lat, task.lng], 14, {
                duration: 1
            });

            marker.openPopup();

        });

    });

    if(bounds.length > 0){

        map.fitBounds(bounds,{
            padding:[50,50]
        });

    }

}

function showDetails(task){

    document.getElementById("detailsPanel").style.display = "block";

    document.getElementById("detailsTitle").innerHTML = task.title;

    document.getElementById("detailsContent").innerHTML = `
        <b>👤 Klient</b><br>
        ${task.customer}<br><br>

        <b>📍 Status</b><br>
        ${task.status}<br><br>

        <button onclick="window.open('https://www.google.com/maps?q=${task.lat},${task.lng}')">
            🚗 Nawiguj
        </button>
    `;

}