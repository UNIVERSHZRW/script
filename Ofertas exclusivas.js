function startCountdown(duration, display, button) {
    let timer = duration;
    const interval = setInterval(() => {
        const hours = String(Math.floor(timer / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timer % 3600) / 60)).padStart(2, '0');
        const seconds = String(timer % 60).padStart(2, '0');

        display.textContent = `${hours}:${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(interval);
            display.textContent = "¡Oferta finalizada!";
            button.classList.add('disabled');
            button.textContent = "Oferta Cerrada";
        }
    }, 1000);
}

window.onload = function () {
    const countdownTime = 10 * 60; // 10 minutos en segundos
    const display = document.querySelector('#countdown');
    const button = document.querySelector('#buyNowButton');
    startCountdown(countdownTime, display, button);
};
