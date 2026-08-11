let allTasks = [];

async function start() {

    allTasks = await loadTasks();

    drawTasks(allTasks);

    initSearch();

    document
        .getElementById("statusFilter")
        .addEventListener("change", filterTasks);

}

function filterTasks() {

    const status = document.getElementById("statusFilter").value;

    if (status === "Wszystkie") {

        drawTasks(allTasks);

        return;

    }

    const filtered = allTasks.filter(task => task.status === status);

    drawTasks(filtered);

}

start();

document
    .getElementById("closeDetails")
    .addEventListener("click", () => {

        document.getElementById("detailsPanel").style.display = "none";

    });