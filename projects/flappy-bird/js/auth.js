'use strict';

const Auth = (() => {
  const USERS_KEY   = 'flappy-users';
  const SESSION_KEY = 'flappy-session';

  /* ── Storage helpers ─────────────────────────────────────────────────── */
  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  }
  function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }
  function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username }));
  }

  /* ── Auth logic ──────────────────────────────────────────────────────── */
  function register(username, password) {
    username = username.trim();
    if (!username || username.length < 3)  throw new Error('Username must be at least 3 characters');
    if (!password || password.length < 4)  throw new Error('Password must be at least 4 characters');
    const users = getUsers();
    if (users[username]) throw new Error('Username is already taken');
    users[username] = {
      username,
      pw: btoa(password),
      highScore: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
    };
    saveUsers(users);
    return users[username];
  }

  function login(username, password) {
    username = username.trim();
    const users = getUsers();
    const user  = users[username];
    if (!user)                       throw new Error('User not found');
    if (user.pw !== btoa(password))  throw new Error('Incorrect password');
    return user;
  }

  function updateHighScore(username, score) {
    const users = getUsers();
    if (!users[username]) return;
    users[username].gamesPlayed++;
    if (score > users[username].highScore) users[username].highScore = score;
    saveUsers(users);
  }

  return { register, login, getSession, setSession, updateHighScore, getUsers };
})();

/* ── UI ──────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.getSession();

  /* Load stats for returning user */
  if (session) {
    loadStats(session.username);
  }

  /* ── Tab switching ───────────────────────────────────────────────────── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
      document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    });
  });

  /* ── Toggle password visibility ──────────────────────────────────────── */
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });

  /* ── Password strength ───────────────────────────────────────────────── */
  const regPwd = document.getElementById('regPassword');
  if (regPwd) {
    regPwd.addEventListener('input', () => {
      const val = regPwd.value;
      const bar = document.querySelector('.strength-bar');
      const txt = document.querySelector('.strength-text');
      let strength = 0;
      if (val.length >= 4)  strength++;
      if (val.length >= 8)  strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;

      const levels = [
        { w: '0%',   color: '#ef4444', label: '' },
        { w: '25%',  color: '#ef4444', label: 'Weak' },
        { w: '50%',  color: '#f59e0b', label: 'Fair' },
        { w: '75%',  color: '#10b981', label: 'Good' },
        { w: '90%',  color: '#10b981', label: 'Strong' },
        { w: '100%', color: '#6d28d9', label: 'Great!' },
      ];
      const lv = levels[Math.min(strength, 5)];
      bar.style.setProperty('--strength', lv.w);
      bar.style.setProperty('--strength-color', lv.color);
      txt.style.color = lv.color;
      txt.textContent = lv.label;
    });
  }

  /* ── Login form ──────────────────────────────────────────────────────── */
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btnText  = document.querySelector('#loginForm .btn-text');
    const btnLoader = document.querySelector('#loginForm .btn-loader');

    hideError(errEl);
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    await delay(400);

    try {
      const user = Auth.login(username, password);
      if (document.getElementById('rememberMe').checked) {
        Auth.setSession(user);
      } else {
        sessionStorage.setItem('flappy-session-temp', JSON.stringify({ username: user.username }));
        Auth.setSession(user);
      }
      window.location.href = 'game.html';
    } catch (err) {
      showError(errEl, err.message);
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  });

  /* ── Register form ───────────────────────────────────────────────────── */
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirm  = document.getElementById('regConfirm').value;
    const errEl    = document.getElementById('registerError');
    const btnText  = document.querySelector('#registerForm .btn-text');
    const btnLoader = document.querySelector('#registerForm .btn-loader');

    hideError(errEl);

    if (password !== confirm) {
      showError(errEl, 'Passwords do not match');
      return;
    }

    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    await delay(400);

    try {
      const user = Auth.register(username, password);
      Auth.setSession(user);
      window.location.href = 'game.html';
    } catch (err) {
      showError(errEl, err.message);
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  });

  /* ── Guest play ──────────────────────────────────────────────────────── */
  document.getElementById('guestBtn').addEventListener('click', () => {
    Auth.setSession({ username: 'Guest' });
    window.location.href = 'game.html';
  });

  /* ── Forgot password (no-op with local storage) ──────────────────────── */
  document.querySelector('.forgot-link')?.addEventListener('click', e => {
    e.preventDefault();
    alert('Hint: Check your local storage 😄\nThis is a local-only game — no password recovery available.');
  });
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('visible');
}
function hideError(el) {
  el.classList.remove('visible');
}
function loadStats(username) {
  const users = Auth.getUsers();
  const user  = users[username];
  if (user) {
    document.getElementById('displayHighScore').textContent = user.highScore || 0;
    document.getElementById('displayGames').textContent     = user.gamesPlayed || 0;
  }
}
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
