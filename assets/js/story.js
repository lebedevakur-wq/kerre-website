// Highlight chapters only while they are in the reading area.
(() => {
  const chapters = document.querySelectorAll('.story-chapters .chapter');
  if (!chapters.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('chapter-read', entry.isIntersecting);
    });
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0.15 });

  chapters.forEach((chapter) => observer.observe(chapter));
})();
