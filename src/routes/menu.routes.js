const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');

// Public Menu Routes
router.get('/categories', menuController.getCategories);
router.get('/', menuController.getItems);
router.get('/:id', menuController.getItem);

module.exports = router;
