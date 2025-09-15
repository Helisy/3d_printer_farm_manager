const current_params = window.location.pathname.split("/");
document.getElementById(current_params[1]).classList.add("selected");

const side_nav = document.querySelector("#side_nav");

let is_swtp_open = localStorage.getItem("is_swtp_open") === "true";

const options = side_nav.querySelectorAll(".option");
const tab_sw = document.querySelector("#tab_sw");

if (is_swtp_open) {
    side_nav.classList.add("open");
    options.forEach(opt => opt.classList.remove("close"));
} else {
    side_nav.classList.add("close");
    options.forEach(opt => opt.classList.add("close"));
}

const switch_tab = () => {
    if (is_swtp_open) {
        side_nav.classList.add("closing");
        side_nav.classList.remove("opening", "open");

        options.forEach(opt => opt.classList.add("close"));
    } else {
        side_nav.classList.add("opening");
        side_nav.classList.remove("closing", "close");

        options.forEach(opt => opt.classList.remove("close"));
    }
};

tab_sw.addEventListener("click", switch_tab);

side_nav.addEventListener("animationend", () => {
    if (is_swtp_open) {
        side_nav.classList.remove("closing");
        side_nav.classList.add("close");

        is_swtp_open = false;
    } else {
        side_nav.classList.remove("opening");
        side_nav.classList.add("open");

        is_swtp_open = true;
    }

    localStorage.setItem("is_swtp_open", is_swtp_open.toString());
});