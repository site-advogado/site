// Configuração Tailwind (Deve vir primeiro)
window.tailwind && (tailwind.config = {  
    darkMode: 'class',  
    theme: { extend: { colors: { pearl: '#FDFCF8', softBlack: '#1A1A1A', satinGold: '#C5A059', darkGold: '#A37E3B' }, fontFamily: { serif: ['Cinzel', 'serif'], sans: ['Montserrat', 'sans-serif'] } } }  
});

// TRAVA DE SEGURANÇA IMEDIATA (Executa antes de qualquer renderização)
if (window.location.pathname.includes('manutencao.html')) {
    if (sessionStorage.getItem('ADV_KEY_ACCESS') !== 'true') {
        document.documentElement.style.display = 'none'; // Esconde a página totalmente
        window.location.href = "index.html";
    }
}

// Limpeza ao fechar, voltar ou atualizar
window.addEventListener('pagehide', () => {
    sessionStorage.removeItem('ADV_KEY_ACCESS');
});

const _0x4a21 = ["v1", "api", "dev", "workers", "siterefrigeracaoeliezer", "api-advogada"];
const URL_SCRIPT = `https://${_0x4a21[5]}.${_0x4a21[4]}.${_0x4a21[3]}.${_0x4a21[2]}/${_0x4a21[1]}/${_0x4a21[0]}`;

let countdownInterval;
let deferredPrompt;

// Inicialização de Tema
const aplicarTema = () => {
    const isDark = localStorage.getItem('ADV_GLOBAL_THEME') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
    }
};
aplicarTema();

function showLoading() { document.getElementById('globalLoader')?.classList.replace('hidden', 'flex'); }
function hideLoading() { document.getElementById('globalLoader')?.classList.replace('flex', 'hidden'); }

async function handleClientSearch() {  
    const inputUsuario = document.getElementById('searchCpf')?.value.trim();  
    if (!inputUsuario) return showErrorModal("Por favor, preencha o campo.");  

    showLoading();
    try {
        const response = await fetch(URL_SCRIPT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", usuario: inputUsuario, passo: "solicitar" })
        });
        const data = await response.json();

        if (data.status === "abrir_manutencao") {
            sessionStorage.setItem('ADV_KEY_ACCESS', 'true'); // Gera a chave temporária
            window.location.href = "manutencao.html";
            return;
        }

        if (data.status === "codigo_enviado") {
            document.getElementById('modalCode')?.classList.replace('hidden', 'flex');
            startTimer(180);
        } else {
            showErrorModal(data.message || "Usuário não encontrado.");
        }
    } catch (e) { showErrorModal("Erro na comunicação."); }
    finally { hideLoading(); }
}

function startTimer(duration) {
    let remaining = duration;
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        remaining--;
        const timerEl = document.getElementById('timer');
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            if (timerEl) timerEl.parentElement.textContent = "CÓDIGO EXPIRADO";
            return;
        }
        if (timerEl) {
            let m = Math.floor(remaining / 60);
            let s = remaining % 60;
            timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
    }, 1000);
}

function showErrorModal(msg) {
    const errEl = document.getElementById('errorMessage');
    if (errEl) errEl.textContent = msg;
    document.getElementById('modalError')?.classList.replace('hidden', 'flex');
}

async function realizarLoginAdmin() {
    const user = document.getElementById('adminUser')?.value.toLowerCase().replace(/\s+/g, '');
    const pass = document.getElementById('adminPass')?.value;
    if(!user) return alert("Preencha o usuário.");

    showLoading();
    try {
        const res = await fetch(URL_SCRIPT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", usuario: user, senha: pass })
        });
        const data = await res.json();
        if(data.status === "sucesso") {
            sessionStorage.setItem('ADV_AUTH_SESS', 'true');
            window.location.href = "configuracao.html";
        } else {
            alert(data.message || "Acesso negado.");
        }
    } catch (e) { alert("Erro de conexão."); }
    finally { hideLoading(); }
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    aplicarTema();
    document.getElementById('btnSearch')?.addEventListener('click', handleClientSearch);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const isDark = !document.documentElement.classList.contains('dark');
        localStorage.setItem('ADV_GLOBAL_THEME', isDark ? 'dark' : 'light');
        aplicarTema();
    });
    
    // Botão de login na página de manutenção
    document.querySelector('button[onclick*="realizarLoginAdmin"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        realizarLoginAdmin();
    });

    // Fechar modais
    document.querySelectorAll('[onclick*="closeModal"], [onclick*="closeErrorModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('modalCode')?.classList.replace('flex', 'hidden');
            document.getElementById('modalError')?.classList.replace('flex', 'hidden');
            clearInterval(countdownInterval);
        });
    });
});
