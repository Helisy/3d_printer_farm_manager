const loginForm = document.getElementById('loginForm');
const emailImp = document.getElementById('email');
const passwordImp = document.getElementById('password');
const warningCont = document.getElementById('warning');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch('/auth/login', {
        method: "post",
        headers: {"Content-type" : "application/json"},
        body: JSON.stringify({
            email : emailImp.value,
            password : passwordImp.value
        })
    }).then((res) => {
        return res.json();
    }).then((data) => {
        if(data.message)
        {
            warningCont.innerHTML = `
                <div class="warning">
                    <label>${data.message}</label>
                </div>
            `;
        }

        if(data.login) return window.location.replace("/");
    });
});