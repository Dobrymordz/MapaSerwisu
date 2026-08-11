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
// ZLECENIA
// ===============================

app.get("/tasks", (req, res) => {

    try {

        const filePath = path.join(
            __dirname,
            "../frontend/data/data.json"
        );

        const tasks = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        res.json(tasks);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Nie udało się odczytać data.json"
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