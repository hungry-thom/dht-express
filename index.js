const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { Pool, Client } = require('pg')

//const pool = new Pool()

let app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

app.post('/:id', postRecord)
app.get('/:id', getRecord)

async function postRecord (req, res, next) {
  console.log('post', req.body)
  const pool = new Pool()
  const text = `INSERT INTO ${req.params.id}(date, temperature, humidity, motor, fan) VALUES($1, $2, $3, $4, $5) RETURNING *`
  const data = req.body
  const values = [new Date(), Number(data.temperature), Number(data.humidity), Number(data.motor), Number(data.fan)]
  console.log('test', text, values)
  pool.query(text, values)
    .then(resp => { 
      console.log('resp', resp, resp.rows[0])
      pool.end()
    })
    .catch(e => console.log(err.stack))
}

async function getRecord (req, res, next) {
  const client = new Client()
  console.log('getRecord', req.params.id)
  await client.connect()
  const re = await client.query(`SELECT * FROM ${req.params.id} ORDER BY date DESC LIMIT 1`)
  console.log('query')
  res.json(re.rows)
  await client.end()
}

app.listen(3278, function() {
  console.log("Listening on port: 3278")
})
