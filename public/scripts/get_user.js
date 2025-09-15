async function getUser() {
    let current_user = await fetchInfo("/api/v1/users/current");
   
    if(current_user.code == 200){
        localStorage.setItem("user", JSON.stringify(current_user.data));
    }else{
        localStorage.removeItem("user");
    }
}

getUser();

async function logout() {
    const res = await fetchInfo(`/api/v1/auth/logout`);
    window.location.replace(res.redirect);
}