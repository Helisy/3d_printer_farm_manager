
function pushNotify(type, message){ 
    const icon = notification.querySelector("i");
    const body = notification.querySelector("div");
    const text = notification.querySelector("div > p");

    switch (type) {
        case "success":
            icon.className = "fa-solid fa-check";
            body.classList.add("success");
            body.classList.remove("error");
            break;
        case "error":
            icon.className = "fa-solid fa-circle-exclamation";
            body.classList.remove("success");
            body.classList.add("error");
            break;
        default:
            break;
    }

    text.innerHTML = message;
    notification.style.display = "unset"
}

notification.onanimationend = () => {
    notification.style.display = "none"
};  