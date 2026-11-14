window.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-visual .hero-slide');
  if (!slides.length) return;

  let actual = 0;
  setInterval(() => {
    slides[actual].classList.remove('active');
    actual = (actual + 1) % slides.length;
    slides[actual].classList.add('active');
  }, 2000);
});