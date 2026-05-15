$folders = @(
    "apps/api/src",
    "apps/web/src",
    "apps/desktop",
    "packages/shared/src",
    "packages/ai-core/src",
    "packages/ui/src",
    "packages/database/src",
    "configs/eslint",
    "configs/typescript",
    "configs/docker",
    "scripts",
    "docs"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder
}

Write-Host "Estrutura criada com sucesso."