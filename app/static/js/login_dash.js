// ESTADO DA APLICAÇÃO
let currentUser = null;
let avisos = [];
let chamados = [];
let users = [];

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationErrors = data.errors ? Object.values(data.errors).flat().join(' ') : '';
        throw new Error(data.error || data.message || validationErrors || `Falha na solicitação (${response.status}).`);
    }

    return data;
}

function mapUser(user) {
    return {
        id: user.id,
        name: user.nome_completo,
        email: user.email,
        unit: user.bloco_apto,
        phone: user.telefone,
        type: user.tipo_usuario,
        active: user.ativo
    };
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString('pt-BR') : '';
}

function mapAviso(aviso) {
    return {
        ...aviso,
        autorId: aviso.autor_id,
        data: formatDate(aviso.data),
        editavelAte: aviso.editavel_ate ? new Date(aviso.editavel_ate).getTime() : 0
    };
}

function mapChamado(chamado) {
    return { ...chamado, autorId: chamado.autor_id, data: formatDate(chamado.data) };
}

async function refreshData() {
    const [avisosData, chamadosData] = await Promise.all([
        apiRequest('/avisos/'),
        apiRequest('/chamado/')
    ]);
    avisos = avisosData.map(mapAviso);
    chamados = chamadosData.map(mapChamado);
    users = currentUser.type === 'sindico'
        ? (await apiRequest('/admin/usuarios')).map(mapUser)
        : [];
}

async function initializeApp() {
    try {
        currentUser = mapUser(await apiRequest('/users/perfil'));
        await refreshData();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        updateUserInterface();
        showSection('dashboard-section');
    } catch (error) {
        currentUser = null;
    }
}

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
    if (Date.now() > aviso.editavelAte) {
        showToast('O tempo para editar este aviso expirou.', 'error');
        cancelarEdicao(id);
        return;
    }

    const novoTitulo = document.getElementById(`edit-titulo-${id}`).value.trim();
    const novoConteudo = document.getElementById(`edit-conteudo-${id}`).value.trim();

    apiRequest(`/avisos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ titulo: novoTitulo, conteudo: novoConteudo })
    }).then(async () => {
        await refreshData();
        updateUserInterface();
        showToast('Aviso editado com sucesso!');
        avisoEditandoId = null;
    }).catch(error => showToast(error.message, 'error'));
}

function cancelarEdicao(id) {
    const button = document.querySelector(`[onclick="editAviso(${id})"]`);
    const card = button?.closest('.card-hover');
    if (!card) return;
    const form = card.querySelector(`#edit-titulo-${id}`)?.parentElement;
    if (form) form.remove();
    avisoEditandoId = null;
}

// AUTENTICAÇÃO
async function login(email, password) {
    await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha: password })
    });
    currentUser = mapUser(await apiRequest('/users/perfil'));
    await refreshData();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    updateUserInterface();
    showSection('dashboard-section');
    showToast('Login realizado com sucesso!');
}

async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
        currentUser = null;
        avisos = [];
        chamados = [];
        users = [];
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        showToast('Logout realizado com sucesso!');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function register(userData) {
    await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({
            nome_completo: userData.name,
            email: userData.email,
            bloco_apto: userData.unit,
            telefone: userData.phone,
            tipo_usuario: userData.type,
            senha: userData.password
        })
    });
    showToast('Cadastro realizado com sucesso! Faça login para continuar.');
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
                            <option value="concluido" ${chamado.status === 'concluido' ? 'selected' : ''}>Resolvido</option>
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
    document.getElementById('perfil-unit').value = currentUser.unit;
    document.getElementById('perfil-phone').value = currentUser.phone;
}

async function updateProfile(updatedData) {
    // Validações
    if (!/^[A-Za-zÀ-ÿ\s]{3,}$/.test(updatedData.name.trim())) {
        showToast('Nome inválido: informe seu nome completo.', 'error');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email.trim())) {
        showToast('E-mail inválido.', 'error');
        return false;
    }
    if (!/^[A-Z]\/\d{1,3}$/.test(updatedData.unit.trim())) {
        showToast('Formato inválido: use o padrão A/000.', 'error');
        return false;
    }
    const digits = updatedData.phone.replace(/\D/g, '');
    if (digits.length < 8) {
        showToast('Telefone inválido: mínimo 8 dígitos.', 'error');
        return false;
    }

    try {
        await apiRequest('/users/perfil', {
            method: 'PUT',
            body: JSON.stringify({
                nome_completo: updatedData.name.trim(),
                email: updatedData.email.trim(),
                bloco_apto: updatedData.unit.trim().toUpperCase(),
                telefone: updatedData.phone.trim()
            })
        });
        currentUser = mapUser(await apiRequest('/users/perfil'));
        updateUserInterface();
        showToast('Perfil atualizado com sucesso!');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

function updateAdmin() {
    const usersTable = document.getElementById('users-table');
    
    usersTable.innerHTML = users.map(user => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.unit || '-'}</td>
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
async function createAviso(titulo, conteudo) {
    try {
        await apiRequest('/avisos/', {
            method: 'POST',
            body: JSON.stringify({ titulo, conteudo })
        });
        await refreshData();
        updateUserInterface();
        showToast('Aviso publicado com sucesso!');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

async function deleteAviso(id) {
    try {
        await apiRequest(`/avisos/${id}`, { method: 'DELETE' });
        await refreshData();
        updateUserInterface();
        showToast('Aviso excluído com sucesso!');
    } catch (error) {
        showToast(error.message, 'error');
    }
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

async function createChamado(titulo, descricao, categoria) {
    try {
        await apiRequest('/chamado/', {
            method: 'POST',
            body: JSON.stringify({ titulo, descricao, categoria, status: 'aberto' })
        });
        await refreshData();
        updateUserInterface();
        showToast('Ocorrência aberta com sucesso!');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

async function updateChamadoStatus(id, status) {
    try {
        await apiRequest(`/chamado/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        await refreshData();
        updateUserInterface();
        showToast('Status da ocorrência atualizado!');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function viewChamado(id) {
    let chamado = chamados.find(c => c.id === id);
    try {
        chamado = mapChamado(await apiRequest(`/chamado/${id}`));
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }

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

async function toggleUserStatus(id) {
    const user = users.find(item => item.id === id);
    if (!user) return;

    try {
        await apiRequest(`/admin/usuarios/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ativo: !user.active })
        });
        await refreshData();
        updateAdmin();
        updateDashboard();
        showToast(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
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
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await login(email, password);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // formulário de cadastro
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const userData = {
            name: document.getElementById('register-name').value.trim(),
            email: document.getElementById('register-email').value.trim(),
            unit: document.getElementById('register-unit').value.trim().toUpperCase(), // A/303
            phone: document.getElementById('register-phone').value.trim(),
            type: document.getElementById('register-type').value,
            password: document.getElementById('register-password').value
        };

        try {
            await register(userData);
            document.getElementById('register-form').reset();
            document.getElementById('login-tab').click();
        } catch (error) {
            showToast(error.message, 'error');
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
    document.getElementById('form-aviso').addEventListener('submit', async function(e) {
        e.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value;
        const conteudo = document.getElementById('aviso-conteudo').value;
        if (await createAviso(titulo, conteudo)) {
            this.reset();
            hideModal('modal-aviso');
        }
    });

    document.getElementById('form-chamado').addEventListener('submit', async function(e) {
        e.preventDefault();
        const titulo = document.getElementById('chamado-titulo').value;
        const descricao = document.getElementById('chamado-descricao').value;
        const categoria = document.getElementById('chamado-categoria').value;
        if (await createChamado(titulo, descricao, categoria)) {
            this.reset();
            hideModal('modal-chamado');
        }
    });

    document.getElementById('form-password').addEventListener('submit', async function(e) {
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
        
        try {
            await apiRequest('/users/perfil', {
                method: 'PUT',
                body: JSON.stringify({
                    senha_atual: document.getElementById('current-password').value,
                    nova_senha: newPassword,
                    confirmar_senha: confirmPassword
                })
            });
            showToast('Senha alterada com sucesso!');
            this.reset();
            hideModal('modal-password');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // formulário de perfil
    document.getElementById('perfil-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedData = {
            name:  document.getElementById('perfil-name').value,
            email: document.getElementById('perfil-email').value,
            unit:  document.getElementById('perfil-unit').value,
            phone: document.getElementById('perfil-phone').value
        };

        await updateProfile(updatedData);
    });
});