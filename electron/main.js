const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

let backendProcess = null;

const logFile = path.join(
    app.getPath("userData"),
    "backend.log"
);

function log(message) {

    try {

        fs.appendFileSync(
            logFile,
            `[${new Date().toISOString()}] ${message}\n`
        );

    } catch (error) {

        console.error(error);

    }

    console.log(message);

}


// =====================================
// ŚCIEŻKA BACKENDU
// =====================================

function getBackendPath() {

    if (app.isPackaged) {

        return path.join(
            process.resourcesPath,
            "app",
            "backend",
            "server.js"
        );

    }

    return path.join(
        __dirname,
        "..",
        "backend",
        "server.js"
    );

}


// =====================================
// START BACKENDU
// =====================================

function startBackend() {

    const serverPath =
        getBackendPath();


    log(
        "====================================="
    );

    log(
        "START BACKENDU"
    );

    log(
        `Backend path: ${serverPath}`
    );

    log(
        `Packaged: ${app.isPackaged}`
    );

    log(
        `Exec path: ${process.execPath}`
    );


    if (!fs.existsSync(serverPath)) {

        log(
            "BŁĄD: server.js NIE ISTNIEJE!"
        );

        dialog.showErrorBox(
            "Błąd backendu",
            `Nie znaleziono:\n\n${serverPath}`
        );

        return;

    }


    backendProcess =
        spawn(
            process.execPath,
            [serverPath],
            {
                cwd: path.dirname(serverPath),

                windowsHide: true,

                env: {
                    ...process.env,

                    ELECTRON_RUN_AS_NODE: "1",

                    NODE_ENV:
                        "production"
                },

                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            }
        );


    log(
        `Backend PID: ${backendProcess.pid}`
    );


    backendProcess.stdout.on(
        "data",
        (data) => {

            log(
                `[BACKEND] ${data.toString().trim()}`
            );

        }
    );


    backendProcess.stderr.on(
        "data",
        (data) => {

            log(
                `[BACKEND ERROR] ${data.toString().trim()}`
            );

        }
    );


    backendProcess.on(
        "error",
        (error) => {

            log(
                `SPAWN ERROR: ${error.stack || error}`
            );

        }
    );


    backendProcess.on(
        "exit",
        (code, signal) => {

            log(
                `BACKEND EXIT code=${code} signal=${signal}`
            );

        }
    );

}


// =====================================
// SPRAWDZANIE BACKENDU
// =====================================

function checkBackend(
    callback,
    attempts = 30
) {

    const request =
        http.get(
            "http://127.0.0.1:3000/api",
            (response) => {

                response.resume();


                if (
                    response.statusCode === 200
                ) {

                    log(
                        "BACKEND DZIAŁA"
                    );

                    callback(
                        true
                    );

                } else {

                    retry();

                }

            }
        );


    request.on(
        "error",
        () => {

            retry();

        }
    );


    request.setTimeout(
        1000,
        () => {

            request.destroy();

            retry();

        }
    );


    function retry() {

        if (
            attempts <= 0
        ) {

            log(
                "BACKEND NIE ODPOWIADA"
            );

            callback(
                false
            );

            return;

        }


        setTimeout(
            () => {

                checkBackend(
                    callback,
                    attempts - 1
                );

            },
            500
        );

    }

}


// =====================================
// OKNO
// =====================================

function createWindow(
    backendOK
) {

    const win =
        new BrowserWindow({

            width: 1600,

            height: 900,

            minWidth: 1000,

            minHeight: 650,

            title:
                "Technologia Plus Service Manager",

            webPreferences: {

                nodeIntegration: false,

                contextIsolation: true

            }

        });


    if (backendOK) {

        log(
            "Ładuję http://127.0.0.1:3000"
        );

        win.loadURL(
            "http://127.0.0.1:3000"
        );

    } else {

        log(
            "Backend nie działa — nie ładuję aplikacji."
        );


        win.loadURL(
            "data:text/html;charset=utf-8," +
            encodeURIComponent(`
                <html>
                <body style="
                    font-family:Arial;
                    padding:40px;
                    background:#f3f4f6;
                ">
                    <h1>Technologia Plus</h1>

                    <h2>
                        Nie udało się uruchomić backendu.
                    </h2>

                    <p>
                        Backend powinien działać na:
                    </p>

                    <code>
                        http://127.0.0.1:3000
                    </code>

                    <p>
                        Szczegóły zapisano tutaj:
                    </p>

                    <code>
                        ${logFile}
                    </code>
                </body>
                </html>
            `)
        );

    }


    win.webContents.openDevTools();

}


// =====================================
// START
// =====================================

app.whenReady().then(
    () => {

        log(
            "Electron uruchomiony."
        );


        startBackend();


        checkBackend(
            (backendOK) => {

                createWindow(
                    backendOK
                );

            }
        );

    }
);


// =====================================
// ZAMKNIĘCIE
// =====================================

function stopBackend() {

    if (
        backendProcess &&
        !backendProcess.killed
    ) {

        log(
            "Zamykanie backendu..."
        );


        try {

            backendProcess.kill();

        } catch (error) {

            log(
                `Błąd zamykania: ${error}`
            );

        }


        backendProcess = null;

    }

}


app.on(
    "before-quit",
    () => {

        stopBackend();

    }
);


app.on(
    "window-all-closed",
    () => {

        stopBackend();


        if (
            process.platform !== "darwin"
        ) {

            app.quit();

        }

    }
);
