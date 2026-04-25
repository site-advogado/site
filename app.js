  const URL_API = 'https://api-advogada.siterefrigeracaoeliezer.workers.dev/api/v1';
  let countdownInterval;
  let deferredPrompt;

  // ── PWA Install ──────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installApp').classList.remove('hidden');
  });
  document.getElementById('installApp')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('installApp').classList.add('hidden');
    deferredPrompt = null;
  });

  // ── Loading ───────────────────────────────────────────────
  function showLoading() { document.getElementById('globalLoader').classList.replace('hidden','flex'); }
  function hideLoading() { document.getElementById('globalLoader').classList.replace('flex','hidden'); }

  // ── Modais ────────────────────────────────────────────────
  function showErrorModal(msg) {
    // Usa textContent — nunca innerHTML — para evitar XSS
    document.getElementById('errorMessage').textContent = msg;
    document.getElementById('modalError').classList.replace('hidden','flex');
  }
  function closeErrorModal() { document.getElementById('modalError').classList.replace('flex','hidden'); }

  function openOtpModal() {
    document.getElementById('inputOtp').value = '';
    document.getElementById('modalCode').classList.replace('hidden','flex');
    startTimer(180);
  }
  function closeOtpModal() {
    document.getElementById('modalCode').classList.replace('flex','hidden');
    clearInterval(countdownInterval);
  }

  // ── Timer OTP ─────────────────────────────────────────────
  function startTimer(duration) {
    let remaining = duration;
    clearInterval(countdownInterval);
    const timerLabel = document.getElementById('timerLabel');
    const timerEl    = document.getElementById('timer');
    countdownInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        timerLabel.textContent = 'CÓDIGO EXPIRADO';
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
  }

  // ── Bio pública ───────────────────────────────────────────
  function fetchBio() {
    showLoading();
    fetch(URL_API, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bio' })
    })
    .then(r => r.json())
    .then(data => {
      // GAS retorna 'name', não 'nome'
      document.getElementById('bio-name').textContent  = data.name  || 'Advogada';
      document.getElementById('bio-oab').textContent   = data.oab   || '';
      document.getElementById('bio-desc').textContent  = data.desc  || '';
      if (data.img)   document.getElementById('bio-img').src            = data.img;
      if (data.phone) document.getElementById('bio-phone').href         = `https://wa.me/55${data.phone.toString().replace(/\D/g,'')}`;
      if (data.email_advogada) document.getElementById('bio-email').href = `mailto:${data.email_advogada}`;
    })
    .catch(() => { document.getElementById('bio-name').textContent = 'Erro ao carregar'; })
    .finally(hideLoading);
  }

  // ── Passo 1: Solicitar OTP ────────────────────────────────
  async function handleClientSearch() {
    const email = document.getElementById('searchCpf').value.trim();
    if (!email) return showErrorModal('Por favor, preencha o campo.');

    showLoading();
    try {
      const res  = await fetch(URL_API, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', usuario: email, passo: 'solicitar' })
      });
      const data = await res.json();

      if (data.status === 'ir_para_admin') {
        window.location.href = 'manutencao.html';
        return;
      }
      if (data.status === 'codigo_enviado') {
        openOtpModal();
      } else {
        showErrorModal(data.message || 'Usuário não encontrado.');
      }
    } catch {
      showErrorModal('Erro na comunicação. Tente novamente.');
    } finally {
      hideLoading();
    }
  }

  // ── Passo 2: Confirmar OTP ────────────────────────────────
  async function confirmCode() {
    const email  = document.getElementById('searchCpf').value.trim();
    const codigo = document.getElementById('inputOtp').value.trim();
    if (!codigo) return showErrorModal('Digite o código.');

    showLoading();
    try {
      const res  = await fetch(URL_API, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', usuario: email, codigo, passo: 'verificar' })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        // Cookie HttpOnly setado pelo Worker — frontend só redireciona
        closeOtpModal();
        window.location.href = 'linha-tempo.html';
      } else {
        showErrorModal(data.message || 'Código inválido.');
      }
    } catch {
      showErrorModal('Erro na conexão.');
    } finally {
      hideLoading();
    }
  }

  // ── Tema ──────────────────────────────────────────────────
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ADV_GLOBAL_THEME', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
  }

  // ── Init ──────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const isDark = localStorage.getItem('ADV_GLOBAL_THEME') === 'dark';
    document.getElementById('themeIcon').classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
    fetchBio();
  });
