# setup-local-ai.ps1
# Executa a instalação das dependências e compila a extensão VS Code

$ErrorActionPreference = 'Stop'

Write-Host 'Iniciando setup do Local AI API...' -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host '1) Instalando dependências da raiz...' -ForegroundColor Green
npm install

Write-Host '2) Instalando dependências da extensão VS Code...' -ForegroundColor Green
Set-Location (Join-Path $root 'vscode-extension')
npm install

Write-Host '3) Compilando a extensão VS Code...' -ForegroundColor Green
npm run compile

Write-Host 'Setup concluído com sucesso!' -ForegroundColor Cyan
Write-Host 'Agora você pode executar o servidor com: node server.js' -ForegroundColor Yellow
Write-Host 'E abrir a extensão no VS Code com F5 dentro de vscode-extension.' -ForegroundColor Yellow
