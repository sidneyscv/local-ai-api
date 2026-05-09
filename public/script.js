// Função para criar workspace
async function createWorkspace() {
    const name = document.getElementById('workspaceName').value;
    if (!name) {
        alert('Digite um nome para o workspace');
        return;
    }

    try {
        const response = await fetch('/workspace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();
        document.getElementById('workspaceResult').textContent = JSON.stringify(result, null, 2);
        loadWorkspaces(); // Recarregar lista de workspaces
    } catch (error) {
        document.getElementById('workspaceResult').textContent = 'Erro: ' + error.message;
    }
}

// Função para executar o agente
async function runAgent() {
    const workspace = document.getElementById('workspaceSelect').value;
    const instruction = document.getElementById('instruction').value;

    if (!workspace || !instruction) {
        alert('Selecione um workspace e digite uma instrução');
        return;
    }

    try {
        const response = await fetch('/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspace, instruction })
        });

        const result = await response.json();
        document.getElementById('agentResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('agentResult').textContent = 'Erro: ' + error.message;
    }
}

// Função para listar arquivos (usando uma nova rota que precisamos adicionar)
async function listFiles() {
    const workspace = document.getElementById('workspaceSelect').value;
    if (!workspace) {
        alert('Selecione um workspace');
        return;
    }

    try {
        const response = await fetch(`/files?workspace=${workspace}`);
        const result = await response.json();
        document.getElementById('filesList').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('filesList').textContent = 'Erro: ' + error.message;
    }
}

// Função para carregar workspaces disponíveis
async function loadWorkspaces() {
    try {
        const response = await fetch('/workspaces');
        const workspaces = await response.json();
        const select = document.getElementById('workspaceSelect');
        select.innerHTML = '<option value="">Selecione um workspace</option>';
        workspaces.forEach(ws => {
            const option = document.createElement('option');
            option.value = ws;
            option.textContent = ws;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar workspaces:', error);
    }
}

// Carregar workspaces ao iniciar
loadWorkspaces();