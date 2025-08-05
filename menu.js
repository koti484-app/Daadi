document.getElementById('menu-btn').addEventListener('click', () => {
  const options = document.getElementById('menu-options');
  options.classList.toggle('hidden');
});

document.getElementById('play-ai').addEventListener('click', () => {
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  localStorage.setItem('mode', 'ai');
  localStorage.setItem('difficulty', difficulty);
  window.location.href = 'game.html';
});

document.getElementById('play-two').addEventListener('click', () => {
  localStorage.setItem('mode', 'human');
  window.location.href = 'game.html';
});
