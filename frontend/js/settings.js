function togglePassword(id, button){

    const input = document.getElementById(id);

    const icon = button.querySelector("i");

    if(input.type==="password"){

        input.type="text";

        icon.className="fa-solid fa-eye-slash";

    }else{

        input.type="password";

        icon.className="fa-solid fa-eye";

    }

}

function changePassword(){

    const current=document.getElementById("currentPassword").value;

    const password=document.getElementById("newPassword").value;

    const repeat=document.getElementById("repeatPassword").value;

    const message=document.getElementById("passwordMessage");

    const saved=localStorage.getItem("password") || "admin";

    if(current!==saved){

        message.style.color="#ef4444";
        message.innerHTML="❌ Aktualne hasło jest nieprawidłowe.";

        return;

    }

    if(password.length<8){

        message.style.color="#ef4444";
        message.innerHTML="❌ Hasło musi mieć minimum 8 znaków.";

        return;

    }

    if(password!==repeat){

        message.style.color="#ef4444";
        message.innerHTML="❌ Nowe hasła nie są identyczne.";

        return;

    }

    if(password===current){

        message.style.color="#ef4444";
        message.innerHTML="❌ Nowe hasło musi być inne.";

        return;

    }

    localStorage.setItem("password",password);

    message.style.color="#22c55e";
    message.innerHTML="✅ Hasło zostało zmienione.";

    document.getElementById("currentPassword").value="";
    document.getElementById("newPassword").value="";
    document.getElementById("repeatPassword").value="";

}