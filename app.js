const _0x4a21 = ["v1", "api", "dev", "workers", "siterefrigeracaoeliezer", "api-advogada"];
const URL_SCRIPT = `https://${_0x4a21[5]}.${_0x4a21[4]}.${_0x4a21[3]}.${_0x4a21[2]}/${_0x4a21[1]}/${_0x4a21[0]}`;

let countdownInterval;
let deferredPrompt;

// Configuração Tailwind
tailwind.config = {  
    darkMode: 'class',  
    theme: {  
        extend: {  
            colors: {  
                pearl: '#FDFCF8',  
                softBlack: '#1A1A1A',  
                satinGold: '#C5A059',  
                darkGold: '#A37E3B'  
            },  
            fontFamily: {  
                serif: ['Cinzel', 'serif'],  
                sans: ['Montserrat', 'sans-serif'],  
            }  
        }  
    }  
};

// Inicialização de Tema
if (localStorage.getItem('ADV_GLOBAL_THEME') === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
} else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installApp');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    }
});

function showLoading() { document.getElementById('globalLoader').classList.replace('hidden', 'flex'); }
function hideLoading() { document.getElementById('globalLoader').classList.replace('flex', 'hidden'); }

function fetchBio() {  
    showLoading();
    fetch(URL_SCRIPT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bio" })
    })  
    .then(res => res.json())  
    .then(data => {  
        document.getElementById('bio-name').textContent = data.name || "Sincronização falhou";  
        document.getElementById('bio-oab').textContent = data.oab || "OAB/MS 000.000";  
        document.getElementById('bio-desc').textContent = data.desc || "Sincronização falhou";  
        document.getElementById('bio-img').src = data.img || "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGaEVTw5lfLFBN6DQyXlxRH5jYjaFoYWedjR0xPphZ31_Khb5h5IZcoGgFuUv4tYZtVaz7sZ-CiF7jZAYqot3DGcrvqZM9lcgnz-PQK4N9IkNJCJ6nPyRyd4R0ZpLoGpL1jqgG63NMVrcjVSvE-KXQIJ68ty0tNVRS3TC0-PUK1vAVPx28CfwZcmje1nhY/w424-h424/logo.png";  
        const cleanPhone = (data.phone || "").toString().replace(/\D/g, '');  
        document.getElementById('bio-phone').href = `https://wa.me/55${cleanPhone}`;  
        document.getElementById('bio-email').href = `mailto:${data.email}`;  
    }).finally(() => hideLoading());
}  

async function handleClientSearch() {  
    const inputUsuario = document.getElementById('searchCpf').value.trim();  
    if (!inputUsuario) return showErrorModal("Por favor, preencha o campo.");  

    showLoading();
    try {
        const response = await fetch(URL_SCRIPT, {
            method: "POST",
            credentials: "include", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", usuario: inputUsuario, passo: "solicitar" })
        });
        const data = await response.json();

        if (data.status === "abrir_manutencao" && data.redirect) {
            sessionStorage.setItem('ADV_KEY_ACCESS', 'true');
            window.location.href = data.redirect;
            return;
        }

        if (data.status === "codigo_enviado") {
            openModal();
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
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('timerLabel').textContent = "CÓDIGO EXPIRADO";
            return;
        }
        let minutes = Math.floor(remaining / 60);
        let seconds = remaining % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
}

function openModal() {
    document.getElementById('modalCode').classList.replace('hidden', 'flex');
    startTimer(180);  
}

function closeModal() {
    document.getElementById('modalCode').classList.replace('flex', 'hidden');
    clearInterval(countdownInterval);
}

async function confirmCode() {
    const code = document.getElementById('inputOtp').value.trim();
    const email = document.getElementById('searchCpf').value.trim();
    showLoading();
    try {
        const res = await fetch(URL_SCRIPT, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", usuario: email, codigo: code, passo: "verificar" })
        });
        const data = await res.json();
        if (data.status === "ok") {
            closeModal();
            sessionStorage.setItem('ADV_USER_EMAIL', email);
            window.location.href = "linha-tempo.html";
        } else {
            showErrorModal(data.message || "Código inválido.");
        }
    } catch(e) { showErrorModal("Erro na conexão."); }
    finally { hideLoading(); }
}

function showErrorModal(msg) {
    document.getElementById('errorMessage').textContent = msg;
    document.getElementById('modalError').classList.replace('hidden', 'flex');
}

function closeErrorModal() { document.getElementById('modalError').classList.replace('flex', 'hidden'); }

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    const themeIcon = document.getElementById('themeIcon');
    
    if (isDark) {
        localStorage.setItem('ADV_GLOBAL_THEME', 'dark');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('ADV_GLOBAL_THEME', 'light');
        if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}

// Event Listeners e Onload
window.addEventListener('load', () => {
    const themeIcon = document.getElementById('themeIcon');
    if (localStorage.getItem('ADV_GLOBAL_THEME') === 'dark') {
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
    fetchBio(); 
    sessionStorage.removeItem('ADV_SESSION_TOKEN'); 
    sessionStorage.removeItem('ADV_AUTH_SESS');
});

document.addEventListener('DOMContentLoaded', () => {
    // Botão Instalar
    document.getElementById('installApp')?.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                document.getElementById('installApp').classList.add('hidden');
            }
            deferredPrompt = null;
        }
    });

    // Botão Dark Mode
    document.getElementById('themeIcon')?.parentElement?.addEventListener('click', toggleDarkMode);

    // Botão Pesquisar
    document.getElementById('btnSearch')?.addEventListener('click', handleClientSearch);

    // Botão Validar OTP
    document.querySelector('#modalCode button[onclick="confirmCode()"]')?.addEventListener('click', confirmCode);
    
    // Botão Cancelar OTP
    document.querySelector('#modalCode button[onclick="closeModal()"]')?.addEventListener('click', closeModal);

    // Botão Entendido Erro
    document.querySelector('#modalError button')?.addEventListener('click', closeErrorModal);
    
    // Suporte a teclas (Enter na busca)
    document.getElementById('searchCpf')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleClientSearch();
    });
});
