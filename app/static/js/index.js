document.addEventListener('DOMContentLoaded', function () {
    // Carousel auto-scroll (benefícios)
    const carousel = document.getElementById('carousel');
    let autoScroll;
    if (carousel) {
    function startAuto() {
        // scroll by half container width to show the next two-card group
        autoScroll = setInterval(() => {
        const step = carousel.clientWidth * 0.5;
        carousel.scrollBy({ left: step, behavior: 'smooth' });
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
        }
        }, 3800);
    }
    function stopAuto() { clearInterval(autoScroll); }
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    startAuto();
    }

    // Testimonials: pause/play handled via CSS hover; nothing needed here

    // Contact form demo handler
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        status.textContent = 'Enviando...';
        setTimeout(() => {
        status.textContent = 'Mensagem recebida — entraremos em contato em até 2 dias úteis.';
        form.reset();
        }, 900);
    });
    }
});