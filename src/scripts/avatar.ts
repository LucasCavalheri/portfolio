import { semMovimento } from "./movimento";

// Foto: inclina de leve na direção do ponteiro, com o brilho acompanhando
const avatar = document.querySelector<HTMLElement>("#avatar");

if (avatar) {
  avatar.addEventListener("pointermove", (event) => {
    if (semMovimento()) return;
    const box = avatar.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    avatar.dataset.hover = "true";
    avatar.style.setProperty("--tilt-y", `${x * 12}deg`);
    avatar.style.setProperty("--tilt-x", `${y * -12}deg`);
    avatar.style.setProperty("--tilt-scale", "1.04");
    avatar.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
    avatar.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
  });

  const soltar = () => {
    delete avatar.dataset.hover;
    avatar.style.setProperty("--tilt-y", "0deg");
    avatar.style.setProperty("--tilt-x", "0deg");
    avatar.style.setProperty("--tilt-scale", "1");
  };

  avatar.addEventListener("pointerleave", soltar);
  avatar.addEventListener("pointercancel", soltar);
}
