require('dotenv').config();

const { app } = require('./app');

const port = process.env.PORT || 3000;

const startServer = async () => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer();
