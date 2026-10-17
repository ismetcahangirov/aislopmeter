// Typing effect
const words = ['Deneyimi', 'Tutkuyu', 'Mükemmelliği', 'Geleceği'];
let i = 0, j = 0, isDeleting = false;
const el = document.querySelector('.typing');
function type() {
  if (!el) return;
  const word = words[i];
  el.textContent = isDeleting ? word.substring(0, j--) : word.substring(0, j++);
  if (!isDeleting && j === word.length + 1) { isDeleting = true; setTimeout(type, 1500); return; }
  if (isDeleting && j === 0) { isDeleting = false; i = (i + 1) % words.length; }
  setTimeout(type, isDeleting ? 60 : 120);
}
type();

// Fade in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
});
document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
