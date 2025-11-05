// ESTADO DA APLICAÇÃO
let currentUser = null;
let avisos = [];
let chamados = [];
let users = [];

// CONTROLE DE EXPIRAÇÃO DE EDIÇÃO
let edicaoTimers = JSON.parse(localStorage.getItem('edicaoTimers')) || {};

// Remove timers expirados
for (const [id, expiraEm] of Object.entries(edicaoTimers)) {
    if (Date.now() > expiraEm) delete edicaoTimers[id];
}
localStorage.setItem('edicaoTimers', JSON.stringify(edicaoTimers));

// DADOS DE EXEMPLO
const sampleUsers = [
    { id: 1, name: 'José Pedro', email: 'josepedro@email.com', bloco: 'A', apt: '101', phone: '(81) 91234-5678', type: 'sindico', password: '123456', active: true },
    { id: 2, name: 'Paulo Henrique', email: 'paulohenrique@email.com', bloco: 'B', apt: '205', phone: '(81) 99902-8922', type: 'morador', password: '123456', active: true },
    { id: 3, name: 'Bárbara Siqueira', email: 'barbarasiqueira@email.com', bloco: 'C', apt: '303', phone: '(81) 59777-7232', type: 'morador', password: '123456', active: true }
];

// INICIALIZAR DADOS
function initializeData() {
    users = [...sampleUsers];
}

// SALVA TODOS OS DADOS NO localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('avisos', JSON.stringify(avisos));
    localStorage.setItem('chamados', JSON.stringify(chamados));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('edicaoTimers', JSON.stringify(edicaoTimers));
}

// CARREGA DADOS DO localStorage
function loadData() {
    const storedUsers = JSON.parse(localStorage.getItem('users'));
    const storedAvisos = JSON.parse(localStorage.getItem('avisos'));
    const storedChamados = JSON.parse(localStorage.getItem('chamados'));
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));

    if (storedUsers && storedUsers.length) users = storedUsers;
    if (storedAvisos && storedAvisos.length) avisos = storedAvisos;
    if (storedChamados && storedChamados.length) chamados = storedChamados;
    if (storedUser) {
        currentUser = storedUser;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        updateUserInterface();
        showSection('dashboard-section');
    }
}

// INTERCEPTA AÇÕES E SALVA AUTOMATICAMENTE
const originalRegister = register;
register = function (userData) {
    const result = originalRegister(userData);
    saveData();
    return result;
};

const originalLogin = login;
login = function (email, password) {
    const result = originalLogin(email, password);
    if (result) saveData();
    return result;
};

const originalLogout = logout;
logout = function () {
    originalLogout();
    localStorage.removeItem('currentUser');
};

// UTILITÁRIOS
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast px-4 py-3 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getLocalDateBR() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() + offsetMs);
    return localTime.toLocaleDateString('pt-BR');
}

function showModal(modalId) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById(modalId).classList.add('hidden');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-green-50', 'text-green-600');
    });
    document.querySelector(`[data-section="${sectionId.replace('-section', '')}"]`).classList.add('bg-green-50', 'text-green-600');
}

function salvarEdicao(id) {
    const aviso = avisos.find(a => a.id === id);
    if (!aviso) return;

    // Verifica se o tempo de edição expirou
    if (Date.now() > edicaoTimers[id]) {
        showToast('O tempo para editar este aviso expirou.', 'error');
        cancelarEdicao(id);
        return;
    }

    const novoTitulo = document.getElementById(`edit-titulo-${id}`).value.trim();
    const novoConteudo = document.getElementById(`edit-conteudo-${id}`).value.trim();

    aviso.titulo = novoTitulo;
    aviso.conteudo = novoConteudo;

    localStorage.setItem('avisos', JSON.stringify(avisos));
    localStorage.setItem('edicaoTimers', JSON.stringify(edicaoTimers));

    updateAvisos();
    updateDashboard();
    showToast('Aviso editado com sucesso!');
    cancelarEdicao(id);
}

function cancelarEdicao(id) {
    const card = document.querySelector(`[onclick="editAviso(${id})"]`).closest('.card-hover');
    const form = card.querySelector(`#edit-titulo-${id}`)?.parentElement;
    if (form) form.remove();
    avisoEditandoId = null;
}

// AUTENTICAÇÃO
function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        updateUserInterface();
        showSection('dashboard-section');
        showToast('Login realizado com sucesso!');
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    showToast('Logout realizado com sucesso!');
}

function register(userData) {
    // validações

    // Nome: mínimo 3 letras
    if (!/^[A-Za-zÀ-ÿ\s]{3,}$/.test(userData.name.trim())) {
        showToast('Nome inválido: informe seu nome', 'error');
        return false;
    }

    // Telefone: mínimo 8 dígitos numéricos
    const digits = userData.phone.replace(/\D/g, '');
    if (digits.length < 8) {
        showToast('Telefone inválido: mínimo 8 dígitos.', 'error');
        return false;
    }

    // E-mail: não pode repetir
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
        showToast('E-mail já cadastrado.', 'error');
        return false;
    }

    // Senha: mínimo 6 caracteres
    if (userData.password.length < 6) {
        showToast('Senha muito curta: mínimo 6 caracteres.', 'error');
        return false;
    }

    const newUser = {
        id: users.length + 1,
        ...userData,
        active: true
    };
    users.push(newUser);
    showToast('Cadastro realizado com sucesso! Faça login para continuar.');
    return true;
}

// INTERFACE DO USUÁRIO
function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('user-info').textContent = `${currentUser.name} (${currentUser.type === 'sindico' ? 'Síndico' : 'Morador'})`;
    
    // Mostrar/ocultar elementos baseado no tipo de usuário
    if (currentUser.type === 'sindico') {
        document.getElementById('admin-menu').classList.remove('hidden');
        document.getElementById('novo-aviso-btn').classList.remove('hidden');
        document.getElementById('admin-stats').classList.remove('hidden');
    } else {
        document.getElementById('admin-menu').classList.add('hidden');
        document.getElementById('novo-aviso-btn').classList.add('hidden');
        document.getElementById('admin-stats').classList.add('hidden');
    }
    
    updateDashboard();
    updateAvisos();
    updateChamados();
    updatePerfil();
    if (currentUser.type === 'sindico') {
        updateAdmin();
    }
}

function updateDashboard() {
    const userAvisos = avisos.length;
    const userChamados = currentUser.type === 'sindico' ? chamados.length : chamados.filter(c => c.autorId === currentUser.id).length;
    const totalUsers = users.length;
    
    document.getElementById('total-avisos').textContent = userAvisos;
    document.getElementById('total-chamados').textContent = userChamados;
    document.getElementById('total-usuarios').textContent = totalUsers;
    
    // Avisos recentes
    const recentAvisos = avisos.slice(-3).reverse();
    const recentAvisosContainer = document.getElementById('recent-avisos');
    
    if (recentAvisos.length === 0) {
        recentAvisosContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum aviso encontrado</p>';
    } else {
        recentAvisosContainer.innerHTML = recentAvisos.map(aviso => `
            <div class="border-l-4 border-blue-500 pl-4 py-2">
                <h4 class="font-semibold text-gray-900">${aviso.titulo}</h4>
                <p class="text-sm text-gray-600 mt-1">${aviso.conteudo.substring(0, 100)}...</p>
                <p class="text-xs text-gray-500 mt-2">Por ${aviso.autor} em ${aviso.data}</p>
            </div>
        `).join('');
    }
}

function updateAvisos() {
    const avisosContainer = document.getElementById('avisos-list');
    
    if (avisos.length === 0) {
        avisosContainer.innerHTML = '<p class="text-gray-500 text-center py-8 col-span-full">Nenhum aviso encontrado</p>';
    } else {
        avisosContainer.innerHTML = avisos.map(aviso => `
            <div class="bg-white rounded-lg shadow-sm p-6 card-hover">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-semibold text-gray-900">${aviso.titulo}</h3>
                    ${currentUser.type === 'sindico' && aviso.autorId === currentUser.id ? `
                        <div class="flex space-x-2">
                            ${Date.now() < aviso.editavelAte ? `
                                <button onclick="editAviso(${aviso.id})" 
                                    class="text-green-600 hover:text-green-900 font-medium transition">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : `
                                <button class="text-gray-400 cursor-not-allowed font-medium" disabled title="Edição expirada">
                                    <i class="fas fa-edit"></i>
                                </button>
                            `}
                            <button onclick="deleteAviso(${aviso.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <p class="text-gray-600 mb-4">${aviso.conteudo}</p>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>Por ${aviso.autor}</span>
                    <span>${aviso.data}</span>
                </div>
            </div>
        `).join('');
    }
}

function updateChamados() {
    const chamadosTable = document.getElementById('chamados-table');
    let userChamados = currentUser.type === 'sindico' ? chamados : chamados.filter(c => c.autorId === currentUser.id);

    // Filtro para exibir apenas chamados "aberto" ou "andamento"
    userChamados = userChamados.filter(c => c.status === 'aberto' || c.status === 'andamento');

    if (userChamados.length === 0) {
        chamadosTable.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhuma ocorrência em aberto ou em andamento</td></tr>';
    } else {
        chamadosTable.innerHTML = userChamados.map(chamado => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${chamado.titulo}</div>
                        <div class="text-sm text-gray-500">${chamado.descricao.substring(0, 50)}...</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <strong>${chamado.categoria || '<span class="text-gray-400 italic">Sem categoria</span>'}</strong>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full status-${chamado.status}">
                        ${chamado.status === 'aberto' ? 'Aberto' : chamado.status === 'andamento' ? 'Em Andamento' : 'Resolvido'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${chamado.data}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                        onclick="viewChamado(${chamado.id}, this)"
                        class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-3">
                        Ver
                    </button>
                    ${currentUser.type === 'sindico' ? `
                        <select onchange="updateChamadoStatus(${chamado.id}, this.value)" class="text-sm border border-gray-300 rounded px-2 py-1">
                            <option value="aberto" ${chamado.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                            <option value="andamento" ${chamado.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="resolvido" ${chamado.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
                        </select>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }
}

function updatePerfil() {
    document.getElementById('perfil-name').value = currentUser.name;
    document.getElementById('perfil-email').value = currentUser.email;
    document.getElementById('perfil-bloco').value = currentUser.bloco;
    document.getElementById('perfil-apt').value = currentUser.apt;
    document.getElementById('perfil-phone').value = currentUser.phone;
}

function updateAdmin() {
    const usersTable = document.getElementById('users-table');
    
    usersTable.innerHTML = users.map(user => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.bloco}/${user.apt}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${user.type === 'sindico' ? 'Síndico' : 'Morador'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.active ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="toggleUserStatus(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    ${user.active ? 'Desativar' : 'Ativar'}
                </button>
            </td>
            </tr>
    `).join('');
}

// FUNÇÕES DE AÇÃO
function createAviso(titulo, conteudo) {
    const newAviso = {
        id: avisos.length + 1,
        titulo,
        conteudo,
        autor: currentUser.name,
        autorId: currentUser.id,
        data: getLocalDateBR(),
        editavelAte: Date.now() + 5 * 60 * 1000
    };
    avisos.push(newAviso);

    edicaoTimers[newAviso.id] = newAviso.editavelAte

    updateAvisos();
    updateDashboard();
    saveData();
    localStorage.setItem('edicaoTimers', JSON.stringify(edicaoTimers));
    showToast('Aviso publicado com sucesso!');
}

function deleteAviso(id) {
    avisos = avisos.filter(a => a.id !== id);

    localStorage.setItem('avisos', JSON.stringify(avisos));

    updateAvisos();
    updateDashboard();
    showToast('Aviso excluído com sucesso!');
}

let avisoEditandoId = null;
function editAviso(id) {
    const aviso = avisos.find(a => a.id === id);
    if (!aviso) return;

    // Verifica se o tempo de edição expirou
    if (Date.now() > aviso.editavelAte) {
        showToast('O tempo para editar este aviso expirou.', 'error');
        return;
    }

    // Evita múltiplos formulários abertos
    if (avisoEditandoId !== null) {
        cancelarEdicao(avisoEditandoId);
    }
    avisoEditandoId = id;

    // Localiza o card do aviso
    const card = document.querySelector(`[onclick="editAviso(${id})"]`).closest('.card-hover');

    // Cria o formulário de edição
    const form = document.createElement('div');
    form.className = 'mt-4 space-y-2';
    form.innerHTML = `
        <input type="text" id="edit-titulo-${id}" class="border p-2 w-full rounded" value="${aviso.titulo}">
        <textarea id="edit-conteudo-${id}" class="border p-2 w-full rounded">${aviso.conteudo}</textarea>
        <div class="flex space-x-2">
            <button class="bg-green-600 text-white px-3 py-1 rounded" onclick="salvarEdicao(${id})">Salvar</button>
            <button class="bg-gray-400 text-white px-3 py-1 rounded" onclick="cancelarEdicao(${id})">Cancelar</button>
        </div>
    `;

    card.appendChild(form);
}

function createChamado(titulo, descricao, categoria) {
    const newChamado = {
        id: chamados.length + 1,
        titulo,
        descricao,
        categoria,
        status: 'aberto',
        data: getLocalDateBR(),
        autorId: currentUser.id,
        autor: currentUser.name
    };
    chamados.push(newChamado);
    updateChamados();
    updateDashboard();
    saveData();
    showToast('Ocorrência aberta com sucesso!');
}

function updateChamadoStatus(id, status) {
    const chamado = chamados.find(c => c.id === id);
    if (chamado) {
        chamado.status = status;
        updateChamados();
        saveData();
        showToast('Status da ocorrência atualizado!');
    }
}

function viewChamado(id) {
    const chamado = chamados.find(c => c.id === id);
    if (!chamado) return;

    document.getElementById('view-titulo').textContent = chamado.titulo;
    document.getElementById('view-categoria').textContent = chamado.categoria || 'Sem categoria';
    document.getElementById('view-descricao').textContent = chamado.descricao;
    document.getElementById('view-data').textContent = chamado.data;
    document.getElementById('view-autor').textContent = chamado.autor || 'Desconhecido';

    const statusEl = document.getElementById('view-status');
    statusEl.textContent = 
        chamado.status === 'aberto' ? 'Aberto' :
        chamado.status === 'andamento' ? 'Em Andamento' : 'Resolvido';

    statusEl.className = `px-2 py-1 text-xs font-semibold rounded-full status-${chamado.status}`;

    document.getElementById('modal-view-chamado').classList.remove('hidden');
}
document.getElementById('close-view-chamado').addEventListener('click', () => {
    document.getElementById('modal-view-chamado').classList.add('hidden');
});
document.getElementById('close-view-chamado-footer').addEventListener('click', () => {
    document.getElementById('modal-view-chamado').classList.add('hidden');
});
window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-view-chamado');
    if (e.target === modal) modal.classList.add('hidden');
});

function toggleUserStatus(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.active = !user.active;
        saveData();
        updateAdmin();
        showToast(`Usuário ${user.active ? 'ativado' : 'desativado'} com sucesso!`);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    loadData();
    
    // tabs de login/cadastro
    document.getElementById('login-tab').addEventListener('click', function() {
        this.classList.add('bg-white', 'text-green-600', 'shadow-sm');
        this.classList.remove('text-gray-500');
        document.getElementById('register-tab').classList.remove('bg-white', 'text-green-600', 'shadow-sm');
        document.getElementById('register-tab').classList.add('text-gray-500');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    });

    document.getElementById('register-tab').addEventListener('click', function() {
        this.classList.add('bg-white', 'text-green-600', 'shadow-sm');
        this.classList.remove('text-gray-500');
        document.getElementById('login-tab').classList.remove('bg-white', 'text-green-600', 'shadow-sm');
        document.getElementById('login-tab').classList.add('text-gray-500');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    });

    // formulário de login
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!login(email, password)) {
            showToast('E-mail ou senha incorretos!', 'error');
        }
    });

    // formulário de cadastro
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const userData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            bloco: document.getElementById('register-bloco').value,
            apt: document.getElementById('register-apt').value,
            phone: document.getElementById('register-phone').value,
            type: document.getElementById('register-type').value,
            password: document.getElementById('register-password').value
        };

        if (register(userData)) {
            document.getElementById('register-form').reset();
            document.getElementById('login-tab').click();
        }
    });

    // navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section + '-section');
        });
    });

    // logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // modais
    document.getElementById('novo-aviso-btn').addEventListener('click', () => showModal('modal-aviso'));
    document.getElementById('novo-chamado-btn').addEventListener('click', () => showModal('modal-chamado'));
    document.getElementById('change-password-btn').addEventListener('click', () => showModal('modal-password'));

    // cancelar modais
    document.getElementById('cancel-aviso').addEventListener('click', () => hideModal('modal-aviso'));
    document.getElementById('cancel-chamado').addEventListener('click', () => hideModal('modal-chamado'));
    document.getElementById('cancel-password').addEventListener('click', () => hideModal('modal-password'));

    // overlay para fechar modais
    document.getElementById('modal-overlay').addEventListener('click', function() {
        document.querySelectorAll('[id^="modal-"]').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.classList.add('hidden');
    });

    // formulários dos modais
    document.getElementById('form-aviso').addEventListener('submit', function(e) {
        e.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value;
        const conteudo = document.getElementById('aviso-conteudo').value;
        createAviso(titulo, conteudo);
        this.reset();
        hideModal('modal-aviso');
    });

    document.getElementById('form-chamado').addEventListener('submit', function(e) {
        e.preventDefault();
        const titulo = document.getElementById('chamado-titulo').value;
        const descricao = document.getElementById('chamado-descricao').value;
        const categoria = document.getElementById('chamado-categoria').value;
        createChamado(titulo, descricao, categoria);
        this.reset();
        hideModal('modal-chamado');
    });

    document.getElementById('form-password').addEventListener('submit', function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // validação: mínimo 6 caracteres
        if (newPassword.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('As senhas não coincidem!', 'error');
            return;
        }
        
        currentUser.password = newPassword;
        showToast('Senha alterada com sucesso!');
        this.reset();
        hideModal('modal-password');
    });

    // formulário de perfil
    document.getElementById('perfil-form').addEventListener('submit', function(e) {
        e.preventDefault();
        currentUser.name = document.getElementById('perfil-name').value;
        currentUser.email = document.getElementById('perfil-email').value;
        currentUser.bloco = document.getElementById('perfil-bloco').value;
        currentUser.apt = document.getElementById('perfil-apt').value;
        currentUser.phone = document.getElementById('perfil-phone').value;
        
        updateUserInterface();
        saveData();
        showToast('Perfil atualizado com sucesso!');
    });
});