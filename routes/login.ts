import {Router} from 'express';
import passport from 'passport';
import {requireGuest} from '../middleware/LocalStrategy';

const router = Router();
router.get('/', requireGuest, (req, res) => {
    res.render('login', {title: 'Express'});
});

router.post('/', (req, res, next) => {
    passport.authenticate('local',
        {
            successRedirect: '/',
            failureRedirect: '/login'
        })(req, res, next);
});

export default router;