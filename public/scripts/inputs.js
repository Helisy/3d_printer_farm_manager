        const inpts = document.querySelectorAll(".inpt.anim");
        inpts.forEach(element => {
            element.addEventListener("animationend", e => {
                element.classList.remove("error");
                element.classList.remove("success");
            });
        });
