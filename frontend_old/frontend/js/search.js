function initSearch() {

    const input = document.getElementById("search");

    input.addEventListener("input", async function () {

        const text = this.value.toLowerCase();

        const tasks = await loadTasks();

        const filtered = tasks.filter(task =>
            task.title.toLowerCase().includes(text) ||
            task.customer.toLowerCase().includes(text)
        );

        drawTasks(filtered);

    });

}