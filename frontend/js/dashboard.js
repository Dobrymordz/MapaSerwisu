async function updateDashboard() {

    const tasks = await getTasks();

    const allCount =
        document.getElementById("allCount");

    const plannedCount =
        document.getElementById("plannedCount");

    const progressCount =
        document.getElementById("progressCount");

    const failureCount =
        document.getElementById("failureCount");


    if (allCount) {
        allCount.textContent =
            tasks.length;
    }


    if (plannedCount) {
        plannedCount.textContent =
            tasks.filter(
                t => t.status === "Zaplanowane"
            ).length;
    }


    if (progressCount) {
        progressCount.textContent =
            tasks.filter(
                t => t.status === "W trakcie"
            ).length;
    }


    if (failureCount) {
        failureCount.textContent =
            tasks.filter(
                t => t.status === "Awaria"
            ).length;
    }


    updateClock();
}


// =====================================
// ZEGAR
// =====================================

function updateClock() {

    const greetingElement =
        document.getElementById("greeting");

    const clockElement =
        document.getElementById("clock");

    const dateElement =
        document.getElementById("currentDate");


    // Nie jesteśmy na Dashboardzie

    if (
        !greetingElement &&
        !clockElement &&
        !dateElement
    ) {

        return;

    }


    const now =
        new Date();


    const hour =
        now.getHours();


    const greeting =
        hour < 12
            ? "Dzień dobry 👋"
            : hour < 18
                ? "Miłego popołudnia 👋"
                : "Dobry wieczór 👋";


    if (greetingElement) {

        greetingElement.textContent =
            greeting;

    }


    if (clockElement) {

        clockElement.textContent =
            now.toLocaleTimeString(
                "pl-PL"
            );

    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "pl-PL",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

    }

}


// =====================================
// AUTOMATYCZNY ZEGAR
// =====================================

let clockInterval = null;


function startClock() {

    // Od razu ustaw aktualną godzinę

    updateClock();


    // Jeżeli istnieje poprzedni timer,
    // usuwamy go

    if (clockInterval) {

        clearInterval(
            clockInterval
        );

    }


    // Aktualizacja co sekundę

    clockInterval =
        setInterval(
            updateClock,
            1000
        );

}


startClock();

