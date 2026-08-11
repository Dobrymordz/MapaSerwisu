document.addEventListener("DOMContentLoaded",()=>{

    const sidebar=document.querySelector(".sidebar");

    const btn=document.getElementById("toggleSidebar");

    if(!sidebar || !btn) return;

    if(localStorage.getItem("sidebar")=="collapsed"){

        sidebar.classList.add("collapsed");

    }

    btn.onclick=()=>{

        sidebar.classList.toggle("collapsed");

        localStorage.setItem(

            "sidebar",

            sidebar.classList.contains("collapsed")

            ?"collapsed"

            :"expanded"

        );

    };

});