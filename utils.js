import fs from "fs";
import path from "path";

/**
 * 🌳 Gera árvore de diretório em formato texto
 */
export function generateFileTree(dir, prefix = "", maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return "";

  const entries = fs.readdirSync(dir);
  
  // Pastas para ignorar
  const ignoreList = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv"];
  const filtered = entries.filter(e => !ignoreList.includes(e));

  let tree = "";

  filtered.forEach((entry, index) => {
    const fullPath = path.join(dir, entry);
    const isLast = index === filtered.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      tree += `${prefix}${connector}📁 ${entry}/\n`;
      tree += generateFileTree(fullPath, nextPrefix, maxDepth, currentDepth + 1);
    } else {
      const icon = getFileIcon(entry);
      tree += `${prefix}${connector}${icon} ${entry}\n`;
    }
  });

  return tree;
}

/**
 * 🎯 Detecta o tipo de projeto
 */
export function detectProjectType(basePath) {
  const types = [];

  const files = fs.readdirSync(basePath);

  if (files.includes("package.json")) {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(basePath, "package.json"), "utf-8"));
    
    if (pkgJson.dependencies?.express || pkgJson.dependencies?.fastify) {
      types.push("Node.js/Express Backend");
    }
    if (pkgJson.dependencies?.react || pkgJson.devDependencies?.react) {
      types.push("React Frontend");
    }
    if (pkgJson.dependencies?.next) {
      types.push("Next.js Full-Stack");
    }
    if (pkgJson.dependencies?.vue) {
      types.push("Vue.js Frontend");
    }
    if (pkgJson.dependencies?.typescript || pkgJson.devDependencies?.typescript) {
      types.push("TypeScript");
    }
    if (!types.length) {
      types.push("Node.js Project");
    }
  }

  if (files.includes("requirements.txt")) {
    types.push("Python Project");
  }

  if (files.includes("pom.xml")) {
    types.push("Java/Maven Project");
  }

  if (files.includes("go.mod")) {
    types.push("Go Project");
  }

  if (files.includes(".ruby-version") || files.includes("Gemfile")) {
    types.push("Ruby/Rails Project");
  }

  return types.length > 0 ? types.join(", ") : "Unknown Project";
}

/**
 * 📊 Retorna resumo do projeto
 */
export function getProjectSummary(basePath) {
  const summary = {
    type: detectProjectType(basePath),
    structure: "",
    files: {
      total: 0,
      byType: {}
    },
    hasTests: false,
    hasDocs: false,
    hasCI: false
  };

  // Estrutura
  summary.structure = generateFileTree(basePath, "", 2);

  // Contar arquivos
  function countFiles(dir) {
    const entries = fs.readdirSync(dir);
    const ignoreList = ["node_modules", ".git", "dist", "build"];

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !ignoreList.includes(entry)) {
        countFiles(fullPath);
      } else if (stat.isFile()) {
        summary.files.total++;
        const ext = path.extname(entry) || "no-extension";
        summary.files.byType[ext] = (summary.files.byType[ext] || 0) + 1;
      }
    });
  }

  countFiles(basePath);

  // Verificar testes
  const dirFiles = fs.readdirSync(basePath);
  summary.hasTests = dirFiles.some(f => f.includes("test") || f.includes("spec"));
  summary.hasDocs = dirFiles.some(f => f === "README.md" || f === "docs");
  summary.hasCI = dirFiles.some(f => f === ".github" || f === ".gitlab-ci.yml" || f === ".travis.yml");

  return summary;
}

/**
 * 🎨 Retorna ícone para tipo de arquivo
 */
function getFileIcon(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const icons = {
    ".js": "📜",
    ".ts": "📘",
    ".jsx": "⚛️",
    ".tsx": "⚛️",
    ".py": "🐍",
    ".json": "📋",
    ".html": "🌐",
    ".css": "🎨",
    ".scss": "🎨",
    ".md": "📄",
    ".txt": "📝",
    ".env": "🔐",
    ".yml": "⚙️",
    ".yaml": "⚙️",
    ".xml": "📦",
    ".sql": "🗄️",
    ".sh": "🔧",
    ".gitignore": "🚫"
  };

  return icons[ext] || "📄";
}

/**
 * 🔍 Retorna lista de dependências do projeto
 */
export function getDependencies(basePath) {
  const deps = {
    npm: [],
    yarn: [],
    pip: [],
    other: []
  };

  // NPM/Node
  const pkgJsonPath = path.join(basePath, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    deps.npm = {
      dependencies: Object.keys(pkgJson.dependencies || {}),
      devDependencies: Object.keys(pkgJson.devDependencies || {})
    };
  }

  // Python
  const reqPath = path.join(basePath, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    const content = fs.readFileSync(reqPath, "utf-8");
    deps.pip = content.split("\n").filter(l => l.trim() && !l.startsWith("#"));
  }

  return deps;
}

export default {
  generateFileTree,
  detectProjectType,
  getProjectSummary,
  getDependencies
};
