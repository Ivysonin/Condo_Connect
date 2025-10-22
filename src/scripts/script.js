// Running
async function loadPartial(path) {
  const response = await fetch(path);
  return await response.text();
}

async function loadApp() {
  const app = document.getElementById('app');
  const [header, nav, home, dashboard, modals] = await Promise.all([
    loadPartial('src/partials/header.html'),
    loadPartial('src/partials/nav.html'),
    loadPartial('src/partials/home.html'),
    loadPartial('src/partials/dashboard.html'),
    loadPartial('src/partials/modals.html')
  ]);

  app.innerHTML = `
    ${header}
    ${nav}
    <main>${home}${dashboard}</main>
    ${modals}
  `;
}

document.addEventListener('DOMContentLoaded', loadApp);


// Global state
let currentUser = null;
let currentPage = 'home';
let currentDashboard = 'overview';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Initialize pages
    showPage('home');
    
    // Check if user is logged in
    const savedUser = localStorage.getItem('condohub_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showDashboard('overview');
        } catch (e) {
            localStorage.removeItem('condohub_user');
            showPage('home');
        }
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Add click handlers for calendar days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function() {
            // Remove previous selection
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            // Add selection to clicked day
            this.classList.add('selected');
        });
    });
});

// Page navigation
function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }
    
    // Update navigation
    if (page === 'home') {
        document.getElementById('mainNav').style.display = 'none';
        document.getElementById('userAvatar').textContent = '?';
    }
    
    currentPage = page;
}

function showDashboard(section = 'overview') {
    // Ensure we're on dashboard page
    currentPage = 'dashboard';
    
    // Hide all pages first
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // Show dashboard page
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
        dashboardPage.style.display = 'block';
    }
    
    // Show navigation
    document.getElementById('mainNav').style.display = 'block';
    
    // Update user avatar
    if (currentUser) {
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

        // Mostrar ou ocultar botão "Novo Aviso"
        const btnNotice = document.getElementById('btnNotice');
        if (btnNotice) {
            if (currentUser.type === 'admin') {
                btnNotice.style.display = 'inline-flex';
            } else {
                btnNotice.style.display = 'none';
            }
        }

        // Mostrar ou ocultar estatísticas administrativas
        const adminStats = document.getElementById('adminStats');
        if (adminStats) {
            if (currentUser.type === 'admin') {
                adminStats.style.display = 'grid';
            } else {
                adminStats.style.display = 'none';
            }
        }
    }
    
    // Hide all dashboard sections
    document.querySelectorAll('.dashboard-content').forEach(d => {
        d.classList.remove('active');
        d.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(section + 'Dashboard');
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === section) {
            tab.classList.add('active');
        }
    });
    
    currentDashboard = section;

    if (currentUser?.type === 'admin') {
    updateStats();
    }

    renderRecentNotices();
    renderUpcomingReservations();
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

function renderRecentNotices() {
    const container = document.getElementById('recentNotices');
    if (!container) return;

    const notices = JSON.parse(localStorage.getItem('condohub_notices')) || [];
    container.innerHTML = '';

    const recent = [...notices].reverse().slice(0, 5);

    recent.forEach(notice => {
        const priorityColor = {
            info: 'bg-blue-500',
            important: 'bg-green-500',
            urgent: 'bg-red-500'
        }[notice.priority] || 'bg-gray-400';

        const timeAgo = formatTimeAgo(notice.createdAt);

        const noticeHTML = `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-4 h-4 ${priorityColor} rounded-full mt-2 flex-shrink-0"></div>
                <div>
                    <h4 class="font-medium text-gray-900">${notice.title}</h4>
                    <p class="text-sm text-gray-600">${notice.content}</p>
                    <span class="text-xs text-gray-500">${timeAgo}</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', noticeHTML);
    });
}

function renderUpcomingReservations() {
    const container = document.getElementById('upcomingReservations');
    if (!container) return;

    const reservations = JSON.parse(localStorage.getItem('condohub_reservations')) || [];
    container.innerHTML = '';

    const upcoming = [...reservations]
        .filter(r => new Date(r.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    upcoming.forEach(reservation => {
        const statusColor = {
            confirmed: 'bg-green-500',
            pending: 'bg-yellow-500',
            canceled: 'bg-red-500'
        }[reservation.status] || 'bg-gray-400';

        const date = formatReservationDate(reservation.date, reservation.startTime, reservation.endTime);

        const reservationHTML = `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <h4 class="font-medium text-gray-900">${reservation.space}</h4>
                    <p class="text-sm text-gray-600">${date}</p>
                </div>
                <span class="text-xs ${statusColor} text-white px-2 py-1 rounded">
                    ${capitalize(reservation.status)}
                </span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', reservationHTML);
    });
}

function formatReservationDate(dateStr, start, end) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month} - ${start} às ${end}`;
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHr < 24) return `Há ${diffHr} horas`;
    if (diffDay === 1) return 'Ontem';
    return `${diffDay} dias atrás`;
}

function showCreateModal(type) {
    const modal = document.getElementById('createModal');
    const title = document.getElementById('createModalTitle');
    const body = document.getElementById('createModalBody');
    
    let titleText = '';
    let formContent = '';
    
    switch(type) {
        case 'notice':
            titleText = 'Novo Aviso';
            formContent = `
                <form onsubmit="createNotice(event)">
                    <div class="form-group">
                        <label for="noticeTitle" class="form-label">Título</label>
                        <input type="text" id="noticeTitle" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="noticeContent" class="form-label">Conteúdo</label>
                        <textarea id="noticeContent" class="form-input form-textarea" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="noticePriority" class="form-label">Prioridade</label>
                        <select id="noticePriority" class="form-input form-select" required>
                            <option value="info">Informativo</option>
                            <option value="important">Importante</option>
                            <option value="urgent">Urgente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="noticeTarget" class="form-label">Público Alvo</label>
                        <select id="noticeTarget" class="form-input form-select" required>
                            <option value="all">Todo o condomínio</option>
                            <option value="block">Bloco específico</option>
                            <option value="unit">Unidade específica</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Publicar Aviso</button>
                </form>
            `;
            break;
            
        case 'reservation':
            titleText = 'Nova Reserva';
            formContent = `
                <form onsubmit="createReservation(event)">
                    <div class="form-group">
                        <label for="reservationArea" class="form-label">Área Comum</label>
                        <select id="reservationArea" class="form-input form-select" required>
                            <option value="">Selecione...</option>
                            <option value="Salão de Festas">Salão de Festas</option>
                            <option value="Churrasqueira">Churrasqueira</option>
                            <option value="Piscina">Piscina</option>
                            <option value="Academia">Academia</option>
                            <option value="playground">Playground</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reservationDate" class="form-label">Data</label>
                        <input type="date" id="reservationDate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="reservationStartTime" class="form-label">Horário de Início</label>
                        <input type="time" id="reservationStartTime" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="reservationEndTime" class="form-label">Horário de Término</label>
                        <input type="time" id="reservationEndTime" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="reservationNotes" class="form-label">Observações</label>
                        <textarea id="reservationNotes" class="form-input form-textarea" placeholder="Informações adicionais sobre o evento..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-accent" style="width: 100%;">Solicitar Reserva</button>
                </form>
            `;
            break;
            
        case 'listing':
            titleText = 'Novo Anúncio';
            formContent = `
                <form onsubmit="createListing(event)">
                    <div class="form-group">
                        <label for="listingTitle" class="form-label">Título</label>
                        <input type="text" id="listingTitle" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="listingPrice" class="form-label">Preço (R$)</label>
                        <input type="number" id="listingPrice" class="form-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="listingCategory" class="form-label">Categoria</label>
                        <select id="listingCategory" class="form-input form-select" required>
                            <option value="">Selecione...</option>
                            <option value="furniture">Móveis</option>
                            <option value="electronics">Eletrônicos</option>
                            <option value="clothing">Roupas</option>
                            <option value="books">Livros</option>
                            <option value="toys">Brinquedos</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="listingDescription" class="form-label">Descrição</label>
                        <textarea id="listingDescription" class="form-input form-textarea" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="listingImages" class="form-label">Fotos</label>
                        <input type="file" id="listingImages" class="form-input" multiple accept="image/*">
                        <small style="color: var(--gray-600);">Máximo 5 fotos</small>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Publicar Anúncio</button>
                </form>
            `;
            break;
            
        case 'ticket':
            titleText = 'Novo Chamado';
            formContent = `
                <form onsubmit="createTicket(event)">
                    <div class="form-group">
                        <label for="ticketTitle" class="form-label">Título</label>
                        <input type="text" id="ticketTitle" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="ticketCategory" class="form-label">Categoria</label>
                        <select id="ticketCategory" class="form-input form-select" required>
                            <option value="">Selecione...</option>
                            <option value="plumbing">Hidráulica</option>
                            <option value="electrical">Elétrica</option>
                            <option value="cleaning">Limpeza</option>
                            <option value="maintenance">Manutenção Geral</option>
                            <option value="security">Segurança</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ticketPriority" class="form-label">Prioridade</label>
                        <select id="ticketPriority" class="form-input form-select" required>
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ticketDescription" class="form-label">Descrição</label>
                        <textarea id="ticketDescription" class="form-input form-textarea" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="ticketLocation" class="form-label">Local</label>
                        <input type="text" id="ticketLocation" class="form-input" placeholder="Ex: Apto 201, Área comum, etc." required>
                    </div>
                    <div class="form-group">
                        <label for="ticketImages" class="form-label">Fotos (opcional)</label>
                        <input type="file" id="ticketImages" class="form-input" multiple accept="image/*">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Abrir Chamado</button>
                </form>
            `;
            break;
    }
    
    title.textContent = titleText;
    body.innerHTML = formContent;
    modal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Authentication functions
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const type = document.getElementById('loginType').value;
    
    // Simulate login
    const user = {
        id: 1,
        name: 'João Silva',
        email: email,
        type: type,
        unit: type === 'resident' ? 'Apto 201 - Bloco A' : null
    };
    
    currentUser = user;
    localStorage.setItem('condohub_user', JSON.stringify(user));
    
    closeModal('loginModal');
    showDashboard();
    showToast('success', 'Login realizado!', 'Bem-vindo ao Condo Connect');
}

function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const type = document.getElementById('registerType').value;
    const unit = document.getElementById('registerUnit').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validação de nome
    if (name.length < 3) {
        showToast('error', 'Nome inválido', 'Digite seu nome completo.');
        return;
    }

    // Validação de telefone (mínimo 8 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
        showToast('error', 'Telefone inválido', 'Digite um telefone válido.');
        return;
    }

    // Validação de tipo e unidade
    if (type === 'resident' && unit === '') {
        showToast('error', 'Unidade obrigatória', 'Informe sua unidade.');
        return;
    }

    // Validação de senha
    const senhaForte = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!senhaForte.test(password)) {
        showToast('error', 'Senha fraca', 'A senha deve ter ao menos 6 caracteres, incluindo letras e números.');
        return;
    }

    // Confirmação de senha
    if (password !== confirmPassword) {
        showToast('error', 'Senhas diferentes', 'As senhas não coincidem.');
        return;
    }

    // Simulação de cadastro (substituir com chamada real depois)
    const user = {
        id: Date.now(),
        name,
        email,
        phone,
        type,
        unit: type === 'resident' ? unit : null
    };

    currentUser = user;
    localStorage.setItem('condohub_user', JSON.stringify(user));

    closeModal('registerModal');
    showDashboard();
    showToast('success', 'Cadastro realizado!', `Bem-vindo, ${user.name}`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('condohub_user');
    showPage('home');
    showToast('success', 'Logout realizado', 'Até logo!');
}

// Create functions
function createNotice(event) {
    event.preventDefault();
    
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    const priority = document.getElementById('noticePriority').value;
    const target = document.getElementById('noticeTarget').value;

    // Recupera avisos existentes ou inicia lista vazia
    const notices = JSON.parse(localStorage.getItem('condohub_notices')) || [];

    // Cria novo aviso
    const newNotice = {
        id: Date.now(),
        title,
        content,
        priority,
        target,
        createdAt: new Date().toISOString()
    };

    // Salva no localStorage
    notices.push(newNotice);
    localStorage.setItem('condohub_notices', JSON.stringify(notices));

    // Fecha modal e mostra toast
    closeModal('createModal');
    showToast('success', 'Aviso publicado!', 'Todos os moradores foram notificados');

    // Atualiza dashboard
    updateStats();
    
    if (currentDashboard === 'notices') {
        showDashboard('notices');
    }

    renderRecentNotices();
}

function updateStats() {
    const notices = JSON.parse(localStorage.getItem('condohub_notices')) || [];
    const reservations = JSON.parse(localStorage.getItem('condohub_reservations')) || [];
    const ads = JSON.parse(localStorage.getItem('condohub_ads')) || [];
    const tickets = JSON.parse(localStorage.getItem('condohub_tickets')) || [];

    const adminStats = document.getElementById('adminStats');
    if (!adminStats) return;

    const statCards = adminStats.querySelectorAll('.stat-card .stat-value');
    if (statCards.length >= 4) {
        statCards[0].textContent = notices.length;
        statCards[1].textContent = reservations.length;
        statCards[2].textContent = ads.length;
        statCards[3].textContent = tickets.length;
    }
}

function createReservation(event) {
    event.preventDefault();
    
    const area = document.getElementById('reservationArea').value;
    const date = document.getElementById('reservationDate').value;
    const startTime = document.getElementById('reservationStartTime').value;
    const endTime = document.getElementById('reservationEndTime').value;

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // zera hora para comparar só data

    if (selectedDate < today) {
        showToast('error', 'Data inválida', 'Não é possível reservar datas passadas');
        return;
    }

    // Salva no localStorage
    const reservations = JSON.parse(localStorage.getItem('condohub_reservations')) || [];

    const newReservation = {
        id: Date.now(),
        space: area,
        date,
        startTime,
        endTime,
        status: 'pending', // padrão inicial
        createdAt: new Date().toISOString()
    };

    reservations.push(newReservation);
    localStorage.setItem('condohub_reservations', JSON.stringify(reservations));

    closeModal('createModal');
    showToast('success', 'Reserva confirmada!', 'Você receberá lembrete 24h antes');

    updateStats();
    renderUpcomingReservations();

    if (currentDashboard === 'reservations') {
        showDashboard('reservations');
    }
}

function createTicket(event) {
    event.preventDefault();
    
    const title = document.getElementById('ticketTitle').value;
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const description = document.getElementById('ticketDescription').value;
    const location = document.getElementById('ticketLocation').value;
    
    // Simulate creation
    closeModal('createModal');
    showToast('success', 'Chamado aberto!', 'Você será notificado sobre atualizações');
    
    // Refresh dashboard if on tickets
    if (currentDashboard === 'tickets') {
        showDashboard('tickets');
    }
}

// Profile functions
function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    
    // Update current user
    if (currentUser) {
        currentUser.name = name;
        currentUser.email = email;
        currentUser.phone = phone;
        localStorage.setItem('condohub_user', JSON.stringify(currentUser));
        
        // Update avatar
        document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    }
    
    showToast('success', 'Perfil atualizado!', 'Suas informações foram salvas');
}

// Calendar functions
function changeMonth(direction) {
    // Simulate month change
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const currentMonth = document.getElementById('calendarMonth').textContent;
    const [month, year] = currentMonth.split(' ');
    const monthIndex = monthNames.indexOf(month);
    
    let newMonthIndex = monthIndex + direction;
    let newYear = parseInt(year);
    
    if (newMonthIndex < 0) {
        newMonthIndex = 11;
        newYear--;
    } else if (newMonthIndex > 11) {
        newMonthIndex = 0;
        newYear++;
    }
    
    document.getElementById('calendarMonth').textContent = `${monthNames[newMonthIndex]} ${newYear}`;
}

function toggleUserMenu() {
    // Only show menu if user is logged in
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    // Create user menu
    const existingMenu = document.querySelector('.user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'user-dropdown';
    menu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        padding: 0.5rem;
        min-width: 200px;
        z-index: 100;
    `;
    
    menu.innerHTML = `
        <div style="padding: 0.75rem; border-bottom: 1px solid var(--gray-200);">
            <div style="font-weight: 600;">${currentUser.name}</div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">${currentUser.email}</div>
        </div>
        <a href="#" onclick="showDashboard('profile'); document.querySelector('.user-dropdown').remove();" style="display: block; padding: 0.75rem; text-decoration: none; color: var(--gray-700); border-radius: 0.25rem; transition: background 0.2s;">
            Meu Perfil
        </a>
        <a href="#" onclick="logout(); document.querySelector('.user-dropdown').remove();" style="display: block; padding: 0.75rem; text-decoration: none; color: var(--error); border-radius: 0.25rem; transition: background 0.2s;">
            Sair
        </a>
    `;
    
    // Add hover effects
    const links = menu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.backgroundColor = 'var(--gray-50)';
        });
        link.addEventListener('mouseleave', () => {
            link.style.backgroundColor = 'transparent';
        });
    });
    
    document.querySelector('.user-menu').appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !document.querySelector('.user-avatar').contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Toast notification function
function showToast(type, title, message) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const titleEl = document.getElementById('toastTitle');
    const messageEl = document.getElementById('toastMessage');
    
    // Set icon based on type
    let iconSvg = '';
    switch(type) {
        case 'success':
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--success);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            break;
        case 'error':
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--error);"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
            break;
        case 'warning':
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--warning);"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
            break;
        default:
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--primary);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    }
    
    icon.innerHTML = iconSvg;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    toast.className = `toast ${type} active`;
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modal
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Close user menu
        const userMenu = document.querySelector('.user-dropdown');
        if (userMenu) {
            userMenu.remove();
        }
    }
});

// Add some utility CSS classes dynamically
const style = document.createElement('style');
style.textContent = `
    .space-y-3 > * + * {
        margin-top: 0.75rem;
    }
    .flex {
        display: flex;
    }
    .items-start {
        align-items: flex-start;
    }
    .items-center {
        align-items: center;
    }
    .justify-between {
        justify-content: space-between;
    }
    .gap-3 {
        gap: 0.75rem;
    }
    .p-3 {
        padding: 0.75rem;
    }
    .bg-gray-50 {
        background-color: var(--gray-50);
    }
    .rounded-lg {
        border-radius: 0.5rem;
    }
    .w-2 {
        width: 0.5rem;
    }
    .h-2 {
        height: 0.5rem;
    }
    .bg-primary {
        background-color: var(--primary);
    }
    .rounded-full {
        border-radius: 9999px;
    }
    .mt-2 {
        margin-top: 0.5rem;
    }
    .flex-shrink-0 {
        flex-shrink: 0;
    }
    .font-medium {
        font-weight: 500;
    }
    .text-gray-900 {
        color: var(--gray-900);
    }
    .text-sm {
        font-size: 0.875rem;
    }
    .text-gray-600 {
        color: var(--gray-600);
    }
    .text-xs {
        font-size: 0.75rem;
    }
    .text-gray-500 {
        color: var(--gray-500);
    }
    .bg-accent {
        background-color: var(--accent);
    }
    .text-white {
        color: white;
    }
    .px-2 {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .py-1 {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
    }
    .rounded {
        border-radius: 0.25rem;
    }
    .bg-warning {
        background-color: var(--warning);
    }
    .bg-error {
        background-color: var(--error);
    }
    .font-semibold {
        font-weight: 600;
    }
    .mb-2 {
        margin-bottom: 0.5rem;
    }
    .mb-3 {
        margin-bottom: 0.75rem;
    }
    .text-lg {
        font-size: 1.125rem;
    }
    .font-bold {
        font-weight: 700;
    }
    .bg-yellow-50 {
        background-color: #FFFBEB;
    }
    .border {
        border-width: 1px;
    }
    .border-accent {
        border-color: var(--accent);
    }
    .border-warning {
        border-color: var(--warning);
    }
    .bg-accent-light {
        background-color: var(--accent-light);
    }
    .mt-1 {
        margin-top: 0.25rem;
    }
    .bg-gray-500 {
        background-color: var(--gray-500);
    }
    .w-full {
        width: 100%;
    }
    .h-32 {
        height: 8rem;
    }
    .bg-gray-200 {
        background-color: var(--gray-200);
    }
    .text-gray-400 {
        color: var(--gray-400);
    }
    .mb-1 {
        margin-bottom: 0.25rem;
    }
    .space-y-4 > * + * {
        margin-top: 1rem;
    }
`;
document.head.appendChild(style);