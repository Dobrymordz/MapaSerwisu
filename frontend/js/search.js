cat > frontend/js/search.js <<'EOF'
async function initSearch() {

    const input = document.getElementById("globalSearch");
    const box = document.getElementById("searchResults");

    if (!input || !box) {
        return;
    }

    input.addEventListener("input", async () => {

        const value = input.value.trim().toLowerCase();

        box.innerHTML = "";

        if (value.length < 2) {
            box.style.display = "none";
            return;
        }

        // Pobieramy aktualne dane
        const tasks = await getTasks(true);

        const results = tasks.filter(task => {

            const title =
                String(task.title || "").toLowerCase();

            const customer =
                String(task.customer || "").toLowerCase();

            const city =
                String(task.city || "").toLowerCase();

            const address =
                String(task.address || "").toLowerCase();

            return (
                title.includes(value) ||
                customer.includes(value) ||
                city.includes(value) ||
                address.includes(value)
            );

        });

        results.slice(0, 8).forEach(task => {

            const div = document.createElement("div");

            div.className = "search-item";

            div.innerHTML = `
                <b>${task.title || "Zlecenie"}</b>
                <br>
                <span>${task.customer || ""}</span>
                <br>
                <small>
                    ${task.city || ""}
                </small>
            `;

            div.addEventListener("click", async () => {

                box.style.display = "none";
                input.value = "";

                window.selectedTaskOnMap = task;

                await loadPage("mapa");

            });

            box.appendChild(div);

        });

        box.style.display =
            results.length > 0
                ? "block"
                : "none";

    });

    // Kliknięcie poza wyszukiwarką
    document.addEventListener("click", event => {

        if (
            !input.contains(event.target) &&
            !box.contains(event.target)
        ) {

            box.style.display = "none";

        }

    });

}
EOF