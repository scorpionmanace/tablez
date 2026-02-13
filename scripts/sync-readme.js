import fs from 'fs';
import path from 'path';

const TYPES_FILE = path.join(process.cwd(), 'src/lib/types.ts');
const ENGINE_FILE = path.join(process.cwd(), 'src/lib/core/engine.ts');
const README_FILE = path.join(process.cwd(), 'README.md');

function parseInterface(content, interfaceName) {
  const regex = new RegExp(
    `export interface ${interfaceName}(?:<.*?>)?(?: extends (.*?))? {([\\s\\S]*?)^}`,
    'm',
  );
  const match = content.match(regex);
  if (!match) return null;

  const parentInterfaces = match[1] ? match[1].split(',').map((i) => i.trim()) : [];
  const body = match[2];

  const props = [];
  const propRegex = /^\s*(?:\/\*\*([\s\S]*?)\*\/|\/\/(.*))?\s*(\w+)(\?)?:\s*([^;\{]+);/gm;

  let propMatch;
  while ((propMatch = propRegex.exec(body)) !== null) {
    const jsDoc = propMatch[1] ? propMatch[1].trim() : '';
    const inlineComment = propMatch[2] ? propMatch[2].trim() : '';
    const name = propMatch[3];
    const optional = !!propMatch[4];
    const type = propMatch[5].trim();

    let description = (jsDoc || inlineComment).replace(/^\s*\*+/gm, '').trim();

    // Try to extract default from description
    let defaultValue = '-';
    if (description.toLowerCase().includes('default:')) {
      const parts = description.split(/default:/i);
      defaultValue = parts[1].trim().split(/\n/)[0].trim();
      description = parts[0].trim();
    }

    props.push({ name, optional, type, description, defaultValue });
  }

  return { name: interfaceName, props, parents: parentInterfaces };
}

function getInterfaceData() {
  const typesContent = fs.readFileSync(TYPES_FILE, 'utf-8');
  const engineContent = fs.readFileSync(ENGINE_FILE, 'utf-8');
  const combined = typesContent + '\n' + engineContent;

  const interfaces = [
    'TableProps',
    'TableSettings',
    'RowSettings',
    'Column',
    'TreeSettings',
    'ToolbarSettings',
    'TableTokens',
    'BaseTableSettings',
    'BaseRowSettings',
  ].reduce((acc, name) => {
    const data = parseInterface(combined, name);
    if (data) acc[name] = data;
    return acc;
  }, {});

  // Merge parents
  const merge = (name) => {
    const base = interfaces[name];
    if (!base) return [];
    let allProps = [...base.props];
    base.parents.forEach((parent) => {
      allProps = [...allProps, ...merge(parent)];
    });
    // Remove duplicates by name
    return allProps.filter((p, index, self) => index === self.findIndex((t) => t.name === p.name));
  };

  return {
    TableProps: merge('TableProps'),
    TableSettings: merge('TableSettings'),
    RowSettings: merge('RowSettings'),
    Column: merge('Column'),
    TreeSettings: merge('TreeSettings'),
    ToolbarSettings: merge('ToolbarSettings'),
    TableTokens: merge('TableTokens'),
  };
}

function generateMarkdownTable(props, columns) {
  let table = `| ${columns.join(' | ')} |\n`;
  table += `| ${columns.map(() => '---').join(' | ')} |\n`;

  props.forEach((p) => {
    const row = columns.map((col) => {
      if (col === 'Prop' || col === 'Property') return `\`${p.name}${p.optional ? '?' : ''}\``;
      if (col === 'Type') return `\`${p.type.replace(/\|/g, '\\|')}\``;
      if (col === 'Default') return `\`${p.defaultValue}\``;
      if (col === 'Description') return p.description || '-';
      return '-';
    });
    table += `| ${row.join(' | ')} |\n`;
  });
  return table;
}

function updateReadme() {
  const data = getInterfaceData();
  let readme = fs.readFileSync(README_FILE, 'utf-8');

  const sections = [
    {
      name: 'TableProps',
      title: '### `Table` Props (React)',
      cols: ['Prop', 'Type', 'Description'],
    },
    {
      name: 'TableSettings',
      title: '### `TableSettings`',
      cols: ['Property', 'Type', 'Default', 'Description'],
    },
    {
      name: 'RowSettings',
      title: '### `RowSettings`',
      cols: ['Property', 'Type', 'Default', 'Description'],
    },
    { name: 'Column', title: '### `Column` Properties', cols: ['Property', 'Type', 'Description'] },
    {
      name: 'TreeSettings',
      title: '### `TreeSettings`',
      cols: ['Property', 'Type', 'Default', 'Description'],
    },
    {
      name: 'ToolbarSettings',
      title: '### `ToolbarSettings`',
      cols: ['Property', 'Type', 'Default', 'Description'],
    },
  ];

  sections.forEach((s) => {
    const table = generateMarkdownTable(data[s.name], s.cols);
    // More flexible regex to match the table including its header
    const titleEscaped = s.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tableRegex = new RegExp(
      `${titleEscaped}\\n\\n\\|.*?\\|\\n\\|.*?\\|\\n(\\|.*?\\|\\n)*`,
      'g',
    );

    if (readme.match(tableRegex)) {
      readme = readme.replace(tableRegex, `${s.title}\n\n${table}`);
    } else {
      console.warn(`Could not find section ${s.title} in README`);
    }
  });

  fs.writeFileSync(README_FILE, readme);
  console.log('README updated successfully!');
}

updateReadme();
