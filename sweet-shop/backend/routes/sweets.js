
const express = require('express');
const Sweet = require('../models/Sweet');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Decrement sweet quantity (public, for shop cart)
router.patch('/:id/decrement', async (req, res) => {
    try {
        const sweet = await Sweet.findById(req.params.id);
        if (!sweet) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        if (sweet.quantity <= 0) {
            return res.status(400).json({ message: 'Out of stock' });
        }
        sweet.quantity -= 1;
        await sweet.save();
        res.json({ success: true, quantity: sweet.quantity });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all sweets (public)
router.get('/', async (req, res) => {
    try {
        const sweets = await Sweet.find();
        res.json(sweets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get sweet by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const sweet = await Sweet.findById(req.params.id);
        if (!sweet) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        res.json(sweet);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new sweet (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const sweet = new Sweet(req.body);
        await sweet.save();
        res.status(201).json(sweet);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update sweet (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const sweet = await Sweet.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!sweet) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        res.json(sweet);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete sweet (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const sweet = await Sweet.findByIdAndDelete(req.params.id);
        if (!sweet) {
            return res.status(404).json({ message: 'Sweet not found' });
        }
        res.json({ message: 'Sweet deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;