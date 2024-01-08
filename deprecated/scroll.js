const main = document.querySelector("main");
const tabBar = document.getElementById("tab-bar")

function scrollMain(direction) {
  main.scrollLeft = direction * window.innerWidth;
}

main.addEventListener("scroll", () => {
  tabBar.style.translate = main.scrollLeft == window.innerWidth ? "0 100%" : "0"
}); // LEGACY CODE NOT IN USE, PRESERVED UNTIL BETTER TIMES