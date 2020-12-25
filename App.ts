/**
 * Module Imports
 */
import fs from 'fs';
import path from 'path';
import createError from 'http-errors';

import express, {NextFunction} from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import nodeSassMiddleware from 'node-sass-middleware';
import passport from 'passport';

import logger from './Logger';
import morgan from 'morgan';

const app = express();

/** 
 * View Engine Setup (Handlebars)
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

/**
 * Logger Setup
 */
app.use(morgan('dev'));

/**
 * SASS Setup
 */
app.use(nodeSassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true,
}));

/**
 * Static File Serving
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Security
 */
app.use(helmet({
    hsts: {
        includeSubDomains: true,
        preload: true,
        maxAge: 6 * 30 * 24 * 60 * 60,
    },
    expectCt: {
        enforce: true,
        maxAge: 6 * 30 * 24 * 60 * 60,
        reportUri: 'https://codingbear.uriports.com'
    },
}));
app.use(hpp());
app.set('trust proxy', 1);

/**
 * Request Parsers
 */
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET));

/**
 * Session Settings
 */
app.use(session({
    name: process.env.SESSION_COOKIE_NAME,
    // Asserting `process.env.COOKIE_SECRET` is not null since
    // null-test was done at environment variable import time
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    secret: process.env.COOKIE_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    },
}));

/**
 * Passport Settings
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Dynamic Route Imports
 */
const routePath = path.join(__dirname, 'routes');
dynamicRouteImport(routePath);

/**
 * Error Handlers
 */
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err: Error & { [id:string] : undefined }, req: express.Request, res: express.Response, next: NextFunction) {
    const message = err.message;
    const stack = err.stack || '';
    const status = err.status || 500;

    res.locals.message = message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    res.status(status);
    res.render('error', {
        title: 'Error',
        message,
        stack: stack.replace(/\n/gm, '<br>').replace(/ /gm, '&nbsp;'),
        status
    });
});

/**
 * Function Definitions
 */
function dynamicRouteImport(searchPath: string, currentPath = '/') {
    const files = fs.readdirSync(searchPath);
    if (!files) {
        return;
    }
    files.forEach(file => {
        const fileName = file.split('.').slice(0, -1).join('.');
        const fileExt = path.extname(file);
        const filePath = path.join(searchPath, file);

        if (fs.statSync(filePath).isDirectory()) {
            currentPath = path.join(currentPath, file);
            dynamicRouteImport(filePath, currentPath);
            return;
        }
        if (['.js', '.ts'].includes(fileExt)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fileModule = require(filePath).default;
            if (fileModule && Object.getPrototypeOf(fileModule) == express.Router) {
                const route = fileModule as express.Router;

                let fileUri = currentPath;
                if (fileName !== 'index') {
                    fileUri = path.join(fileUri, fileName);
                }
                fileUri = fileUri.replace(/\\/g, '/');

                app.use(fileUri, route);
                logger.info(`Routed "${filePath}" to "${fileUri.replace(/\\/g, '/')}"`);
            }
        }
    });
}

export default app;