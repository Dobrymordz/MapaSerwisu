require("dotenv").config();
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// FRONTEND
// ===============================

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


// ===============================
// API
// ===============================

app.get("/api", (req, res) => {

    res.json({
        status: "OK",
        message: "🚀 Backend działa"
    });

});



// ===============================
// AUTOMATYCZNA SYNCHRONIZACJA FIRMAO
// ===============================

let firmaoTasksCache = [];
let firmaoLastSync = null;
let firmaoSyncRunning = false;

// ===============================
// GEOKODOWANIE
// ===============================

const GEOCODE_CACHE_FILE = path.join(__dirname, "geocode-cache.json");
const geocodeCache = new Map();

try {
    if (fs.existsSync(GEOCODE_CACHE_FILE)) {
        const saved = JSON.parse(
            fs.readFileSync(GEOCODE_CACHE_FILE, "utf8")
        );

        for (const [key, value] of Object.entries(saved)) {
            geocodeCache.set(key, value);
        }

        console.log(
            `[Geocoder] Wczytano ${geocodeCache.size} zapisanych wyników`
        );
    }
} catch (error) {
    console.warn(
        "[Geocoder] Nie udało się wczytać cache:",
        error.message
    );
}

function saveGeocodeCache() {
    try {
        fs.writeFileSync(
            GEOCODE_CACHE_FILE,
            JSON.stringify(Object.fromEntries(geocodeCache), null, 2),
            "utf8"
        );
    } catch (error) {
        console.warn(
            "[Geocoder] Nie udało się zapisać cache:",
            error.message
        );
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address) {

    if (!address) {
        return null;
    }

    const query = String(address).trim();

    if (!query) {
        return null;
    }

    if (geocodeCache.has(query)) {
        return geocodeCache.get(query);
    }

    try {

        // Nominatim: maksymalnie jedno zapytanie na sekundę.
        await sleep(1100);

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: query,
                    format: "json",
                    limit: 1,
                    countrycodes: "pl"
                },
                headers: {
                    "User-Agent":
                        "MapaSerwisu/1.0 (Technologia Plus Service Manager)"
                },
                timeout: 15000
            }
        );

        if (!response.data || !response.data.length) {

            console.log(
                `[Geocoder] Brak wyniku: ${query}`
            );

            geocodeCache.set(query, null);
            saveGeocodeCache();

            return null;
        }

        const result = {
            lat: Number(response.data[0].lat),
            lng: Number(response.data[0].lon)
        };

        geocodeCache.set(query, result);
        saveGeocodeCache();

        console.log(
            `[Geocoder] ${query} -> ${result.lat}, ${result.lng}`
        );

        return result;

    } catch (error) {

        console.error(
            `[Geocoder] Błąd dla "${query}":`,
            error.message
        );

        return null;
    }
}

async function geocodeTask(task) {

    if (!task) {
        return null;
    }

    const title =
        task.name ||
        task.title ||
        "";

    const project =
        task.project?.name ||
        "";

    const custom3 =
        task.customFields?.custom3 ||
        "";

    const address =
        typeof task.address === "string"
            ? task.address.trim()
            : "";

    // Najpierw próbujemy najbardziej dokładnych danych.
    const queries = [
        address,
        title,
        project,
        custom3
    ]
        .map(value => String(value || "").trim())
        .filter(Boolean);

    // Usuwamy duplikaty.
    const uniqueQueries = [...new Set(queries)];

    for (const query of uniqueQueries) {

        const coordinates = await geocodeAddress(query);

        if (coordinates) {
            return coordinates;
        }
    }

    // Ostateczny fallback: miasto rozpoznane z danych zlecenia.
    const city =
        extractCity(title) ||
        extractCity(project) ||
        extractCity(custom3) ||
        extractCity(address) ||
        "";

    if (city && CITY_COORDS[city]) {

        const coordinates = {
            lat: CITY_COORDS[city][0],
            lng: CITY_COORDS[city][1]
        };

        console.log(
            `[Geocoder] Fallback miasto: ${city} -> ${coordinates.lat}, ${coordinates.lng}`
        );

        return coordinates;
    }

    return null;
}

async function syncFirmaoTasks() {

    if (firmaoSyncRunning) {
        return;
    }

    firmaoSyncRunning = true;

    try {

        let allTasks = [];
        let start = 0;
        const pageSize = 100;

        while (true) {

            const response = await axios.get(
                `${process.env.FIRMAO_API_URL}/tasks`,
                {
                    params: {
                        start,
                        limit: pageSize
                    },
                    auth: {
                        username: process.env.FIRMAO_EMAIL,
                        password: process.env.FIRMAO_PASSWORD
                    },
                    timeout: 30000
                }
            );

            const page = response.data.data || [];

            allTasks.push(...page);

            console.log(
                `[Firmao] Pobrano ${page.length} zleceń (start=${start})`
            );

            if (page.length < pageSize) {
                break;
            }

            start += pageSize;
        }

        firmaoTasksCache = allTasks;

        console.log(
            `[Geocoder] Rozpoczynam sprawdzanie ${firmaoTasksCache.length} zleceń...`
        );

        let geocoded = 0;
        let skipped = 0;

        for (const task of firmaoTasksCache) {

            // Jeżeli mamy już współrzędne z Firmao, nie pytamy ponownie.
            if (
                task.lat != null &&
                task.lng != null
            ) {
                skipped++;
                continue;
            }

            const coordinates = await geocodeTask(task);

            if (coordinates) {

                task.lat = coordinates.lat;
                task.lng = coordinates.lng;

                geocoded++;
            }
        }

        saveGeocodeCache();

        firmaoLastSync = new Date();

        console.log(
            `[Firmao] Synchronizacja OK: ${firmaoTasksCache.length} zleceń`
        );

        console.log(
            `[Geocoder] Nowe współrzędne: ${geocoded}, pominięte: ${skipped}, cache: ${geocodeCache.size}`
        );

    } catch (error) {

        console.error(
            "[Firmao] Błąd synchronizacji:",
            error.message
        );

    } finally {

        firmaoSyncRunning = false;

    }

}

// Pierwsza synchronizacja po uruchomieniu
syncFirmaoTasks();

// Kolejne synchronizacje co 5 minut
const FIRMAO_SYNC_INTERVAL = setInterval(
    syncFirmaoTasks,
    5 * 60 * 1000
);

// Endpoint do sprawdzenia synchronizacji
app.get("/firmao-sync-status", (req, res) => {

    res.json({
        tasks: firmaoTasksCache.length,
        lastSync: firmaoLastSync,
        syncInterval: 5 * 60 * 1000
    });

});


// ===============================
// ZLECENIA
// ===============================


// ===== MIASTA DO MAPY =====
const CITY_COORDS = {
  "Warszawa": [52.2297, 21.0122],
  "Łódź": [51.7592, 19.4560],
  "Kraków": [50.0647, 19.9450],
  "Wrocław": [51.1079, 17.0385],
  "Poznań": [52.4064, 16.9252],
  "Gdańsk": [54.3520, 18.6466],
  "Szczecin": [53.4285, 14.5528],
  "Bydgoszcz": [53.1235, 18.0084],
  "Lublin": [51.2465, 22.5684],
  "Białystok": [53.1325, 23.1688],
  "Katowice": [50.2649, 19.0238],
  "Kalisz": [51.7611, 18.0910],
  "Opole": [50.6751, 17.9213],
  "Rzeszów": [50.0412, 21.9991],
  "Toruń": [53.0138, 18.5984],
  "Kielce": [50.8661, 20.6286],
  "Olsztyn": [53.7784, 20.4801],
  "Gdynia": [54.5189, 18.5305],
  "Bielsko-Biała": [49.8224, 19.0444],
  "Częstochowa": [50.8118, 19.1203],
  "Radom": [51.4027, 21.1471],
  "Siedlce": [52.1677, 22.2901],
  "Ostrów Wielkopolski": [51.6550, 17.8069],
  "Ostrów": [51.6550, 17.8069],
  "Kępno": [51.2784, 17.9891],
  "Konin": [52.2230, 18.2511],
  "Leszno": [51.8410, 16.5749],
  "Piła": [53.1515, 16.7382],
  "Gorzów Wielkopolski": [52.7325, 15.2369],
  "Zielona Góra": [51.9356, 15.5062],
  "Wałbrzych": [50.7714, 16.2843],
  "Legnica": [51.2070, 16.1553],
  "Jelenia Góra": [50.9044, 15.7194],
  "Nysa": [50.4738, 17.3344],
  "Dzierżoniów": [50.7282, 16.6514],
  "Tychy": [50.1372, 18.9664],
  "Gliwice": [50.2945, 18.6714],
  "Rybnik": [50.1022, 18.5463],
  "Sosnowiec": [50.2863, 19.1041],
  "Płock": [52.5463, 19.7065],
  "Włocławek": [52.6482, 19.0678],
  "Elbląg": [54.1561, 19.4045],
  "Koszalin": [54.1943, 16.1722],
  "Słupsk": [54.4641, 17.0287],
  "Białogard": [54.0060, 15.9875],
  "Kołobrzeg": [54.1757, 15.5834],
  "Jarosław": [50.0167, 22.6778],
  "Przemyśl": [49.7839, 22.7678],
  "Tarnów": [50.0121, 20.9858],
  "Nowy Sącz": [49.6175, 20.7153],
  "Oświęcim": [50.0344, 19.2097],
  "Kobylnica": [54.4392, 17.0040],
  "Kobylanka": [53.3441, 14.8714],
  "Ociąż": [51.6920, 17.8540]
};

function normalizeCity(city) {
  if (!city) return "";
  return city
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,$/, "");
}

function extractCity(text) {
  if (!text) return "";

  const normalized = String(text);

  const cities = Object.keys(CITY_COORDS)
    .sort((a, b) => b.length - a.length);

  for (const city of cities) {
    const re = new RegExp(
      `(^|[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])`,
      "i"
    );

    if (re.test(normalized)) {
      return city;
    }
  }

  return "";
}


// ===============================
// ZLECENIA DLA AKTUALNEGO OBSZARU MAPY
// ===============================

app.get("/map-tasks", (req, res) => {
    try {
        const minLat = Number(req.query.minLat);
        const maxLat = Number(req.query.maxLat);
        const minLng = Number(req.query.minLng);
        const maxLng = Number(req.query.maxLng);
        const requestedStatusKey = String(
            req.query.statusKey || "__ACTIVE__"
        ).trim();

        if (
            !Number.isFinite(minLat) ||
            !Number.isFinite(maxLat) ||
            !Number.isFinite(minLng) ||
            !Number.isFinite(maxLng)
        ) {
            return res.status(400).json({
                error: "Nieprawidłowe granice mapy"
            });
        }

        const tasks = firmaoTasksCache
            .map(task => {
                const address =
                    typeof task.address === "string"
                        ? task.address
                        : "";

                const customer =
                    task.customer?.label ||
                    task.customer?.name ||
                    "";

                const responsibleUsers =
                    Array.isArray(task.responsibleUsers)
                        ? task.responsibleUsers
                        : [];

                const technician =
                    responsibleUsers
                        .map(user =>
                            user.label ||
                            user.name ||
                            user.email ||
                            ""
                        )
                        .filter(Boolean)
                        .join(", ");

                const statusKey =
                    task.status?.key ||
                    "";

                const statusLabel =
                    task.status?.label ||
                    statusKey ||
                    "Brak statusu";

                const plannedStart =
                    task.plannedStartDate ||
                    "";

                const title =
                    task.name ||
                    task.title ||
                    `Zlecenie ${task.id}`;

                const project =
                    task.project?.name ||
                    "";

                const custom3 =
                    task.customFields?.custom3 ||
                    "";

                const city =
                    extractCity(title) ||
                    extractCity(project) ||
                    extractCity(custom3) ||
                    extractCity(address) ||
                    "";

                const coords =
                    city && CITY_COORDS[city]
                        ? CITY_COORDS[city]
                        : null;

                return {
                    id: task.id,
                    firmaoId: task.id,
                    title,
                    project,
                    customer,
                    city,
                    address,
                    lat: coords ? coords[0] : null,
                    lng: coords ? coords[1] : null,
                    status: statusLabel,
                    statusKey,
                    technician,
                    date: plannedStart
                        ? String(plannedStart).substring(0, 10)
                        : "",
                    time: plannedStart
                        ? String(plannedStart).substring(11, 16)
                        : "",
                    priority:
                        task.priority?.label ||
                        task.priority ||
                        "",
                    firmaoUrl:
                        `https://system.firmao.pl/technologiaplusspzoo#view=task&id=${task.id}`
                };
            })
              .filter(task => {
                  // Zamknięte nigdy nie trafiają na mapę.
                  if (
                      String(task.statusKey || "")
                          .trim()
                          .toUpperCase() === "CLOSED"
                  ) {
                      return false;
                  }

                  // Filtr statusu.
                  if (
                      requestedStatusKey &&
                      requestedStatusKey !== "__ACTIVE__" &&
                      task.statusKey !== requestedStatusKey
                  ) {
                      return false;
                  }

                  // Tylko zlecenia z koordynatami.
                  if (
                      task.lat == null ||
                      task.lng == null
                  ) {
                      return false;
                  }

                  // Tylko aktualny obszar mapy.
                  return (
                      task.lat >= minLat &&
                      task.lat <= maxLat &&
                      task.lng >= minLng &&
                      task.lng <= maxLng
                  );
              });

        res.json(tasks);

    } catch (err) {
        console.error("Błąd /map-tasks:", err);

        res.status(500).json({
            error: "Nie udało się pobrać zleceń dla mapy"
        });
    }
});

app.get("/tasks", (req, res) => {

    try {

        const tasks = firmaoTasksCache.map(task => {

            const address =
                typeof task.address === "string"
                    ? task.address
                    : "";

            const customer =
                task.customer?.label ||
                task.customer?.name ||
                "";

            const responsibleUsers =
                Array.isArray(task.responsibleUsers)
                    ? task.responsibleUsers
                    : [];

            const technician =
                responsibleUsers
                    .map(user => user.label || user.name || user.email || "")
                    .filter(Boolean)
                    .join(", ");

            const statusKey =
                task.status?.key ||
                "";

            const statusLabel =
                task.status?.label ||
                statusKey ||
                "Brak statusu";

            const plannedStart =
                task.plannedStartDate ||
                "";

            const title =
                task.name ||
                task.title ||
                `Zlecenie ${task.id}`;

            const project =
                task.project?.name ||
                "";

            const custom3 =
                task.customFields?.custom3 ||
                "";

            // Szukamy miasta przede wszystkim w nazwie zlecenia/projekcie.
            // Adres Firmao jest używany dopiero jako ostatnia możliwość.
            const city =
                extractCity(title) ||
                extractCity(project) ||
                extractCity(custom3) ||
                extractCity(address) ||
                "";

            const coords =
                city && CITY_COORDS[city]
                    ? CITY_COORDS[city]
                    : null;

            return {

                id: task.id,

                firmaoId: task.id,

                title,

                project,

                customer,

                city,

                address: address,

                lat: coords ? coords[0] : null,

                lng: coords ? coords[1] : null,

                status: statusLabel,

                statusKey,

                technician,

                date:
                    plannedStart
                        ? String(plannedStart).substring(0, 10)
                        : "",

                time:
                    plannedStart
                        ? String(plannedStart).substring(11, 16)
                        : "",

                priority:
                    task.priority?.label ||
                    task.priority ||
                    "",

                firmaoUrl:
                    `https://system.firmao.pl/technologiaplusspzoo#view=task&id=${task.id}`

            };

        });

        res.json(tasks);

    } catch (err) {

        console.error(
            "Błąd przetwarzania zleceń Firmao:",
            err
        );

        res.status(500).json({
            error: "Nie udało się przetworzyć zleceń Firmao"
        });

    }

});


// ===============================
// FIRMAO API - TEST ZLECEŃ
// ===============================

app.get("/firmao-tasks", async (req, res) => {

    try {

        const start = Number(req.query.start || 0);
        const limit = Number(req.query.limit || 100);

        const response = await axios.get(
            `${process.env.FIRMAO_API_URL}/tasks`,
            {
                params: {
                    start,
                    limit
                },
                auth: {
                    username: process.env.FIRMAO_EMAIL,
                    password: process.env.FIRMAO_PASSWORD
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        console.error("Błąd Firmao API:");

        if (error.response) {

            console.error("HTTP:", error.response.status);
            console.error(error.response.data);

            return res.status(error.response.status).json({
                error: "Firmao API error",
                details: error.response.data
            });

        }

        console.error(error.message);

        res.status(500).json({
            error: error.message
        });

    }

});


// ===============================
// STRONA GŁÓWNA
// ===============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );

});


// ===============================
// START
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🚀 Backend działa na porcie ${PORT}`
    );

});
