let cache = null;

async function getTasks(forceRefresh = false) {
    if (cache && !forceRefresh) {
        return cache;
    }

    const response = await fetch("/tasks");

    if (!response.ok) {
        throw new Error("Nie udało się pobrać zleceń");
    }

    cache = await response.json();

    return cache;
}
