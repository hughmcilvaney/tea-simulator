// Thin DOM helpers for the HUD.
const el = (id) => document.getElementById(id);

let toastTimer = null;

export const ui = {
  showHud() { el('hud').classList.remove('hidden'); },
  hideHud() { el('hud').classList.add('hidden'); },

  setObjective(step, total, text) {
    el('objective-step').textContent = `Step ${step}/${total}`;
    el('objective-text').textContent = text;
  },

  prompt(html) {
    const p = el('prompt');
    if (html) {
      p.innerHTML = html;
      p.classList.remove('hidden');
    } else {
      p.classList.add('hidden');
    }
  },

  reticleHot(hot) {
    el('reticle').classList.toggle('hot', hot);
  },

  toast(msg, kind = 'info', ms = 2400) {
    const t = el('toast');
    t.textContent = msg;
    t.className = kind; // clears 'hidden'
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  },

  showSuccess(desc, timeText) {
    el('success-desc').textContent = desc;
    el('success-time').textContent = timeText;
    el('success').classList.remove('hidden');
  },
};
