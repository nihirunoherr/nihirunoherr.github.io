async function login() {
  const token = document.getElementById("cordtoken").value.trim()
  window.rest = RestAPI(constant.api, 9, token)
  let response = await window.rest.get("/users/@me")
  const user = await response.json()
  if (response.status !== 200) {
    const error_text = document.getElementById("error-text")
    if (response.status === 401) {
      error_text.textContent = "Invalid token provided"
    } else {
      error_text.textContent = user.message
    }
    window.modal.showModal();
    return
  }
  response = await window.rest.get(`/users/${user.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`)
  const profile = await response.json()

  const continueButton = document.getElementById("login-continue");
  const welcomeBack = document.getElementById("welcome-back")
  welcomeBack.after(render.Profile(user, profile))
  welcomeBack.textContent = helpers.selectRandom(constant.welcomeBack)
  continueButton.addEventListener("click", () => {
    localStorage.setItem("token", token);
    location.href = "/app.html"
  })

  welcomeBack.style.display = "block";
  continueButton.style.display = "block";
  document.getElementById("login").remove()
  response = undefined
  delete window.rest
  delete window.modal // cleanup
}


document.addEventListener("DOMContentLoaded", () => {
  window.modal = document.getElementById("error")
  modal.addEventListener("click", e => {
    if (e.target.tagName !== "DIALOG") {
      return
    }
    const rect = e.target.getBoundingClientRect();

    if (!(rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width)) {
      e.target.close();
    }
  })
  document.getElementById("log").addEventListener("click", login)
})
