'use strict';

const ThemeManager = (() => {
  const KEY = 'flappy-theme';

  function get() {
    return localStorage.getItem(KEY) || 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-icon').forEach(el => {
      el.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
    localStorage.setItem(KEY, theme);
  }

  function toggle() {
    apply(get() === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(get());
    document.querySelectorAll('#themeToggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, get, apply, toggle };
})();

document.addEventListener('DOMContentLoaded', ThemeManager.init);
