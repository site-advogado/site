// ============================================================
// app.js — Frontend adaptado para autenticação server-side
// O browser NÃO toma mais decisões de segurança.
// Tudo é verificado pelo Worker via cookie HttpOnly.
// ============================================================

const URL_API = 'https://api-advogada.siterefrigeracaoeliezer.workers.dev';

let countdownInterval;

// --- Tema ---
const aplicarTema = () => {
  const isDark = localStorage.getItem('ADV_GLOBAL_THEME') === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'} text-satinGold text-xl`;
  }
};
aplicarTema();

// --- Loading ---
function showLoading() { document.getElementById('globalLoader')?.classList.replace('hidden', 'flex'); }
function hideLoading() { document.getElementById('globalLoader')?.classList.replace('flex', 'hidden'); }

// --- Modal de erro ---
function showErrorModal(msg) {
  const el = document.getElementById('errorMessage');
  if (el) el.textContent = msg;
  document.getElementById('modalError')?.classList.replace('hidden', 'flex');
}
function closeErrorModal() {
  document.getElementById('modalError')?.classList.replace('flex', 'hidden');
}

// --- Modal de código ---
function openModal() {
  document.getElementById('modalCode')?.classList.replace('hidden', 'flex');
  startTimer(180);
}
function closeModal() {
  document.getElementById('modalCode')?.classList.replace('flex', 'hidden');
  clearInterval(countdownInterval);
}

// --- Timer OTP ---
function startTimer(duration) {
  let remaining = duration;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remaining--;
    const timerEl = document.getElementById('timer');
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      if (timerEl) timerEl.parentElement.textContent = 'CÓDIGO EXPIRADO';
      return;
    }
    if (timerEl) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  }, 1000);
}

// --- Bio pública (sem autenticação) ---
async function fetchBio() {
  try {
    const res = await fetch(`${URL_API}/api/v1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bio' }),
    });
    const data = await res.json();
    if (data.nome) {
      document.getElementById('bio-name').textContent = data.nome;
      document.getElementById('bio-oab').textContent = data.oab || '';
      document.getElementById('bio-desc').textContent = data.desc || '';
      if (data.img) document.getElementById('bio-img').src = data.img;
      if (data.phone) document.getElementById('bio-phone').href = `https://wa.me/55${data.phone.replace(/\D/g, '')}`;
      if (data.email) document.getElementById('bio-email').href = `mailto:${data.email}`;
    }
  } catch (e) {
    console.warn('Erro ao carregar bio:', e);
  }
}

// --- Solicitar acesso (passo 1: enviar e-mail) ---
async function handleClientSearch() {
  const email = document.getElementById('searchCpf')?.value.trim();
  if (!email) return showErrorModal('Por favor, preencha o campo.');

  showLoading();
  try {
    const res = await fetch(`${URL_API}/api/v1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', usuario: email, passo: 'solicitar' }),
    });
    const data = await res.json();

    if (data.status === 'ir_para_admin') {
      // Redireciona para login admin (sem chave no sessionStorage!)
      window.location.href = 'manutencao.html';
      return;
    }
    if (data.status === 'codigo_enviado') {
      openModal();
    } else {
      showErrorModal(data.message || 'Usuário não encontrado.');
    }
  } catch {
    showErrorModal('Erro na comunicação.');
  } finally {
    hideLoading();
  }
}

// --- Confirmar código OTP (passo 2) ---
async function confirmCode() {
  const email = document.getElementById('searchCpf')?.value.trim();
  const codigo = document.getElementById('inputOtp')?.value.trim();
  if (!codigo) return showErrorModal('Digite o código.');

  showLoading();
  try {
    const res = await fetch(`${URL_API}/api/v1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', usuario: email, codigo, passo: 'verificar' }),
    });
    const data = await res.json();

    if (data.status === 'ok') {
      // O cookie HttpOnly foi setado pelo Worker automaticamente.
      // O frontend apenas redireciona — não guarda nada.
      closeModal();
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

// --- Login Admin ---
async function realizarLoginAdmin() {
  const user = document.getElementById('adminUser')?.value.trim().toLowerCase();
  const pass = document.getElementById('adminPass')?.value;
  if (!user) return alert('Preencha o usuário.');

  showLoading();
  try {
    const res = await fetch(`${URL_API}/api/v1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login_admin', usuario: user, senha: pass }),
    });
    const data = await res.json();

    if (data.status === 'sucesso') {
      // Cookie HttpOnly de admin setado pelo Worker.
      // Frontend apenas redireciona.
      window.location.href = 'configuracao.html';
    } else {
      alert(data.message || 'Acesso negado.');
    }
  } catch {
    alert('Erro de conexão.');
  } finally {
    hideLoading();
  }
}

// --- Verificar sessão no carregamento de páginas protegidas ---
// Cole isso no topo de linha-tempo.html e configuracao.html
async function verificarSessao(roleNecessario = 'cliente') {
  try {
    const res = await fetch(`${URL_API}/api/verificar-sessao`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();

    if (!data.autenticado) {
      window.location.href = 'index.html';
      return false;
    }
    if (roleNecessario === 'admin' && data.role !== 'admin') {
      window.location.href = 'index.html';
      return false;
    }
    return data;
  } catch {
    window.location.href = 'index.html';
    return false;
  }
}

// --- Logout ---
async function logout() {
  await fetch(`${URL_API}/api/v1`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' }),
  });
  window.location.href = 'index.html';
}

// --- Tema toggle ---
function toggleDarkMode() {
  const isDark = !document.documentElement.classList.contains('dark');
  localStorage.setItem('ADV_GLOBAL_THEME', isDark ? 'dark' : 'light');
  aplicarTema();
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  aplicarTema();
  fetchBio();

  document.getElementById('btnSearch')?.addEventListener('click', handleClientSearch);
  document.getElementById('themeToggle')?.addEventListener('click', toggleDarkMode);

  // Fechar modais
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
      closeErrorModal();
    });
  });
});
