const map = L.map("map", {
    zoomControl: true
}).setView([51.1079, 17.0385], 8);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

window.addEventListener("load", () => {
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});

window.addEventListener("resize", () => {
    map.invalidateSize();
});