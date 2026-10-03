#!/usr/bin/env node
/* global __dirname */
/* Repository boundaries and seed integrity. Runtime/business tests remain separate gates. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];
let checks = 0;
function check(condition, message) { checks += 1; if (!condition) failures.push(message); }
function json(file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
const manifest = json('package.json');
const lock = json('package-lock.json');
const config = json('app.json').expo;
const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
const forbiddenPackages = /^(?:(?:react-dom|react-native-web|react-native-webview|next|vite|vue|angular|ionic|electron|firebase|supabase|express|fastify|koa|hono|mongoose|prisma|pg|mysql2|sequelize|stripe|mercadopago|pagarme)(?:$|\/)|(?:@vitejs|@vue|@angular|@ionic|@firebase|@react-native-firebase|@supabase|@nestjs|@prisma|@stripe|@stripe-react-native|@paypal)\/)/;
for (const name of Object.keys(dependencies)) check(!forbiddenPackages.test(name), `Dependência direta fora do escopo mobile/local: ${name}`);
for (const name of ['expo', 'react', 'react-native', 'typescript', '@react-native-async-storage/async-storage', 'expo-file-system']) check(Boolean(dependencies[name]), `Dependência essencial ausente: ${name}`);
check(lock.lockfileVersion >= 2 && Boolean(lock.packages?.['']), 'package-lock.json precisa de inventário reproduzível de pacotes.');
for (const section of ['dependencies', 'devDependencies']) {
  const declared = manifest[section] ?? {};
  const locked = lock.packages?.['']?.[section] ?? {};
  check(JSON.stringify(Object.entries(declared).sort()) === JSON.stringify(Object.entries(locked).sort()), `package.json e package-lock.json divergem em ${section}; execute npm install antes de npm ci.`);
}
check(!fs.existsSync(path.join(root, 'yarn.lock')) && !fs.existsSync(path.join(root, 'pnpm-lock.yaml')), 'Use somente npm/package-lock.json neste projeto.');
check(config?.platforms?.includes('android') && !config.platforms.includes('web'), 'A configuração Expo deve incluir Android e excluir web.');
check(config?.android?.softwareKeyboardLayoutMode === 'resize', 'Android deve redimensionar o conteúdo com o teclado.');
check(typeof config?.android?.package === 'string' && /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(config.android.package), 'Identificador Android ausente ou inválido.');
const tsConfigPath = path.join(root, 'tsconfig.json');
const loaded = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(loaded.config ?? {}, ts.sys, root);
check(!loaded.error && parsed.errors.length === 0, 'tsconfig.json não pôde ser resolvido pelo compilador TypeScript.');
check(parsed.options.strict === true && parsed.options.noImplicitAny !== false && parsed.options.strictNullChecks !== false, 'TypeScript strict deve permanecer efetivo, sem desabilitar noImplicitAny/strictNullChecks.');
check(parsed.options.noUncheckedIndexedAccess === true, 'Acesso indexado deve continuar verificado pelo TypeScript.');

const ignored = new Set(['node_modules', 'work', 'outputs', '.git', '.expo', 'coverage']);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name)) return [];
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? walk(filename) : [filename];
  });
}
const files = walk(root);
const relative = filename => path.relative(root, filename).split(path.sep).join('/');
for (const filename of files) {
  const file = relative(filename);
  check(!/\.(?:html?|css|scss|sass|less|vue|svelte|dart)$/i.test(file), `Arquivo de frontend incompatível encontrado: ${file}`);
  check(!/(?:^|\/)(?:next\.config\.[^/]+|vite\.config\.[^/]+|angular\.json|ionic\.config\.json|firebase\.json|supabase\/config\.toml)$/.test(file), `Configuração de stack proibida: ${file}`);
}
const applicationFiles = files.filter(filename => /\.[cm]?[jt]sx?$/.test(filename) && !relative(filename).startsWith('scripts/') && !/\.(?:test|spec)\.[^.]+$/.test(filename) && !/(?:\.config\.[cm]?[jt]s|(?:^|\/)jest\.setup\.[cm]?[jt]s)$/.test(relative(filename)));
const imported = new Set();
let nativeJsx = 0;
for (const filename of applicationFiles) {
  const file = relative(filename);
  check(/\.tsx?$/.test(filename), `Código do aplicativo precisa ser TypeScript: ${file}`);
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
  function report(node, message) {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    failures.push(`${file}:${line}: ${message}`);
  }
  function dependency(node, specifier) {
    imported.add(specifier);
    if (forbiddenPackages.test(specifier) || /^(?:node:|fs$|http$|https$|net$|tls$|child_process$)/.test(specifier)) report(node, `Import fora do escopo React Native/local: ${specifier}`);
    if (specifier === '@react-native-async-storage/async-storage' && file !== 'src/state/persistence.ts') report(node, 'AsyncStorage deve ser acessado pelo serviço central de persistência.');
    if (/\.(?:css|scss|sass|less|html?)$/.test(specifier)) report(node, `Import web proibido: ${specifier}`);
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) dependency(node, node.moduleSpecifier.text);
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(source);
      const first = node.arguments[0];
      if ((callee === 'require' || node.expression.kind === ts.SyntaxKind.ImportKeyword) && first && ts.isStringLiteralLike(first)) dependency(node, first.text);
      if (callee === 'fetch' || /^(?:globalThis|global|window)\.fetch$/.test(callee)) report(node, 'A lógica do aplicativo não deve depender de API HTTP própria/remota.');
      if ((callee === 'React.createElement' || callee === 'createElement') && first && ts.isStringLiteral(first) && /^[a-z]/.test(first.text)) report(node, `Elemento DOM não nativo: ${first.text}`);
    }
    if (ts.isNewExpression(node) && /^(?:WebSocket|XMLHttpRequest)$/.test(node.expression.getText(source))) report(node, 'Cliente de rede fora do escopo local do protótipo.');
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (/^[a-z]/.test(tag)) report(node, `JSX DOM não nativo: <${tag}>`);
      else nativeJsx += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
check(applicationFiles.length > 0 && nativeJsx > 0 && imported.has('react-native'), 'Não foi encontrada uma interface React Native real em TypeScript.');
check(typeof manifest.main === 'string' && fs.existsSync(path.join(root, manifest.main)), 'O entrypoint do aplicativo não existe.');
const entry = fs.readFileSync(path.join(root, manifest.main), 'utf8');
check(/registerRootComponent\s*\(/.test(entry) && /from\s+['"]expo['"]/.test(entry), 'O entrypoint precisa registrar o componente pelo Expo.');

// Only pure domain modules are compiled in memory; the loader cannot access I/O,
// npm modules, screens, AsyncStorage, or network APIs. No build files are emitted.
const domainRoot = path.join(root, 'src', 'domain');
const domainCache = new Map();
function loadDomain(filename) {
  const resolved = path.resolve(filename);
  if (!resolved.startsWith(`${domainRoot}${path.sep}`) || !resolved.endsWith('.ts')) throw new Error(`Módulo externo ao domínio puro: ${resolved}`);
  if (domainCache.has(resolved)) return domainCache.get(resolved).exports;
  const module = { exports: {} };
  domainCache.set(resolved, module);
  const code = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = vm.createContext({ module, exports: module.exports, require: specifier => {
    if (!specifier.startsWith('.')) throw new Error(`Dependência impura no domínio: ${specifier}`);
    return loadDomain(path.resolve(path.dirname(resolved), `${specifier}.ts`));
  } });
  new vm.Script(code, { filename: relative(resolved) }).runInContext(context, { timeout: 2000 });
  return module.exports;
}
try {
  const domain = loadDomain(path.join(domainRoot, 'model.ts'));
  const state = domain.createInitialState(new Date('2030-09-04T12:00:00.000Z'));
  check(state.garages.length >= 6 && state.garages.length <= 8, 'A demonstração precisa iniciar com seis a oito vagas.');
  const neighborhoods = new Set(['Boa Viagem', 'Recife Antigo', 'Ilha do Leite', 'Derby', 'Madalena', 'Casa Forte', 'Graças', 'Várzea']);
  check(state.garages.every(garage => neighborhoods.has(garage.neighborhood)) && new Set(state.garages.map(garage => garage.neighborhood)).size >= 6, 'Distribua as vagas demonstrativas pelos bairros previstos, sem catálogo concentrado em uma região.');
  for (const garage of state.garages) {
    domain.validateGarage(garage);
    check(garage.latitude > -8.6 && garage.latitude < -7.5 && garage.longitude > -35.4 && garage.longitude < -34.6, `Coordenadas demonstrativas fora da área Recife/RMR: ${garage.id}`);
    check(/fict[ií]ci[oa]/i.test(garage.address), `Endereço demonstrativo precisa estar identificado como fictício: ${garage.id}`);
  }
  check(state.garages.some(garage => garage.ownerId === 'local' && garage.active), 'A demonstração precisa incluir uma vaga ativa do proprietário local.');
  check(state.vehicles.length === 2 && new Set(state.vehicles.map(vehicle => vehicle.id)).size === 2, 'A demonstração precisa incluir dois veículos distintos.');
  check(new Set(state.bookings.map(booking => booking.status)).size === 4, 'Inclua reservas demonstrativas nos quatro estados do fluxo.');
  check(new Set(state.bookings.map(booking => booking.code)).size === state.bookings.length && state.bookings.every(booking => /^GPE-[A-Z0-9]{6}$/.test(booking.code)), 'Os códigos demonstrativos devem ser únicos e seguir GPE-XXXXXX.');
  check(state.profile.name !== state.ownerProfile.name && [state.profile, state.ownerProfile].every(profile => /demonstração/i.test(profile.name) && !profile.email && !profile.phone), 'Os dois perfis iniciais devem ser fictícios e não incluir contatos pessoais.');
  check(state.bookings.every(booking => state.garages.some(garage => garage.id === booking.garageId)) && state.bookings.some(booking => booking.driverId === 'local'), 'As reservas iniciais precisam referenciar vagas existentes e incluir o motorista local.');
} catch (error) { failures.push(`Não foi possível validar o catálogo real: ${error.message}`); }

if (failures.length) {
  console.error(`Verificação do projeto reprovada (${failures.length} problema(s)):\n${failures.map(message => `- ${message}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Projeto aprovado: ${checks} verificações estruturais, ${applicationFiles.length} arquivos de aplicativo e catálogo demonstrativo íntegro.`);
  console.log('Escopo: React Native/Expo/TypeScript, ausência de frontend web/backend/pagamentos, strict, lockfile, persistência central e seeds.');
  console.log('Este comando não substitui typecheck, lint, testes, Expo Doctor, bundle nem execução Android.');
}
