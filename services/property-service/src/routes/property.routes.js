const express = require('express');
const router = express.Router();
const prisma = require('../db');

// GET all properties
router.get('/', async (req, res) => {
  const properties = await prisma.property.findMany();
  res.json(properties);
});

// GET by ID
router.get('/:id', async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!property) return res.status(404).json({ error: 'Not found' });
  res.json(property);
});

// CREATE
router.post('/', async (req, res) => {
  const data = req.body;
  const created = await prisma.property.create({ data });
  res.status(201).json(created);
});

// UPDATE
router.put('/:id', async (req, res) => {
  const data = req.body;
  const updated = await prisma.property.update({
    where: { id: parseInt(req.params.id) },
    data,
  });
  res.json(updated);
});

// DELETE
router.delete('/:id', async (req, res) => {
  await prisma.property.delete({ where: { id: parseInt(req.params.id) } });
  res.status(204).send();
});

module.exports = router;
