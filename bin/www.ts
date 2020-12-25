#!/usr/bin/env node

/**
 * Environment Parsing Module Dependencies
 */
import dotenv from 'dotenv';
import path from 'path';

/**
 * Environment Variable Check
 */
const configPath = path.join(__dirname, '../.env');
dotenv.config({path: configPath});
const required_environment_vars = [
    'COOKIE_NAME',
    'COOKIE_SECRET',
];
required_environment_vars.forEach(variable => {
    if (!process.env[variable]) {
        throw Error(`"${variable}" is not set in "${configPath}"`);
    }
});

/**
 * Module Dependencies
 */
import http from 'http';
import app from '../App';
import logger from '../Logger';


/**
 * Set port to Listen on
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create and Listen on Port, set Callbacks
 */
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
* Normalize a port into a number, string, or false.
*/

function normalizePort(val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr?.port;
    logger.info('Listening on ' + bind);
}
