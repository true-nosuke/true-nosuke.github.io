(() => {
  const track = document.getElementById('highlight-track');
  const slides = [...track.querySelectorAll('.highlight-slide')];
  const prev = document.getElementById('prev-slide');
  const next = document.getElementById('next-slide');
  const status = document.getElementById('carousel-status');
  let active = 0;
  const update = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    active = slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - track.offsetLeft - center) < Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - track.offsetLeft - center) ? i : best, 0);
    prev.disabled = active === 0;
    next.disabled = active === slides.length - 1;
    status.textContent = `${active + 1} / ${slides.length}`;
  };
  const go = index => {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    track.scrollTo({left: slide.offsetLeft - track.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  };
  prev.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  track.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
})();
