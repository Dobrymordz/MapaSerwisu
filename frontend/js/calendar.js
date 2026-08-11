let calendarDate = new Date();
let calendarTasks = [];


async function renderCalendar() {

    const calendarGrid = document.getElementById("calendarGrid");
    const calendarTitle = document.getElementById("calendarTitle");

    if (!calendarGrid || !calendarTitle) {
        return;
    }

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthNames = [
        "Styczeń",
        "Luty",
        "Marzec",
        "Kwiecień",
        "Maj",
        "Czerwiec",
        "Lipiec",
        "Sierpień",
        "Wrzesień",
        "Październik",
        "Listopad",
        "Grudzień"
    ];

    calendarTitle.textContent =
        `${monthNames[month]} ${year}`;

    calendarGrid.innerHTML = "";


    // ===============================
    // USTALENIE POCZĄTKU MIESIĄCA
    // ===============================

    const firstDay = new Date(year, month, 1);

    let startDay = firstDay.getDay();

    // Poniedziałek = 0
    startDay = startDay === 0 ? 6 : startDay - 1;


    // ===============================
    // LICZBA DNI
    // ===============================

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    // ===============================
    // POBIERANIE ZLECEŃ
    // ===============================

    try {

        const response = await fetch("/tasks");

        if (!response.ok) {
            throw new Error("Nie udało się pobrać zleceń");
        }

        calendarTasks = await response.json();

        console.log("Zlecenia kalendarza:", calendarTasks);

    } catch (error) {

        console.error(
            "Błąd pobierania zleceń:",
            error
        );

        calendarTasks = [];

    }


    // ===============================
    // DZISIAJ
    // ===============================

    const today = new Date();


    // ===============================
    // PUSTE POLA
    // ===============================

    for (let i = 0; i < startDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendarGrid.appendChild(emptyDay);

    }


    // ===============================
    // DNI MIESIĄCA
    // ===============================

    for (let day = 1; day <= daysInMonth; day++) {

        const dayElement =
            document.createElement("div");

        dayElement.className =
            "calendar-day";


        // Numer dnia

        const numberElement =
            document.createElement("div");

        numberElement.className =
            "calendar-day-number";

        numberElement.textContent =
            day;

        dayElement.appendChild(
            numberElement
        );


        // ===============================
        // PODŚWIETLENIE DZISIAJ
        // ===============================

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {

            dayElement.classList.add("today");

        }


        // ===============================
        // ZLECENIA W TYM DNIU
        // ===============================

        const dayTasks =
            calendarTasks.filter(task => {

                if (!task.date) {
                    return false;
                }

                // Nie używamy new Date("YYYY-MM-DD"),
                // tylko rozbijamy datę ręcznie.

                const parts =
                    task.date.split("-");

                if (parts.length !== 3) {
                    return false;
                }

                const taskYear =
                    Number(parts[0]);

                const taskMonth =
                    Number(parts[1]) - 1;

                const taskDay =
                    Number(parts[2]);


                return (
                    taskYear === year &&
                    taskMonth === month &&
                    taskDay === day
                );

            });


        // ===============================
        // WYŚWIETLANIE ZLECEŃ
        // ===============================

        dayTasks.forEach(task => {

            const taskElement =
                document.createElement("div");

            taskElement.className =
                "calendar-task";


            taskElement.innerHTML = `
                <strong>
                    ${task.customer || task.title || "Zlecenie"}
                </strong>

                <span>
                    ${task.time || ""}
                </span>

                <small>
                    ${task.technician || ""}
                </small>
            `;


            // Kliknięcie zlecenia

            taskElement.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    openTaskModal(task);

                }
            );


            dayElement.appendChild(
                taskElement
            );

        });


        calendarGrid.appendChild(
            dayElement
        );

    }

}


// ===============================
// POPRZEDNI MIESIĄC
// ===============================

function previousMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() - 1
    );

    renderCalendar();

}


// ===============================
// NASTĘPNY MIESIĄC
// ===============================

function nextMonth() {

    calendarDate.setMonth(
        calendarDate.getMonth() + 1
    );

    renderCalendar();

}


// ===============================
// DZISIAJ
// ===============================

function goToToday() {

    calendarDate = new Date();

    renderCalendar();

}


// ===============================
// OKNO SZCZEGÓŁÓW
// ===============================

function openTaskModal(task) {

    const modal =
        document.getElementById("taskModal");

    if (!modal) {
        return;
    }


    document.getElementById(
        "modalTaskTitle"
    ).textContent =
        task.title ||
        task.customer ||
        "Szczegóły zlecenia";


    document.getElementById(
        "modalCustomer"
    ).textContent =
        task.customer || "-";


    document.getElementById(
        "modalCity"
    ).textContent =
        task.city || "-";


    document.getElementById(
        "modalAddress"
    ).textContent =
        task.address || "-";


    document.getElementById(
        "modalTechnician"
    ).textContent =
        task.technician || "-";


    document.getElementById(
        "modalDate"
    ).textContent =
        formatTaskDate(task.date);


    document.getElementById(
        "modalTime"
    ).textContent =
        task.time || "-";


    document.getElementById(
        "modalStatus"
    ).textContent =
        task.status || "-";


    document.getElementById(
        "modalPriority"
    ).textContent =
        task.priority || "-";


    // ===============================
    // POKAŻ NA MAPIE
    // ===============================

    const mapButton =
        document.getElementById(
            "showOnMapButton"
        );


    if (mapButton) {

        mapButton.onclick = function() {

            closeTaskModal();

            window.selectedTaskOnMap =
                task;


            const mapButtonMenu =
                document.querySelector(
                    '.menu-btn[data-page="mapa"]'
                );


            if (mapButtonMenu) {

                mapButtonMenu.click();

            }

        };

    }


    modal.classList.add("active");

}


// ===============================
// ZAMYKANIE OKNA
// ===============================

function closeTaskModal() {

    const modal =
        document.getElementById("taskModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

}


// ===============================
// FORMAT DATY
// ===============================

function formatTaskDate(date) {

    if (!date) {
        return "-";
    }

    const parts =
        date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return (
        `${parts[2]}.${parts[1]}.${parts[0]}`
    );

}


// ===============================
// URUCHOMIENIE KALENDARZA
// ===============================

function initCalendar() {

    const previousButton =
        document.getElementById("prevMonth");

    const nextButton =
        document.getElementById("nextMonth");

    const todayButton =
        document.getElementById("todayButton");

    const closeButton =
        document.getElementById("closeTaskModal");


    if (
        !previousButton ||
        !nextButton ||
        !todayButton
    ) {
        return;
    }


    previousButton.onclick =
        previousMonth;

    nextButton.onclick =
        nextMonth;

    todayButton.onclick =
        goToToday;


    if (closeButton) {

        closeButton.onclick =
            closeTaskModal;

    }


    const modal =
        document.getElementById("taskModal");


    if (modal) {

        modal.onclick = function(event) {

            if (event.target === modal) {

                closeTaskModal();

            }

        };

    }


    renderCalendar();

}