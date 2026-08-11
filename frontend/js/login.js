document.addEventListener("DOMContentLoaded", () => {

    const app = document.getElementById("app");
    const loginScreen = document.getElementById("loginScreen");
    const form = document.getElementById("loginForm");

    if (!app || !loginScreen || !form) {
        console.error("Nie znaleziono elementów logowania.");
        return;
    }

    // Jeśli użytkownik był już zalogowany
    if (localStorage.getItem("tp_logged") === "true") {

        loginScreen.style.display = "none";
        app.style.display = "flex";

        if (typeof loadPage === "function") {
            loadPage("dashboard");
        }

        return;
    }

    // Pokaż ekran logowania
    loginScreen.style.display = "flex";
    app.style.display = "none";

    form.addEventListener("submit", (e) => {

        e.preventDefault();

        const login = document.getElementById("login").value.trim();
        const password = document.getElementById("password").value.trim();

        // Pobierz zapisane hasło lub ustaw domyślne
const savedPassword = localStorage.getItem("password") || "admin";

if (login === "admin" && password === savedPassword) {
    // Ustaw domyślne hasło tylko przy pierwszym uruchomieniu
if (!localStorage.getItem("password")) {

    localStorage.setItem("password", "admin");

}

            localStorage.setItem("tp_logged", "true");

            loginScreen.style.display = "none";
            app.style.display = "flex";

            if (typeof loadPage === "function") {
                loadPage("dashboard");
            }

        } else {

            alert("Niepoprawny login lub hasło.");

        }

    });

});

// Funkcja wylogowania
function logout() {

    localStorage.removeItem("tp_logged");
    location.reload();

}
document.addEventListener("click",(e)=>{

    const button=document.getElementById("userButton");
    const menu=document.getElementById("userDropdown");

    if(!button || !menu) return;

    if(button.contains(e.target)){

        menu.style.display=
            menu.style.display==="block"
            ?"none"
            :"block";

        return;

    }

    menu.style.display="none";

});