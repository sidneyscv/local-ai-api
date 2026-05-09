# Local AI API VS Code Extension

Extensão para controlar a API local de IA e enviar instruções ao agente diretamente do Visual Studio Code.

## Instalação

1. Abra o diretório `vscode-extension` no VS Code.
2. Rode `npm install`.
3. Rode `npm run compile`.
4. Pressione `F5` para abrir a janela de extensão de desenvolvimento.

## Comandos

- `Local AI API: Iniciar API Local` - inicia o servidor local da API.
- `Local AI API: Executar Agente` - envia instrução para a API local usando um workspace existente.

## Notas

- A extensão espera encontrar `server.js` e a pasta `workspaces` no diretório pai do diretório da extensão.
- Se quiser, coloque a extensão diretamente dentro da raiz do seu projeto principal e use os comandos do Debug para testar.
