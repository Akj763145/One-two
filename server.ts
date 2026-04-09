import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Google Drive API
  let auth: any;
  
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (serviceAccountJson) {
    try {
      const credentials = JSON.parse(serviceAccountJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      console.log('Authenticated using Service Account');
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
    }
  } else if (apiKey) {
    auth = apiKey;
    console.log('Authenticated using API Key');
  } else {
    console.warn('WARNING: No Google Drive authentication provided. Streaming will not work.');
  }

  const drive = google.drive({
    version: "v3",
    auth: auth,
  });

  // API Route for streaming
  app.get("/api/stream/:fileId", async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const range = req.headers.range;
      
      console.log(`Streaming request for fileId: ${fileId}, Range: ${range || 'none'}`);

      const response = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { 
          responseType: 'stream',
          headers: range ? { Range: range } : {}
        }
      );

      // Ensure we always allow range requests
      res.setHeader('Accept-Ranges', 'bytes');

      // Forward status code
      res.status(response.status || (range ? 206 : 200));

      // Safely forward headers
      const headersToForward = ['content-type', 'content-length', 'content-range'];
      headersToForward.forEach(header => {
        if (response.headers[header]) {
          res.setHeader(header, response.headers[header]);
        }
      });

      response.data.on('error', (err: any) => {
        console.error('Stream error during playback:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      response.data.pipe(res);
    } catch (error: any) {
      console.error('Streaming API Error:', error.message);
      
      if (!res.headersSent) {
        let status = 500;
        let message = 'Failed to stream video.';
        
        if (error.code === 403 || error.status === 403) {
          status = 403;
          message = 'Access denied. Ensure the file is shared as "Anyone with the link" and your API key is valid.';
        } else if (error.code === 404 || error.status === 404) {
          status = 404;
          message = 'File not found. Check the Google Drive file ID.';
        }
        
        res.status(status).json({ error: message });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
