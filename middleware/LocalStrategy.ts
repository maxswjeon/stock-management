import passport from 'passport';
import { Strategy } from 'passport-local';
import Prisma, { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import logger from '../Logger';
import express from 'express';

const prisma = new PrismaClient();

passport.serializeUser((user: Prisma.users, done) => {
    done(null, user.user_id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.users.findUnique({where: {user_id: id}});

        if (!user) {
            logger.error('Error on Passport Local Strategy (Deserialization - None)');
            return done(new Error('Failed to Find User'), false);
        }

        return done(null, user);
    }
    catch(error) {
        logger.error('Error on Passport Local Strategy (Deserialization - Query)');
        logger.error(error.message);
        return done(error, null);
    }
});

passport.use('local', new Strategy(
    {
        usernameField: 'id',
        passwordField: 'pw',
    },
    async (id, pw, done) => {
        try {
            const user = await prisma.users.findUnique({where: {user_id: id}});

            if (!user) {
                return done(null, false, {message: 'No user found with given ID'});
            }

            const result = await argon2.verify(user.user_pw, pw);
            if (result) {
                return done(null, user);
            }

            return done(null, false, {message: 'Incorrect Password'});
        }
        catch(error) {
            logger.error('Error on Passport Local Strategy (Query)');
            logger.error(error.message);
            return done(error);
        }
    }
));

const requireLogin: express.Handler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    res.redirect('/login');
};

const requireGuest: express.Handler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.isAuthenticated()) {
        next();
        return;
    }
    res.redirect('/');
};

export {requireLogin, requireGuest};