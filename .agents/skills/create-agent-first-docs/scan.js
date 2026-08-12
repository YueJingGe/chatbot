#!/usr/bin/env node

/**
 * Agent-First 文档治理 - 项目扫描脚本
 * 零依赖，仅使用 Node.js 原生模块
 * 用法：node <skill_dir>/scan.js [project_root]
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.argv[2] || process.cwd();

// ========== 工具函数 ==========

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeReaddir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

// ========== 检测函数 ==========

/**
 * 检测包管理器
 * 优先级：packageManager 字段 > lock 文件
 */
function detectPackageManager() {
  const pkg = readJsonSafe(path.join(PROJECT_ROOT, "package.json"));
  if (pkg?.packageManager) {
    return pkg.packageManager.split("@")[0];
  }
  if (fs.existsSync(path.join(PROJECT_ROOT, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(PROJECT_ROOT, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(PROJECT_ROOT, "package-lock.json"))) return "npm";
  return "unknown";
}

/**
 * 检测技术栈
 * 从 dependencies + devDependencies 中识别框架、构建工具、状态管理等
 */
function detectTechStack(deps = {}, devDeps = {}) {
  const allDeps = { ...deps, ...devDeps };
  const allKeys = Object.keys(allDeps);

  const frameworkMap = {
    react: "react",
    "react-dom": "react",
    vue: "vue",
    svelte: "svelte",
    "@angular/core": "angular",
    "@solidjs/router": "solid",
    preact: "preact",
    astro: "astro",
    next: "next",
    nuxt: "nuxt",
    remix: "remix",
    "@remix-run/react": "remix",
    "@builder.io/qwik": "qwik",
  };

  const buildToolMap = {
    vite: "vite",
    webpack: "webpack",
    "@angular/cli": "angular-cli",
    esbuild: "esbuild",
    rollup: "rollup",
    turbopack: "turbopack",
    parcel: "parcel",
    "@parcel/core": "parcel",
  };

  const stateManagementList = [
    "zustand",
    "redux",
    "@reduxjs/toolkit",
    "mobx",
    "mobx-react",
    "mobx-react-lite",
    "pinia",
    "vuex",
    "jotai",
    "recoil",
    "valtio",
    "xstate",
    "@xstate/react",
    "effector",
    "@ngxs/store",
    "@ngrx/store",
    "akita",
    "@datorama/akita",
  ];

  const styleSolutionList = [
    "tailwindcss",
    "styled-components",
    "@emotion/react",
    "@emotion/styled",
    "sass",
    "less",
    "unocss",
    "@unocss/core",
    "postcss",
    "css-modules",
    "twin.macro",
    "vanilla-extract",
    "@vanilla-extract/css",
  ];

  const testToolList = [
    "vitest",
    "jest",
    "@testing-library/react",
    "@testing-library/vue",
    "@testing-library/jest-dom",
    "cypress",
    "playwright",
    "@playwright/test",
    "mocha",
    "chai",
    "ava",
  ];

  const linterList = [
    "eslint",
    "prettier",
    "@biomejs/biome",
    "stylelint",
    "oxlint",
  ];

  const requestLibList = [
    "axios",
    "ky",
    "@tanstack/react-query",
    "@tanstack/vue-query",
    "swr",
    "apollo-client",
    "@apollo/client",
    "urql",
    "@urql/core",
    "trpc",
    "@trpc/client",
    "got",
    "node-fetch",
  ];

  function matchFirst(map) {
    for (const [dep, label] of Object.entries(map)) {
      if (allKeys.includes(dep)) return label;
    }
    return "unknown";
  }

  function matchAll(list) {
    return list.filter((dep) => allKeys.includes(dep));
  }

  return {
    framework: matchFirst(frameworkMap),
    buildTool: matchFirst(buildToolMap),
    stateManagement: matchAll(stateManagementList),
    styleSolution: matchAll(styleSolutionList),
    testTools: matchAll(testToolList),
    hasTypeScript: allKeys.includes("typescript"),
    linters: matchAll(linterList),
    requestLibs: matchAll(requestLibList),
  };
}

/**
 * 检测项目类型（单体 / Monorepo）
 */
function detectProjectType() {
  const pkg = readJsonSafe(path.join(PROJECT_ROOT, "package.json"));

  // npm/yarn workspaces
  if (pkg?.workspaces) {
    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces.packages || [];
    return { type: "monorepo", workspaces };
  }

  // pnpm workspaces
  const pnpmWorkspacePath = path.join(PROJECT_ROOT, "pnpm-workspace.yaml");
  if (fs.existsSync(pnpmWorkspacePath)) {
    const content = readTextSafe(pnpmWorkspacePath) || "";
    // 简单解析 packages 字段（不引入 yaml 依赖）
    const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*.+\n?)*)/);
    let workspaces = [];
    if (packagesMatch) {
      workspaces = packagesMatch[1]
        .split("\n")
        .map((line) =>
          line.replace(/^\s*-\s*['"]?/, "").replace(/['"]?\s*$/, "")
        )
        .filter(Boolean);
    }
    return { type: "monorepo", workspaces };
  }

  // lerna
  const lernaPath = path.join(PROJECT_ROOT, "lerna.json");
  if (fs.existsSync(lernaPath)) {
    const lerna = readJsonSafe(lernaPath);
    return {
      type: "monorepo",
      workspaces: lerna?.packages || ["packages/*"],
    };
  }

  // turborepo
  const turboPath = path.join(PROJECT_ROOT, "turbo.json");
  if (fs.existsSync(turboPath)) {
    return { type: "monorepo", workspaces: ["packages/*"] };
  }

  return { type: "single" };
}

/**
 * 扫描已有的 Agent 相关文件
 * 覆盖：AGENTS.md、CLAUDE.md、GEMINI.md、.cursorrules、
 *       .cursor/rules/、.github/copilot-instructions.md、
 *       docs/、skills/、context/
 */
function scanExistingAgentFiles() {
  const files = {};

  // 根目录级别的 Agent 文件
  const rootAgentFiles = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    ".cursorrules",
    ".github/copilot-instructions.md",
  ];

  for (const file of rootAgentFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = readTextSafe(filePath) || "";
      files[file] = {
        exists: true,
        size: content.length,
        lineCount: content.split("\n").length,
        preview: content.slice(0, 500),
      };
    }
  }

  // .cursor/rules/ 目录
  const cursorRulesDir = path.join(PROJECT_ROOT, ".cursor", "rules");
  if (fs.existsSync(cursorRulesDir)) {
    const mdcFiles = safeReaddir(cursorRulesDir).filter((f) =>
      f.endsWith(".mdc")
    );
    files[".cursor/rules"] = {
      exists: true,
      files: mdcFiles,
    };
  }

  // docs/ 目录
  const docsDir = path.join(PROJECT_ROOT, "docs");
  if (fs.existsSync(docsDir)) {
    files["docs"] = {
      exists: true,
      structure: listDirRecursive(docsDir, PROJECT_ROOT, 0, 2),
    };
  }

  // skills/ 目录
  const skillsDir = path.join(PROJECT_ROOT, "skills");
  if (fs.existsSync(skillsDir)) {
    files["skills"] = {
      exists: true,
      files: listDirRecursive(skillsDir, PROJECT_ROOT, 0, 2),
    };
  }

  // context/ 目录
  const contextDir = path.join(PROJECT_ROOT, "context");
  if (fs.existsSync(contextDir)) {
    files["context"] = {
      exists: true,
      files: listDirRecursive(contextDir, PROJECT_ROOT, 0, 2),
    };
  }

  return files;
}

/**
 * 递归列出目录结构
 * @param {string} dir - 目标目录
 * @param {string} root - 项目根目录（用于计算相对路径）
 * @param {number} depth - 当前深度
 * @param {number} maxDepth - 最大深度
 */
function listDirRecursive(dir, root, depth, maxDepth) {
  if (depth >= maxDepth) return [];

  const result = [];
  const entries = safeReaddir(dir);

  for (const entry of entries) {
    // 跳过隐藏文件和 node_modules
    if (entry.startsWith(".") || entry === "node_modules") continue;

    const entryPath = path.join(dir, entry);
    const stat = safeStat(entryPath);
    if (!stat) continue;

    if (stat.isDirectory()) {
      result.push({
        name: entry,
        type: "dir",
        children: listDirRecursive(entryPath, root, depth + 1, maxDepth),
      });
    } else {
      result.push({
        name: entry,
        type: "file",
        path: path.relative(root, entryPath),
      });
    }
  }

  return result;
}

/**
 * 扫描可用的 npm scripts
 * 优先返回常用脚本，其余按字母序排列
 */
function scanScripts() {
  const pkg = readJsonSafe(path.join(PROJECT_ROOT, "package.json"));
  if (!pkg?.scripts) return { all: [], common: [] };

  const allScripts = Object.keys(pkg.scripts);
  const commonNames = [
    "dev",
    "start",
    "build",
    "test",
    "lint",
    "typecheck",
    "format",
    "check",
    "preview",
    "serve",
  ];

  const common = allScripts.filter((s) => commonNames.includes(s));
  const rest = allScripts.filter((s) => !commonNames.includes(s)).sort();

  return { all: [...common, ...rest], common };
}

/**
 * 扫描 src 目录结构（仅第一层子目录）
 */
function scanSrcStructure() {
  const srcDir = path.join(PROJECT_ROOT, "src");
  if (!fs.existsSync(srcDir)) return null;

  const entries = safeReaddir(srcDir);
  const dirs = [];
  const files = [];

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const entryPath = path.join(srcDir, entry);
    const stat = safeStat(entryPath);
    if (!stat) continue;

    if (stat.isDirectory()) {
      dirs.push(entry);
    } else {
      files.push(entry);
    }
  }

  return { dirs, files };
}

/**
 * 扫描各 workspace 的 src 目录（Monorepo 场景）
 */
function scanWorkspaceStructures(workspaces) {
  const result = {};
  for (const ws of workspaces) {
    // 处理 glob 模式（如 packages/*）
    if (ws.includes("*")) {
      const baseDir = ws.replace("/*", "").replace("/**", "");
      const basePath = path.join(PROJECT_ROOT, baseDir);
      if (!fs.existsSync(basePath)) continue;

      const subDirs = safeReaddir(basePath).filter((d) => {
        const stat = safeStat(path.join(basePath, d));
        return stat?.isDirectory();
      });

      for (const subDir of subDirs) {
        const subSrcDir = path.join(basePath, subDir, "src");
        if (fs.existsSync(subSrcDir)) {
          const key = `${baseDir}/${subDir}`;
          const entries = safeReaddir(subSrcDir);
          result[key] = {
            dirs: entries.filter((e) => {
              const stat = safeStat(path.join(subSrcDir, e));
              return stat?.isDirectory();
            }),
            files: entries.filter((e) => {
              const stat = safeStat(path.join(subSrcDir, e));
              return stat?.isFile();
            }),
          };
        }
      }
    } else {
      // 直接路径（如 web、server）
      const srcDir = path.join(PROJECT_ROOT, ws, "src");
      if (fs.existsSync(srcDir)) {
        const entries = safeReaddir(srcDir);
        result[ws] = {
          dirs: entries.filter((e) => {
            const stat = safeStat(path.join(srcDir, e));
            return stat?.isDirectory();
          }),
          files: entries.filter((e) => {
            const stat = safeStat(path.join(srcDir, e));
            return stat?.isFile();
          }),
        };
      }
    }
  }
  return result;
}

// ========== 主函数 ==========

function main() {
  const pkg = readJsonSafe(path.join(PROJECT_ROOT, "package.json"));
  const projectType = detectProjectType();

  const result = {
    projectRoot: PROJECT_ROOT,
    hasPackageJson: !!pkg,
    packageManager: detectPackageManager(),
    projectType,
    techStack: detectTechStack(pkg?.dependencies, pkg?.devDependencies),
    existingAgentFiles: scanExistingAgentFiles(),
    availableScripts: scanScripts(),
    srcStructure: scanSrcStructure(),
  };

  // Monorepo 场景额外扫描各 workspace 的 src 结构
  if (projectType.type === "monorepo" && projectType.workspaces?.length) {
    result.workspaceStructures = scanWorkspaceStructures(
      projectType.workspaces
    );
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
