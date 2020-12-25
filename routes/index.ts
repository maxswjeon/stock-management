import {Router} from 'express';
import {requireLogin} from '../middleware/LocalStrategy';

const router = Router();
router.get('/', requireLogin, (req, res) => {
    res.render('index', {title: 'Express'});
});

export default router;