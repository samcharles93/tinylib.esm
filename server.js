import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'demo-router.html' : req.url);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    try {
        const content = await fs.readFile(filePath);
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(500);
            res.end(`Server error: ${err.code}`);
        }
    }
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  Dev Server Running                                   ║
╠════════════════════════════════════════════════════════╣
║  http://localhost:${PORT}/                              ║
║                                                        ║
║  Demos:                                                ║
║  • http://localhost:${PORT}/demo-router.html            ║
║  • http://localhost:${PORT}/demo-state.html             ║
╚════════════════════════════════════════════════════════╝
    
Press Ctrl+C to stop the server.
`);
});
