function getTaskType(title){

    title = title.toLowerCase();

    if(title.includes("awaria"))
        return "Awaria";

    if(title.includes("przegląd"))
        return "Przegląd";

    if(title.includes("przeglad"))
        return "Przegląd";

    if(title.includes("naprawa"))
        return "Naprawa";

    if(title.includes("montaż"))
        return "Montaż";

    if(title.includes("montaz"))
        return "Montaż";

    return "Inne";

}