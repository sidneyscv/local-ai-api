import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams, execFileSync } from 'child_process';
import fetch, { RequestInit } from 'node-fetch';

type JsonObject = Record<string, unknown>;

type WebviewMessage = {
	command: string;
	workspace?: string;
	workspaceName?: string;
	instruction?: string;
	plan?: unknown;
	preview?: unknown;
	diff?: string;
	relativePath?: string;
	content?: string;
	kind?: 'file' | 'folder';
	snapshot?: string;
	commandText?: string;
};

type PreviewItem = {
	action?: string;
	path?: string;
	command?: string;
	diff?: string;
	error?: string;
	[key: string]: unknown;
};

type PreviewResponse = {
	workspace: string;
	instruction: string;
	plan: unknown;
	preview: PreviewItem[];
	timestamp: string;
};

type ExecuteResponse = {
	message?: string;
	workspace?: string;
	results?: unknown[];
	timestamp?: string;
	snapshot?: string;
};

type LogsResponse = {
	workspace?: string;
	logs?: {
		actions?: unknown[];
		prompts?: unknown[];
	} | unknown[];
};

let apiProcess: ChildProcessWithoutNullStreams | null = null;
let outputChannel: vscode.OutputChannel;
let panel: vscode.WebviewPanel | undefined;
let activeWorkspace: string | undefined;

function config() {
	return vscode.workspace.getConfiguration('localAiApi');
}

function normalizeOptionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function configuredProjectRoot(): string | undefined {
	const configured = normalizeOptionalString(config().get('projectRoot'));
	if (!configured) {
		return undefined;
	}

	return path.resolve(configured);
}

function hasApiServer(candidate: string | undefined): candidate is string {
	return Boolean(candidate && fs.existsSync(path.join(candidate, 'server.js')));
}

function getApiRoot(context: vscode.ExtensionContext): string | undefined {
	const configured = configuredProjectRoot();
	if (hasApiServer(configured)) {
		return configured;
	}

	const candidates = [
		path.resolve(context.extensionPath, '..'),
		...(vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath),
		process.cwd()
	];

	return candidates.find(hasApiServer);
}

function getApiPort(rootPath: string | undefined): number {
	if (!rootPath) {
		return 3000;
	}

	const envPath = path.join(rootPath, '.env');
	if (!fs.existsSync(envPath)) {
		return 3000;
	}

	const envContent = fs.readFileSync(envPath, 'utf8');
	const portMatch = envContent.match(/^PORT\s*=\s*(\d+)/m);
	if (!portMatch) {
		return 3000;
	}

	const port = Number(portMatch[1]);
	return Number.isInteger(port) && port > 0 ? port : 3000;
}

function getApiBaseUrl(context: vscode.ExtensionContext): string {
	const configured = normalizeOptionalString(config().get('apiUrl'));
	if (configured) {
		return configured.replace(/\/+$/, '');
	}

	const rootPath = getApiRoot(context);
	return `http://localhost:${getApiPort(rootPath)}`;
}

function postToWebview(message: JsonObject) {
	void panel?.webview.postMessage(message);
}

function postStatus(text: string, level: 'idle' | 'busy' | 'success' | 'error' = 'idle') {
	postToWebview({ type: 'status', text, level });
}

function postError(operation: string, error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	outputChannel.appendLine(`${operation}: ${message}`);
	postToWebview({ type: 'error', operation, message });
	postStatus(message, 'error');
}

async function delay(ms: number) {
	await new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest<T>(context: vscode.ExtensionContext, endpoint: string, init?: RequestInit): Promise<T> {
	const baseUrl = getApiBaseUrl(context);
	const response = await fetch(`${baseUrl}${endpoint}`, init);
	const text = await response.text();
	let data: unknown;

	try {
		data = text ? JSON.parse(text) : {};
	} catch {
		throw new Error(`Resposta invalida da API: ${text.slice(0, 160)}`);
	}

	if (!response.ok) {
		throw new Error(`API retornou HTTP ${response.status}`);
	}

	if (data && typeof data === 'object' && 'error' in data) {
		const errorData = data as { error?: unknown; details?: unknown };
		const details = errorData.details ? ` (${String(errorData.details)})` : '';
		throw new Error(`${String(errorData.error)}${details}`);
	}

	return data as T;
}

async function isApiRunning(context: vscode.ExtensionContext): Promise<boolean> {
	try {
		await apiRequest<unknown>(context, '/workspaces');
		return true;
	} catch {
		return false;
	}
}

async function waitForApi(context: vscode.ExtensionContext, timeoutMs = 15000): Promise<boolean> {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		if (await isApiRunning(context)) {
			return true;
		}
		await delay(500);
	}

	return false;
}

function getNpmCommand() {
	return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function runChild(command: string, args: string[], cwd: string, label: string): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			shell: false,
			windowsHide: true
		});

		child.stdout.on('data', data => outputChannel.appendLine(`${label}: ${data.toString().trimEnd()}`));
		child.stderr.on('data', data => outputChannel.appendLine(`${label} erro: ${data.toString().trimEnd()}`));
		child.on('error', reject);
		child.on('close', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`${label} terminou com codigo ${code}`));
			}
		});
	});
}

async function ensureDependencies(rootPath: string) {
	const packageJsonPath = path.join(rootPath, 'package.json');
	const nodeModulesPath = path.join(rootPath, 'node_modules');

	if (!fs.existsSync(packageJsonPath) || fs.existsSync(nodeModulesPath)) {
		return;
	}

	postStatus('Instalando dependencias da API local...', 'busy');
	await runChild(getNpmCommand(), ['install'], rootPath, 'npm install');
}

async function startApi(context: vscode.ExtensionContext) {
	if (apiProcess && !apiProcess.killed) {
		postStatus(`API ja iniciada em ${getApiBaseUrl(context)}`, 'success');
		return;
	}

	if (await isApiRunning(context)) {
		postStatus(`API ja esta respondendo em ${getApiBaseUrl(context)}`, 'success');
		return;
	}

	const rootPath = getApiRoot(context);
	if (!rootPath) {
		throw new Error('Nao encontrei server.js. Configure localAiApi.projectRoot para a raiz do Local AI API.');
	}

	await ensureDependencies(rootPath);

	outputChannel.appendLine(`Iniciando API em ${rootPath}`);
	postStatus('Iniciando API local...', 'busy');

	apiProcess = spawn(getNpmCommand(), ['run', 'start'], {
		cwd: rootPath,
		stdio: ['pipe', 'pipe', 'pipe'],
		shell: false,
		windowsHide: true
	});

	apiProcess.stdout.on('data', data => outputChannel.appendLine(`API: ${data.toString().trimEnd()}`));
	apiProcess.stderr.on('data', data => outputChannel.appendLine(`API erro: ${data.toString().trimEnd()}`));
	apiProcess.on('close', code => {
		outputChannel.appendLine(`API encerrada com codigo ${code}`);
		apiProcess = null;
		postStatus('API parada', 'idle');
		void sendState(context);
	});

	const running = await waitForApi(context);
	if (!running) {
		throw new Error('A API nao respondeu dentro do tempo esperado. Veja o canal de saida "Local AI IDE".');
	}

	postStatus(`API online em ${getApiBaseUrl(context)}`, 'success');
	await sendState(context);
}

function getPidsByPort(port: number): string[] {
	try {
		if (process.platform === 'win32') {
			const output = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
			const pids = output
				.split(/\r?\n/)
				.filter(line => line.includes(`:${port}`) && line.toUpperCase().includes('LISTENING'))
				.map(line => line.trim().split(/\s+/).pop())
				.filter((pid): pid is string => Boolean(pid));

			return [...new Set(pids)];
		}

		const output = execFileSync('lsof', ['-i', `:${port}`, '-t'], { encoding: 'utf8' });
		return [...new Set(output.split(/\r?\n/).filter(Boolean))];
	} catch {
		return [];
	}
}

async function stopApi(context: vscode.ExtensionContext) {
	if (apiProcess && !apiProcess.killed) {
		apiProcess.kill();
		apiProcess = null;
		postStatus('API parada', 'idle');
		await sendState(context);
		return;
	}

	const rootPath = getApiRoot(context);
	const port = getApiPort(rootPath);
	const pids = getPidsByPort(port);
	if (pids.length === 0) {
		postStatus('Nenhum processo da API encontrado', 'idle');
		await sendState(context);
		return;
	}

	const confirm = await vscode.window.showWarningMessage(
		`A porta ${port} esta em uso pelos PIDs ${pids.join(', ')}. Parar esses processos?`,
		{ modal: true },
		'Parar'
	);
	if (confirm !== 'Parar') {
		return;
	}

	for (const pid of pids) {
		if (process.platform === 'win32') {
			execFileSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
		} else {
			process.kill(Number(pid), 'SIGTERM');
		}
	}

	postStatus('Processos parados', 'idle');
	await sendState(context);
}

function assertWorkspaceName(workspace: string | undefined): string {
	if (!workspace || workspace.includes('..') || path.isAbsolute(workspace) || /[\\/]/.test(workspace)) {
		throw new Error('Workspace invalido');
	}

	return workspace;
}

function resolveWorkspacePath(context: vscode.ExtensionContext, workspace: string | undefined, relativePath = ''): string {
	const safeWorkspace = assertWorkspaceName(workspace);
	const rootPath = getApiRoot(context);
	if (!rootPath) {
		throw new Error('Raiz da API nao encontrada');
	}

	const workspaceRoot = path.resolve(rootPath, 'workspaces', safeWorkspace);
	const target = path.resolve(workspaceRoot, relativePath || '.');
	if (target !== workspaceRoot && !target.startsWith(`${workspaceRoot}${path.sep}`)) {
		throw new Error('Path fora do workspace bloqueado');
	}

	return target;
}

async function listWorkspaces(context: vscode.ExtensionContext) {
	const workspaces = await apiRequest<string[]>(context, '/workspaces');
	postToWebview({ type: 'workspaces', workspaces, activeWorkspace });

	if (!activeWorkspace && workspaces.length > 0) {
		activeWorkspace = workspaces[0];
		await loadWorkspaceOverview(context, activeWorkspace);
	}
}

async function createWorkspace(context: vscode.ExtensionContext, name: string | undefined) {
	const workspaceName = assertWorkspaceName(name);
	await apiRequest(context, '/workspace', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: workspaceName })
	});
	activeWorkspace = workspaceName;
	postStatus(`Workspace "${workspaceName}" pronto`, 'success');
	await listWorkspaces(context);
	await loadWorkspaceOverview(context, workspaceName);
}

async function loadWorkspaceOverview(context: vscode.ExtensionContext, workspace: string | undefined) {
	const workspaceName = assertWorkspaceName(workspace);
	activeWorkspace = workspaceName;

	const [tree, analysis, logs] = await Promise.all([
		apiRequest<{ workspace: string; tree: string }>(context, `/tree?workspace=${encodeURIComponent(workspaceName)}`),
		apiRequest<unknown>(context, `/analyze?workspace=${encodeURIComponent(workspaceName)}`),
		apiRequest<LogsResponse>(context, `/logs?workspace=${encodeURIComponent(workspaceName)}`).catch(() => ({ logs: [] }))
	]);

	postToWebview({
		type: 'workspaceOverview',
		workspace: workspaceName,
		tree: tree.tree,
		analysis,
		logs
	});
}

async function generatePreview(context: vscode.ExtensionContext, workspace: string | undefined, instruction: string | undefined) {
	const workspaceName = assertWorkspaceName(workspace);
	if (!instruction || !instruction.trim()) {
		throw new Error('Digite uma instrucao para o agente');
	}

	postStatus('Gerando preview do plano...', 'busy');
	const result = await apiRequest<PreviewResponse>(context, '/agent/preview', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ workspace: workspaceName, instruction })
	});

	activeWorkspace = workspaceName;
	postToWebview({ type: 'preview', data: result });
	postStatus('Preview gerado', 'success');
}

async function executePlan(context: vscode.ExtensionContext, workspace: string | undefined, plan: unknown) {
	const workspaceName = assertWorkspaceName(workspace);
	if (!plan) {
		throw new Error('Nenhum plano para executar');
	}

	postStatus('Aplicando plano aprovado...', 'busy');
	const result = await apiRequest<ExecuteResponse>(context, '/agent/execute', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ workspace: workspaceName, plan })
	});

	await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	postToWebview({ type: 'executeResult', data: result });
	postStatus('Plano aplicado', 'success');
	await loadWorkspaceOverview(context, workspaceName);
}

async function rollback(context: vscode.ExtensionContext, workspace: string | undefined, snapshot: string | undefined) {
	const workspaceName = assertWorkspaceName(workspace);
	if (!snapshot) {
		throw new Error('Snapshot nao informado');
	}

	const confirm = await vscode.window.showWarningMessage(
		`Restaurar snapshot ${snapshot} em ${workspaceName}?`,
		{ modal: true },
		'Restaurar'
	);
	if (confirm !== 'Restaurar') {
		return;
	}

	const result = await apiRequest(context, '/rollback', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ workspace: workspaceName, snapshot })
	});

	await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	postToWebview({ type: 'rollbackResult', data: result });
	postStatus('Rollback concluido', 'success');
	await loadWorkspaceOverview(context, workspaceName);
}

async function openWorkspaceFolder(context: vscode.ExtensionContext, workspace: string | undefined) {
	const target = resolveWorkspacePath(context, workspace);
	await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(target), false);
}

async function openFile(context: vscode.ExtensionContext, workspace: string | undefined, relativePath: string | undefined) {
	if (!relativePath) {
		throw new Error('Arquivo nao informado');
	}

	const target = resolveWorkspacePath(context, workspace, relativePath);
	if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
		throw new Error('Arquivo nao encontrado');
	}

	const document = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
	await vscode.window.showTextDocument(document, { preview: false });
}

async function createItem(context: vscode.ExtensionContext, message: WebviewMessage) {
	const target = resolveWorkspacePath(context, message.workspace, message.relativePath ?? '');
	if (message.kind === 'folder') {
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(target));
	} else {
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(target)));
		await vscode.workspace.fs.writeFile(vscode.Uri.file(target), Buffer.from(message.content ?? '', 'utf8'));
	}

	await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	postStatus(`${message.kind === 'folder' ? 'Pasta' : 'Arquivo'} criado`, 'success');
	await loadWorkspaceOverview(context, message.workspace);
}

async function showDiff(diff: string | undefined) {
	if (!diff) {
		throw new Error('Diff vazio');
	}

	const document = await vscode.workspace.openTextDocument({
		content: diff,
		language: 'diff'
	});
	await vscode.window.showTextDocument(document, { preview: true });
}

function runTerminalCommand(context: vscode.ExtensionContext, commandText: string | undefined, workspace: string | undefined) {
	if (!commandText || !commandText.trim()) {
		throw new Error('Comando vazio');
	}

	const cwd = workspace ? resolveWorkspacePath(context, workspace) : getApiRoot(context);
	const terminal = vscode.window.createTerminal({ name: 'Local AI IDE', cwd });
	terminal.show();
	terminal.sendText(commandText);
}

async function sendState(context: vscode.ExtensionContext) {
	const rootPath = getApiRoot(context);
	const running = await isApiRunning(context);
	postToWebview({
		type: 'state',
		apiBaseUrl: getApiBaseUrl(context),
		apiRoot: rootPath,
		apiRunning: running,
		activeWorkspace
	});
}

async function handleWebviewMessage(context: vscode.ExtensionContext, message: WebviewMessage) {
	try {
		switch (message.command) {
			case 'ready':
				await sendState(context);
				if (await isApiRunning(context)) {
					await listWorkspaces(context);
				}
				break;
			case 'startApi':
				await startApi(context);
				await listWorkspaces(context);
				break;
			case 'stopApi':
				await stopApi(context);
				break;
			case 'listWorkspaces':
				await listWorkspaces(context);
				break;
			case 'createWorkspace':
				await createWorkspace(context, message.workspaceName);
				break;
			case 'selectWorkspace':
				await loadWorkspaceOverview(context, message.workspace);
				break;
			case 'openWorkspace':
				await openWorkspaceFolder(context, message.workspace);
				break;
			case 'generatePreview':
				await generatePreview(context, message.workspace, message.instruction);
				break;
			case 'executePlan':
				await executePlan(context, message.workspace, message.plan);
				break;
			case 'rollback':
				await rollback(context, message.workspace, message.snapshot);
				break;
			case 'openFile':
				await openFile(context, message.workspace, message.relativePath);
				break;
			case 'createItem':
				await createItem(context, message);
				break;
			case 'showDiff':
				await showDiff(message.diff);
				break;
			case 'runTerminal':
				runTerminalCommand(context, message.commandText, message.workspace);
				break;
			default:
				throw new Error(`Comando desconhecido: ${message.command}`);
		}
	} catch (error) {
		postError(message.command, error);
	}
}

function createWebviewPanel(context: vscode.ExtensionContext) {
	if (panel) {
		panel.reveal(vscode.ViewColumn.One);
		return;
	}

	panel = vscode.window.createWebviewPanel(
		'localAiIde',
		'Local AI IDE',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src'))]
		}
	);

	const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
	panel.webview.html = fs.readFileSync(htmlPath, 'utf8');

	panel.webview.onDidReceiveMessage(
		message => void handleWebviewMessage(context, message as WebviewMessage),
		undefined,
		context.subscriptions
	);

	panel.onDidDispose(
		() => {
			panel = undefined;
		},
		null,
		context.subscriptions
	);
}

async function selectWorkspace(context: vscode.ExtensionContext): Promise<string | undefined> {
	const workspaces = await apiRequest<string[]>(context, '/workspaces');
	if (workspaces.length === 0) {
		vscode.window.showErrorMessage('Nenhum workspace encontrado');
		return undefined;
	}

	return vscode.window.showQuickPick(workspaces, {
		placeHolder: 'Selecione um workspace'
	});
}

async function runAgentInstruction(context: vscode.ExtensionContext) {
	await startApi(context);
	const workspace = await selectWorkspace(context);
	if (!workspace) {
		return;
	}

	const instruction = await vscode.window.showInputBox({
		prompt: 'Instrucao para o agente',
		placeHolder: 'Ex: crie testes para o modulo de usuarios'
	});
	if (!instruction) {
		return;
	}

	const preview = await apiRequest<PreviewResponse>(context, '/agent/preview', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ workspace, instruction })
	});

	const previewText = preview.preview
		.map(item => `${item.action ?? 'acao'}: ${item.path ?? item.command ?? ''}\n${item.diff ?? item.error ?? ''}`)
		.join('\n\n');
	await showDiff(previewText);

	const confirm = await vscode.window.showInformationMessage(
		'Aplicar o plano gerado pelo agente?',
		{ modal: true },
		'Aplicar'
	);
	if (confirm !== 'Aplicar') {
		return;
	}

	await executePlan(context, workspace, preview.plan);
	vscode.window.showInformationMessage('Plano aplicado pelo agente');
}

async function commandCreateWorkspace(context: vscode.ExtensionContext) {
	await startApi(context);
	const name = await vscode.window.showInputBox({
		prompt: 'Nome do novo workspace',
		validateInput: value => {
			if (!value.trim()) {
				return 'Informe um nome';
			}
			if (value.includes('..') || /[\\/]/.test(value)) {
				return 'Use apenas o nome do workspace, sem barras';
			}
			return undefined;
		}
	});

	if (!name) {
		return;
	}

	await createWorkspace(context, name.trim());
}

async function commandOpenWorkspace(context: vscode.ExtensionContext) {
	await startApi(context);
	const workspace = await selectWorkspace(context);
	if (workspace) {
		await openWorkspaceFolder(context, workspace);
	}
}

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Local AI IDE');
	outputChannel.appendLine('Local AI IDE extension activated');

	context.subscriptions.push(
		vscode.commands.registerCommand('local-ai-api.openPanel', () => createWebviewPanel(context)),
		vscode.commands.registerCommand('local-ai-api.openIde', () => createWebviewPanel(context)),
		vscode.commands.registerCommand('local-ai-api.startApi', async () => {
			try {
				await startApi(context);
			} catch (error) {
				postError('startApi', error);
				vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
			}
		}),
		vscode.commands.registerCommand('local-ai-api.stopApi', async () => {
			try {
				await stopApi(context);
			} catch (error) {
				postError('stopApi', error);
				vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
			}
		}),
		vscode.commands.registerCommand('local-ai-api.runAgent', () => runAgentInstruction(context)),
		vscode.commands.registerCommand('local-ai-api.createWorkspace', () => commandCreateWorkspace(context)),
		vscode.commands.registerCommand('local-ai-api.openWorkspace', () => commandOpenWorkspace(context))
	);

	if (config().get<boolean>('autoStart')) {
		void startApi(context).catch(error => postError('autoStart', error));
	}
}

export function deactivate() {
	if (apiProcess && !apiProcess.killed) {
		apiProcess.kill();
	}
}
