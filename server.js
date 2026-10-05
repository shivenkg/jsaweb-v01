import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Serve static assets
app.use(express.static(__dirname));

// Pretty URLs fallback for HTML pages
const pages = ['about', 'contact', 'industries', 'process', 'services', 'product', 'products'];
pages.forEach((p) => {
  app.get(`/${p}`, (req, res) => {
    const filename = p === 'products' ? 'product.html' : `${p}.html`;
    res.sendFile(path.join(__dirname, filename));
  });
});

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`JS AlphaSoft website running on http://${HOST}:${PORT}`);
});
