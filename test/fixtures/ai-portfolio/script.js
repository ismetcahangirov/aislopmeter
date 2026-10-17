// Typing Animation
const words = ["Full Stack Developer", "AI Enthusiast", "Content Creator", "Section 1st Graduate"];
let i = 0; let j = 0; let currentWord = ""; let isDeleting = false;
function type() { currentWord = words[i]; if (isDeleting) { document.querySelector(".typing").textContent = currentWord.substring(0, j - 1); j--; if (j == 0) { isDeleting = false; i++; if (i == words.length) i = 0; } } else { document.querySelector(".typing").textContent = currentWord.substring(0, j + 1); j++; if (j == currentWord.length) { isDeleting = true; } } setTimeout(type, isDeleting ? 100 : 200); }
// Cursor Following
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
document.addEventListener('mousemove', e => { cursor.style.top = e.pageY + 'px'; cursor.style.left = e.pageX + 'px'; setTimeout(() => { cursorFollower.style.top = e.pageY + 'px'; cursorFollower.style.left = e.pageX + 'px'; }, 100); });
// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
window.onload = type;
