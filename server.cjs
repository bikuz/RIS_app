// server.cjs - CommonJS server entry point for IIS
const express = require('express');
const path = require('path');

// Set NODE_ENV if not already set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

const app = express();

// Serve static files first
app.use(express.static(path.join(__dirname, 'build', 'client')));
app.use(express.static(path.join(__dirname, 'static')));

// Import the SvelteKit handler dynamically
let handler;

async function initializeHandler() {
    try {
        const { handler: svelteHandler } = await import('./build/handler.js');
        handler = svelteHandler;
        
        // Handle all requests with SvelteKit
        app.use((req, res, next) => {
            if (handler) {
                return handler(req, res, next);
            } else {
                res.status(500).send('Handler not initialized');
            }
        });
        
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';
        
        app.listen(port, host, () => {
            console.log(`Server running on http://${host}:${port}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
        
         
    } catch (error) {
        console.error('Failed to initialize SvelteKit handler:', error);
        process.exit(1);
    }
}

// Initialize the handler
initializeHandler();

module.exports = app;