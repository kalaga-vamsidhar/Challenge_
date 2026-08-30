const express = require('express');
const { extractProfileIdentifier } = require('../controller/profileExtract');

const router = express.Router();

router.post('/', extractProfileIdentifier);

module.exports = router;
