# Condo Connect | Sistema Monolítico

Aplicação web monolítica para gestão de condomínios, com interface e API integradas no mesmo projeto Flask. O sistema reúne autenticação, perfis, avisos e chamados para síndicos e moradores.

## Visão Geral

O Condo Connect facilita a administração do condomínio e a comunicação entre síndicos, moradores e prestadores de serviço. A interface responsiva foi desenvolvida com foco em clareza, usabilidade e performance, usando HTML, CSS, TailwindCSS e JavaScript. A versão de interface foi concebida como uma base com componentes reutilizáveis e agora é servida pelo mesmo backend que fornece os dados.

![Preview da landing page](app/static/img/imagem_condoC.png)

---

## 🚀 **Funcionalidades Principais**

### 🔐 **Autenticação**

* Login e logout com Flask-Login
* Senha criptografada com Werkzeug
* Permissões baseadas no tipo de usuário:

  * **morador** – restrito
  * **sindico** – acesso administrativo

---

## 👤 **Usuários**

### Morador:

* Criar conta
* Autenticar
* Editar perfil (nome, email, telefone, bloco/apto e senha)
* Ver apenas os próprios chamados
* Ver avisos ativos
* Não pode acessar o sistema enquanto a conta estiver desativada

### Síndico:

* Tudo que o morador pode
* Listar todos os usuários do sistema
* Ativar e desativar usuários
* Criar, editar e desativar avisos
* Alterar o status de qualquer chamado

---

## 🔔 **Avisos**

* Criados apenas por síndicos
* Editáveis por 5 minutos após criados
* Quando desativados → deixam de aparecer
* Moradores só visualizam os avisos ativos

---

## 🛠 **Chamados**

### Morador:

* Criar chamados
* Ver detalhes do próprio chamado
* Ver apenas chamados com status **aberto** ou **andamento** (os concluídos somem para moradores)

### Síndico:

* Ver todos os chamados
* Alterar status para:

  * `aberto`
  * `andamento`
  * `concluido`

---

## 🧩 **Permissões Resumidas**

| Ação              | Morador     | Síndico   |
| ----------------- | ----------- | --------- |
| Ver avisos ativos | ✔           | ✔         |
| Criar aviso       | ✖           | ✔         |
| Editar aviso      | ✖           | ✔ (5 min) |
| Remover aviso     | ✖           | ✔         |
| Criar chamado     | ✔           | ✔         |
| Ver chamados      | Apenas dele | Todos     |
| Alterar status    | ✖           | ✔         |
| Listar usuários   | ✖           | ✔         |
| Ativar/desativar usuários | ✖   | ✔         |

---

## 🗂 **Tecnologias Utilizadas**

* Python
* Flask
* Flask-Login
* SQLAlchemy
* Marshmallow
* Flask-Migrate
* HTML5
* CSS3
* TailwindCSS
* JavaScript

---

## 🧱 **Estrutura do Projeto**

```
app/
 ├── controllers/
 │   ├── adm_controller.py
 │   ├── auth_controller.py
 │   ├── aviso_controller.py
 │   ├── chamado_controller.py
 │   ├── pages_controller.py
 │   └── user_controller.py
 ├── models/
 │   ├── aviso_model.py
 │   ├── chamado_model.py
 │   └── user_model.py
 ├── schemas/
 │   ├── aviso_schema.py
 │   ├── chamado_schema.py
 │   └── user_schema.py
 ├── services/
 │   ├── auth_service.py
 │   ├── aviso_service.py
 │   ├── chamado_service.py
 │   └── user_service.py
 ├── static/
 │   ├── css/
 │   ├── img/
 │   └── js/
 ├── templates/
 │   ├── index.html
 │   └── login_dash.html
 ├── __init__.py
 ├── config.py
 └── ...
migrations/
 └── versions/
```

Os templates e arquivos estáticos são servidos pelo Flask. A landing page está em `/` e o painel de login e gestão está em `/login_dash`.

---

## 🔌 **Como Rodar o Projeto**

### 1. Criar ambiente virtual

```bash
python -m venv .venv
source .venv/bin/activate  # Linux
.venv\Scripts\activate    # Windows
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```
FLASK_ENV=development
SECRET_KEY=uma_senha_segura
DATABASE_URL=sqlite:///data.db
```

### 4. Aplicar as migrações do banco

Não é necessário executar `flask db init` nem `flask db migrate`. Para aplicar as migrações existentes:

```bash
flask db upgrade
```

### 5. Executar o servidor

```bash
flask run
```

Acesse `http://127.0.0.1:5000/` para abrir a landing page ou `http://127.0.0.1:5000/login_dash` para acessar o painel. Não abra os templates HTML diretamente no navegador: eles dependem das rotas e dos arquivos estáticos servidos pelo Flask.

---

## 📌 **Endpoints disponíveis**

### 🔐 Autenticação

| Método | URL            | Descrição          |
| ------ | -------------- | ------------------ |
| POST   | /auth/login    | Login do usuário   |
| POST   | /auth/logout   | Logout do usuário  |

---

### 👤 Usuário

| Método | URL             | Descrição              |
| ------ | --------------- | ---------------------- |
| POST   | /users/register | Cadastra novo usuário  |
| GET    | /users/perfil   | Informações do usuário |
| PUT    | /users/perfil   | Atualiza informações   |

---

### 👤 Administração (Síndico)

| Método | URL             | Descrição                |
| ------ | -------------   | ------------------------ |
| GET    | /admin/usuarios | Listar todos os usuários |
| PATCH  | /admin/usuarios/{id} | Ativar ou desativar usuário |

---

### 🔔 Avisos

| Método | URL          | Descrição                 |
| ------ | ------------ | ------------------------- |
| GET    | /avisos      | Listar avisos ativos      |
| POST   | /avisos      | Criar aviso (síndico)     |
| PUT    | /avisos/{id} | Editar aviso (síndico)    |
| DELETE | /avisos/{id} | Desativar aviso (síndico) |

---

### 🛠 Chamados

| Método | URL           | Descrição                                    |
| ------ | ------------- | -------------------------------------------- |
| GET    | /chamado      | Listar chamados (regras por tipo de usuário) |
| GET    | /chamado/{id} | Detalhes de um chamado                       |
| POST   | /chamado      | Criar chamado                                |
| PATCH  | /chamado/{id} | Alterar status (somente síndico)             |

---

## 📄 Licença

Este projeto está licenciado sob os termos da [Licença MIT](./LICENSE), com cláusula adicional de atribuição.

## Equipe

| Membro | Função | Perfil |
|:--|:--|:--|
| **Ivyson Thauan** | Gerente | [GitHub](https://github.com/ivysonin) |
| **Bárbara Siqueira** | Analista de Dados | [GitHub](https://github.com/barbaraspa) |
| **José Pedro** | Designer | [GitHub](https://github.com/zepreda) |
| **Paulo Henrique** | Dev Full-Stack | [GitHub](https://github.com/Henrique8350) |
