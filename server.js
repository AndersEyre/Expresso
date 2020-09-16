const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');

const apiRouter = require('./api/api');

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(errorHandler());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/api', apiRouter);



app.listen(PORT, () => {console.log(`Server is listening on PORT: ${PORT}. Happy Coding YA JAG`)});

module.exports = app;

