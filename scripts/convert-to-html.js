import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const markdownDir = path.join(projectRoot, 'output', 'admin-portal', 'markdown');
const htmlDir = path.join(projectRoot, 'output', 'admin-portal', 'html');

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

// HTML template
const htmlTemplate = (title, content, navLinks) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Aiwyn Admin Portal Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
        }

        .container {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
        }

        .sidebar {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 2rem 1rem;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
        }

        .sidebar h2 {
            color: #3498db;
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #34495e;
        }

        .nav-links {
            list-style: none;
        }

        .nav-links li {
            margin-bottom: 0.5rem;
        }

        .nav-links a {
            color: #bdc3c7;
            text-decoration: none;
            display: block;
            padding: 0.5rem 0.75rem;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .nav-links a:hover {
            background-color: #34495e;
            color: #fff;
            transform: translateX(4px);
        }

        .nav-links a.active {
            background-color: #3498db;
            color: #fff;
        }

        .nav-group {
            margin-bottom: 1.5rem;
        }

        .nav-group-title {
            color: #95a5a6;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .main-content {
            background-color: #fff;
            padding: 3rem;
            max-width: 1200px;
        }

        .header {
            border-bottom: 3px solid #3498db;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }

        h1 {
            color: #2c3e50;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        h2 {
            color: #2c3e50;
            font-size: 1.8rem;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #ecf0f1;
        }

        h3 {
            color: #34495e;
            font-size: 1.4rem;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
        }

        h4 {
            color: #34495e;
            font-size: 1.1rem;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }

        p {
            margin-bottom: 1rem;
            color: #555;
        }

        a {
            color: #3498db;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        ul, ol {
            margin-left: 2rem;
            margin-bottom: 1rem;
        }

        li {
            margin-bottom: 0.5rem;
            color: #555;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
        }

        tr:hover {
            background-color: #f8f9fa;
        }

        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
            color: #e74c3c;
            font-size: 0.9em;
        }

        pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 1.5rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1.5rem 0;
        }

        pre code {
            background: none;
            color: #ecf0f1;
            padding: 0;
        }

        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: #666;
            font-style: italic;
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 2rem 0;
        }

        .alert {
            padding: 1rem 1.5rem;
            border-radius: 6px;
            margin: 1.5rem 0;
            border-left: 4px solid;
        }

        .alert-info {
            background-color: #d1ecf1;
            border-color: #3498db;
            color: #0c5460;
        }

        .alert-warning {
            background-color: #fff3cd;
            border-color: #f39c12;
            color: #856404;
        }

        .breadcrumb {
            margin-bottom: 2rem;
            color: #7f8c8d;
            font-size: 0.9rem;
        }

        .breadcrumb a {
            color: #3498db;
        }

        .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background-color: #3498db;
            color: white;
            padding: 1rem;
            border-radius: 50%;
            text-decoration: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .back-to-top:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }

        @media (max-width: 968px) {
            .container {
                grid-template-columns: 1fr;
            }

            .sidebar {
                position: static;
                height: auto;
            }

            .main-content {
                padding: 2rem 1.5rem;
            }
        }

        hr {
            border: none;
            border-top: 2px solid #ecf0f1;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <h2>Admin Portal Docs</h2>
            ${navLinks}
        </aside>
        <main class="main-content">
            <div class="breadcrumb">
                <a href="index.html">Home</a> / ${title}
            </div>
            ${content}
            <a href="#" class="back-to-top" title="Back to top">↑</a>
        </main>
    </div>
</body>
</html>`;

// Generate navigation HTML
const generateNavigation = (currentFile) => {
  const navStructure = [
    {
      title: 'Overview',
      links: [
        { file: 'index.html', name: 'Home' },
        { file: 'dashboard.html', name: 'Dashboard' }
      ]
    },
    {
      title: 'Firms',
      links: [
        { file: 'firms.html', name: 'Firms Management' },
        { file: 'firms-compare-configurations.html', name: 'Compare Configurations' },
        { file: 'firms-compare-feature-flags.html', name: 'Compare Feature Flags' }
      ]
    },
    {
      title: 'Features',
      links: [
        { file: 'reports.html', name: 'Reports' },
        { file: 'feature-flags.html', name: 'Feature Flags' },
        { file: 'feature-flags-tenant.html', name: 'Tenant Flags' }
      ]
    },
    {
      title: 'Settings',
      links: [
        { file: 'settings-users.html', name: 'Users' },
        { file: 'settings-permission-groups.html', name: 'Permission Groups' }
      ]
    }
  ];

  let html = '';
  navStructure.forEach(group => {
    html += `<div class="nav-group">`;
    html += `<div class="nav-group-title">${group.title}</div>`;
    html += `<ul class="nav-links">`;
    group.links.forEach(link => {
      const isActive = link.file === currentFile ? ' class="active"' : '';
      html += `<li><a href="${link.file}"${isActive}>${link.name}</a></li>`;
    });
    html += `</ul></div>`;
  });

  return html;
};

// Convert markdown to HTML
const convertMarkdownToHtml = () => {
  // Ensure output directory exists
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  // Get all markdown files
  const files = fs.readdirSync(markdownDir).filter(f => f.endsWith('.md'));

  console.log(`Converting ${files.length} markdown files to HTML...`);

  files.forEach(file => {
    const markdownPath = path.join(markdownDir, file);
    const htmlFileName = file.replace('.md', '.html');
    const htmlPath = path.join(htmlDir, htmlFileName);

    // Read markdown file
    const markdown = fs.readFileSync(markdownPath, 'utf-8');

    // Extract title from first H1
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

    // Convert markdown to HTML
    let content = marked.parse(markdown);

    // Fix image paths
    content = content.replace(/src="\.\.\/html\/screenshots\//g, 'src="screenshots/');

    // Generate navigation
    const navLinks = generateNavigation(htmlFileName);

    // Generate final HTML
    const html = htmlTemplate(title, content, navLinks);

    // Write HTML file
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✓ Created ${htmlFileName}`);
  });

  console.log('\nHTML conversion complete!');
};

// Run conversion
convertMarkdownToHtml();
