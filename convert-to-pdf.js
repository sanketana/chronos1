const fs = require('fs');
const path = require('path');

// Read the markdown file
const markdownContent = fs.readFileSync('CUSTOM_INTEGER_PROGRAMMING_ALGORITHM.md', 'utf8');

// Create a simple HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Integer Programming Algorithm Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h1 { font-size: 2.5em; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 2em; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; }
        h3 { font-size: 1.5em; color: #34495e; }
        h4 { font-size: 1.3em; color: #7f8c8d; }
        code {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #f8f9fa;
            font-style: italic;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .toc {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 5px 0;
        }
        .toc a {
            text-decoration: none;
            color: #3498db;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            h1, h2, h3 { page-break-after: avoid; }
            pre, table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${markdownContent.replace(/#{1,6}\s+(.+)/g, (match, title) => {
        const level = match.match(/^#+/)[0].length;
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `<h${level} id="${id}">${title}</h${level}>`;
    })}
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('CUSTOM_INTEGER_PROGRAMMING_ALGORITHM.html', htmlTemplate);

console.log('HTML file created: CUSTOM_INTEGER_PROGRAMMING_ALGORITHM.html');
console.log('You can now open this file in a browser and print to PDF.');
