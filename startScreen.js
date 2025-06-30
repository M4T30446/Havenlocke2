window.addEventListener("load", () => {
  const startScreen = document.getElementById("startScreen");
  const ost = document.getElementById("ost");

  startScreen.addEventListener("click", () => {
    startScreen.style.display = "none";
    ost.play().catch(() => {
      // autoplay pode ser bloqueado, ignora
    });

    // Agora inicia o jogo
    if (typeof loop === "function") {
      loop();
    }
  });
});
