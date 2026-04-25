const URL_API = 'https://api-advogada.siterefrigeracaoeliezer.workers.dev/api/v1';
let countdownInterval;
let deferredPrompt;

// ── PWA Install ──────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installApp');
  if(installBtn) installBtn.classList.remove('hidden');
});

// ── Loading ───────────────────────────────────────────────
function showLoading() { document.getElementById('globalLoader').classList.replace('hidden','flex'); }
function hideLoading() { document.getElementById('globalLoader').classList.replace('flex','hidden'); }

// ── Modais ────────────────────────────────────────────────
function showErrorModal(msg) {
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
    document.getElementById('bio-name').textContent = data.name || 'Advogada';
    document.getElementById('bio-oab').textContent = data.oab || '';
    document.getElementById('bio-desc').textContent = data.desc || '';
    if (data.img) document.getElementById('bio-img').src = data.img;
    if (data.phone) document.getElementById('bio-phone').href = `https://wa.me/55${data.phone.toString().replace(/\D/g,'')}`;
    if (data.email_advogada) document.getElementById('bio-email').href = `mailto:${data.email_advogada}`;
  })
  .catch(() => { document.getElementById('bio-name').textContent = 'Erro ao conectar'; })
  .finally(hideLoading);
}

// ── Passo 1: Solicitar OTP ────────────────────────────────
async function handleClientSearch() {
  const email = document.getElementById('searchCpf').value.trim();
  if (!email) return showErrorModal('Por favor, preencha o campo.');

  showLoading();
  try {
    const res = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', usuario: email, passo: 'solicitar' })
    });
    const data = await res.json();

    // ESTA É A CORREÇÃO:
    if (data.status === 'ir_para_admin' || data.status === 'abrir_manutencao') {
      // Redireciona para a página de setup/manutenção
      window.location.href = 'manutencao.html'; 
      return;
    }

    if (data.status === 'codigo_enviado') {
      openOtpModal();
    } else {
      showErrorModal(data.message || 'Usuário não encontrado.');
    }
  } catch (err) {
    showErrorModal('Erro na comunicação com o servidor.');
  } finally {
    hideLoading();
  }
}
// ── Tema ──────────────────────────────────────────────────
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ADV_GLOBAL_THEME', isDark ? 'dark' : 'light');
}

// ── Iniciar ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', fetchBio);
