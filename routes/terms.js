const express = require('express');
const router = express.Router();
const pgClient = require('../models/pg');

router.get('/', async (req, res) => {
  const result = await pgClient.query('SELECT * FROM academic_terms');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { term, definition, subject, grade_level, language, example, image_urls } = req.body;
  const result = await pgClient.query(
    `INSERT INTO academic_terms (term, definition, subject, grade_level, language, example, image_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [term, definition, subject, grade_level, language, example, image_urls]
  );
  res.json(result.rows[0]);
});

module.exports = router;
