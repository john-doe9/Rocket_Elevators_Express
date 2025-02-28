const express = require('express')
const app = express()
app.use(express.json())
const port = 3003
app.listen(port, () => {
  console.log(` server listening on port ${port} `)
})

// 🏗️ GET - /hello (Returns "Hello World!")
app.get("/hello", (req, res) => {
    res.send("Hello World!");
});