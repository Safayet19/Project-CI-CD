/* Small, dependency-free syntax coloring for the existing Learning Hub code blocks.
   Only presentation changes: copy buttons continue reading the original code text. */
(() => {
  'use strict';

  const javaKeywords = new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
    'extends', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import',
    'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private',
    'protected', 'public', 'record', 'return', 'sealed', 'short', 'static', 'super',
    'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'var',
    'void', 'volatile', 'while', 'true', 'false', 'null'
  ]);
  const javaTypes = new Set([
    'String', 'System', 'Math', 'Object', 'Integer', 'Double', 'Boolean', 'List',
    'Map', 'Set', 'ArrayList', 'HashMap', 'LinkedHashMap', 'LinkedHashSet',
    'Comparator', 'Scanner', 'Path', 'Files', 'StandardCharsets', 'IOException',
    'IllegalArgumentException', 'Exception', 'ExecutorService', 'Executors',
    'Future', 'ResponseEntity', 'Controller', 'GetMapping', 'Test', 'Assertions',
    'Student', 'Employee', 'Payable', 'Result', 'Book', 'Calculator'
  ]);
  const shellKeywords = new Set([
    'sudo', 'docker', 'git', 'java', 'javac', 'mvn', 'terraform', 'aws', 'nginx',
    'echo', 'curl', 'cd', 'ls', 'cat', 'grep', 'chmod', 'cp', 'mv', 'rm', 'mkdir',
    'touch', 'export', 'set', 'if', 'then', 'else', 'fi', 'for', 'do', 'done',
    'newgrp', 'groups', 'systemctl', 'snap', 'gh', 'hashcat', 'php', 'python',
    'Invoke-RestMethod', 'FROM', 'RUN', 'COPY', 'WORKDIR', 'ENTRYPOINT', 'EXPOSE'
  ]);
  const sqlKeywords = new Set([
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'JOIN',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
    'SHOW', 'DATABASES', 'LIMIT', 'UNION', 'DISTINCT', 'AS', 'COUNT', 'NULL'
  ]);
  const configKeywords = new Set([
    'resource', 'terraform', 'required_providers', 'provider', 'backend',
    'variable', 'output', 'locals', 'import', 'module', 'data', 'lifecycle',
    'true', 'false', 'null', 'server', 'location', 'listen', 'server_name',
    'proxy_pass', 'proxy_set_header', 'on', 'push', 'branches', 'jobs',
    'runs-on', 'steps', 'uses', 'with', 'name', 'env', 'script', 'tags',
    'if', 'for', 'FROM', 'WORKDIR', 'COPY', 'RUN', 'EXPOSE', 'ENTRYPOINT',
    'CMD', 'ARG', 'ENV', 'LABEL', 'AS', 'ADD', 'VOLUME'
  ]);
  const scriptKeywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
    'public', 'private', 'echo', 'print', 'include', 'require', 'async',
    'await', 'true', 'false', 'null', 'document', 'window', 'alert'
  ]);
  const languageNames = {
    java: 'JAVA', shell: 'TERMINAL', docker: 'DOCKERFILE', yaml: 'YAML',
    hcl: 'TERRAFORM', json: 'JSON', nginx: 'NGINX', sql: 'SQL',
    php: 'PHP', javascript: 'JAVASCRIPT', html: 'HTML',
    config: 'CONFIG', output: 'OUTPUT'
  };

  function detectLanguage(label, source) {
    const name = (label || '').toLowerCase();
    const code = source.trimStart();
    if (/console output|terminal output|^output\b|^result\b/.test(name)) return 'output';
    if (/\.java\b|java snippet|java controller|spring mvc controller|junit/.test(name) ||
        /^(?:import java\.|public class |class [A-Z]\w*\s*\{|@GetMapping\b)/.test(code)) return 'java';
    if (/dockerfile/.test(name) || /^(FROM|WORKDIR|COPY|RUN|EXPOSE|ENTRYPOINT)\b/m.test(code)) return 'docker';
    if (/\.gitignore|\.dockerignore|\.gitattributes/.test(name)) return 'config';
    if (/json|iam policy/.test(name) || (/^\{/.test(code) && /"(?:Statement|Version|Action)"\s*:/.test(code))) return 'json';
    if (/github actions|original workflow|\.ya?ml\b/.test(name) || /^(?:name:|jobs:|on:)/m.test(code)) return 'yaml';
    if (/nginx.*configuration|reverse proxy configuration/.test(name) || /^server\s*\{/.test(code)) return 'nginx';
    if (/provider configuration|\.tf\b|backend\.tf|variable\.tf|state-bootstrap hcl|import block/.test(name) ||
        /^(?:terraform|provider|resource|variable|output|import|locals)\s*(?:\{|"|\w+\s*\{)/.test(code)) return 'hcl';
    if (/sql|database|table|columns/.test(name) && /\b(?:SELECT|SHOW|INSERT|UNION|FROM|WHERE)\b/i.test(code)) return 'sql';
    if (/^<\?php/.test(code) || /php\s*shell|php\b/.test(name)) return 'php';
    if (/^</.test(code) && /<\w|<\//.test(code)) return 'html';
    if (/xss|payload|javascript/.test(name) && /(?:alert\(|document\.|fetch\(|<script)/.test(code)) return 'javascript';
    return 'shell';
  }

  function scanSource(source, language) {
    const pieces = [];
    if (language === 'java' || language === 'javascript' || language === 'php') {
      pieces.push('\\/\\*[\\s\\S]*?\\*\\/', '\\/\\/[^\\r\\n]*');
    }
    if (language === 'shell' || language === 'hcl' || language === 'docker' ||
        language === 'nginx' || language === 'yaml' || language === 'config' || language === 'php') {
      pieces.push('#[^\\r\\n]*');
    }
    if (language === 'sql') pieces.push('--[^\\r\\n]*');
    if (language === 'html' || language === 'php') {
      pieces.push('<!--[\\s\\S]*?-->', '<\\/?[A-Za-z][^>]*>');
    }
    pieces.push('"(?:\\\\.|[^"\\\\])*"', "'(?:\\\\.|[^'\\\\])*'");
    if (language === 'javascript') pieces.push('`(?:\\\\.|[^`\\\\])*`');
    pieces.push('\\$\\{\\{[^}]*\\}\\}', '\\$\\{[^}]*\\}', '@[A-Za-z_][\\w]*',
      '\\$[A-Za-z_][\\w]*', '\\b[A-Za-z_][A-Za-z_0-9-]*\\b', '\\b\\d+(?:\\.\\d+)?\\b');
    const pattern = new RegExp(pieces.map(piece => '(?:' + piece + ')').join('|'), 'g');
    let last = 0;
    let match;

    while ((match = pattern.exec(source)) !== null) {
      if (match.index > last) pieces.push({ text: source.slice(last, match.index), kind: '' });
      const value = match[0];
      const rest = source.slice(match.index + value.length);
      const before = source.slice(Math.max(0, match.index - 30), match.index);
      let kind = '';

      if ((value.startsWith('/*') || value.startsWith('//')) ||
          (value.startsWith('#') && ['shell', 'hcl', 'docker', 'nginx', 'yaml', 'config', 'php'].includes(language)) ||
          (value.startsWith('--') && language === 'sql') || value.startsWith('<!--')) {
        kind = 'comment';
      } else if (value.startsWith('<') && (language === 'html' || language === 'php')) {
        kind = 'tag';
      } else if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
        kind = (language === 'json' && /^\s*:/.test(rest)) ? 'property' : 'string';
      } else if (/^\d/.test(value)) {
        kind = 'number';
      } else if (value.startsWith('@')) {
        kind = 'annotation';
      } else if (value.startsWith('$')) {
        kind = 'variable';
      } else if (language === 'java' && javaKeywords.has(value)) {
        kind = 'keyword';
      } else if (language === 'java' &&
                 (javaTypes.has(value) || /\b(?:class|record|interface|new|extends|implements)\s+$/.test(before))) {
        kind = 'type';
      } else if (language === 'java' && /^\s*\(/.test(rest)) {
        kind = 'function';
      } else if (language === 'sql' && sqlKeywords.has(value.toUpperCase())) {
        kind = 'keyword';
      } else if (language === 'shell' && shellKeywords.has(value)) {
        kind = 'keyword';
      } else if (['hcl', 'nginx', 'yaml', 'docker', 'config'].includes(language) && configKeywords.has(value)) {
        kind = 'keyword';
      } else if (['hcl', 'yaml', 'json'].includes(language) && /^\s*[:=]/.test(rest)) {
        kind = 'property';
      } else if (['php', 'javascript'].includes(language) && scriptKeywords.has(value)) {
        kind = 'keyword';
      } else if (['javascript', 'php'].includes(language) && /^\s*\(/.test(rest)) {
        kind = 'function';
      }
      pieces.push({ text: value, kind });
      last = pattern.lastIndex;
    }
    if (last < source.length) pieces.push({ text: source.slice(last), kind: '' });
    return pieces.filter(item => typeof item === 'object');
  }

  document.querySelectorAll('.lp-code-panel pre code').forEach(codeElement => {
    const panel = codeElement.closest('.lp-code-panel');
    const header = panel?.querySelector('.lp-code-top');
    const source = codeElement.textContent;
    if (!header || !source) return;

    const label = header.querySelector('span')?.textContent || '';
    const language = detectLanguage(label, source);
    const fragments = document.createDocumentFragment();
    scanSource(source, language).forEach(({ text, kind }) => {
      if (!kind) {
        fragments.append(document.createTextNode(text));
      } else {
        const token = document.createElement('span');
        token.className = 'tok-' + kind;
        token.textContent = text;
        fragments.append(token);
      }
    });
    codeElement.replaceChildren(fragments);
    codeElement.dataset.syntax = language;

    const badge = document.createElement('span');
    badge.className = 'lp-code-language';
    badge.textContent = languageNames[language] || 'CODE';
    const copy = header.querySelector('.lp-copy');
    if (copy) header.insertBefore(badge, copy);
    else header.append(badge);
  });
})();
