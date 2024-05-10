const express = require('express')
require('dotenv').config()
const cors = require('cors')
const app = express()

const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  }))

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})