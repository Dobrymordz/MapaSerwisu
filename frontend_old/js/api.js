async function loadTasks() {

    const response = await fetch("/tasks");

    return await response.json();

}