const express  = require('express');
const router   = express.Router();
const protect  = require('../middleware/auth');
const {
  getAll, create, update, remove, toggleFavorite
} = require('../controllers/bookmarkController');

router.use(protect);  // all bookmark routes require login

router.get('/',              getAll);
router.post('/',             create);
router.put('/:id',           update);
router.delete('/:id',        remove);
router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
