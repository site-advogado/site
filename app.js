const URL_API = 'https://api-advogada.siterefrigeracaoeliezer.workers.dev/api/v1';
let countdownInterval;
let deferredPrompt;

// ── PWA Install ──────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installApp');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    });
  }
});

// ── Loading ───────────────────────────────────────────────
function showLoading() { document.getElementById('globalLoader').classList.replace('hidden', 'flex'); }
function hideLoading() { document.getElementById('globalLoader').classList.replace('flex', 'hidden'); }

// ── Modais ────────────────────────────────────────────────
function showErrorModal(msg) {
  document.getElementById('errorMessage').textContent = msg;
  document.getElementById('modalError').classList.replace('hidden', 'flex');
}
function closeErrorModal() { document.getElementById('modalError').classList.replace('flex', 'hidden'); }

function openOtpModal() {
  document.getElementById('inputOtp').value = '';
  document.getElementById('modalCode').classList.replace('hidden', 'flex');
  startTimer(180);
  setTimeout(() => { document.getElementById('inputOtp').focus(); }, 100);
}
function closeOtpModal() {
  document.getElementById('modalCode').classList.replace('flex', 'hidden');
  clearInterval(countdownInterval);
}

// ── Timer OTP ─────────────────────────────────────────────
function startTimer(seconds) {
  clearInterval(countdownInterval);
  let remaining = seconds;
  const el = document.getElementById('timer');
  if (el) el.textContent = formatTime(remaining);

  countdownInterval = setInterval(() => {
    remaining--;
    if (el) el.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      closeOtpModal();
      showErrorModal('Código expirado. Solicite um novo acesso.');
    }
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Bio pública ───────────────────────────────────────────
function fetchBio() {
  showLoading();
  fetch(URL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'bio' })
  })
    .then(r => r.json())
    .then(data => {
      const nameEl = document.getElementById('bio-name');
      const oabEl = document.getElementById('bio-oab');
      const descEl = document.getElementById('bio-desc');
      const imgEl = document.getElementById('bio-img');
      const phoneEl = document.getElementById('bio-phone');
      const emailEl = document.getElementById('bio-email');

      if (nameEl) nameEl.textContent = data.name || 'Advogada';
      if (oabEl) oabEl.textContent = data.oab || '';
      if (descEl) descEl.textContent = data.desc || '';
      if (imgEl && data.img) imgEl.src = data.img;
      if (phoneEl && data.phone)
        phoneEl.href = `https://wa.me/55${data.phone.toString().replace(/\D/g, '')}`;
      if (emailEl && data.email_advogada)
        emailEl.href = `mailto:${data.email_advogada}`;

      // Mostrar dica de primeiro acesso se nome não configurado
      const hint = document.getElementById('admin-hint');
      if (hint && (!data.name || data.name.length < 3)) {
        hint.classList.remove('hidden');
      }
    })
    .catch(() => {
      const nameEl = document.getElementById('bio-name');
      if (nameEl) nameEl.textContent = 'Erro ao conectar';
    })
    .finally(hideLoading);
}

// ── Passo 1: Solicitar OTP ────────────────────────────────
async function handleClientSearch() {
  const emailInput = document.getElementById('searchCpf');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email) return showErrorModal('Por favor, preencha o campo com seu e-mail.');

  showLoading();
  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', usuario: email, passo: 'solicitar' })
    });
    const data = await res.json();

    if (data.status === 'ir_para_admin' || data.status === 'abrir_manutencao') {
      window.location.href = 'manutencao.html';
      return;
    }

    if (data.status === 'codigo_enviado') {
      // Guarda o email para o passo 2
      sessionStorage.setItem('ADV_OTP_EMAIL', email);
      openOtpModal();
    } else {
      showErrorModal(data.message || 'E-mail não encontrado no sistema.');
    }
  } catch (err) {
    showErrorModal('Erro na comunicação com o servidor. Tente novamente.');
  } finally {
    hideLoading();
  }
}

// ── Passo 2: Confirmar OTP ────────────────────────────────
async function confirmCode() {
  const otpInput = document.getElementById('inputOtp');
  const codigo = otpInput ? otpInput.value.trim() : '';
  const email = sessionStorage.getItem('ADV_OTP_EMAIL') || '';

  if (!codigo || codigo.length !== 6) {
    showErrorModal('Digite o código de 6 dígitos enviado ao seu e-mail.');
    return;
  }
  if (!email) {
    showErrorModal('Sessão expirada. Reinicie o processo.');
    closeOtpModal();
    return;
  }

  showLoading();
  closeOtpModal();

  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', usuario: email, codigo, passo: 'verificar' })
    });
    const data = await res.json();

    if (data.status === 'ok') {
      sessionStorage.removeItem('ADV_OTP_EMAIL');
      clearInterval(countdownInterval);
      window.location.href = 'timeline.html';
    } else {
      showErrorModal(data.message || 'Código inválido ou expirado. Tente novamente.');
    }
  } catch (err) {
    showErrorModal('Erro ao validar o código. Tente novamente.');
  } finally {
    hideLoading();
  }
}

// ── Tema ──────────────────────────────────────────────────
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ADV_GLOBAL_THEME', isDark ? 'dark' : 'light');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
}

// ── Iniciar ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('ADV_GLOBAL_THEME') === 'dark';
  const icon = document.getElementById('themeIcon');
  if (isDark && icon) icon.classList.replace('fa-moon', 'fa-sun');
  fetchBio();
});
