const express = require('express');
const cors = require('cors');

const profileExtractRoutes = require('./routes/profileExtract');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/profile-identifier', profileExtractRoutes);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain valid JSON.'
    });
  }

  return next(err);
});

module.exports = { app };
