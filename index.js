// const express = require("express");
// const app = express();
// app.get("/", (req, res) => { res.send("Express on Vercel"); });

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });

const express = require('express');
const cors = require('cors');

const app = express();

// Use CORS middleware
app.use(cors());


app.get('/', (req, res) =>
{
    res.json({ message: 'Hello, world!' });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
{
    console.log(`Server is running on port ${PORT}`);
});
