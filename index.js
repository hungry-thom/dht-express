const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { Pool, Client } = require('pg')
const config = require('./myHelp/info')

//const pool = new Pool()

let app = express()

console.log(config)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

app.post('/:id', postRecord)
app.get('/:id', getRecord)

let PREV_UPDATE = null;
let PREV_TEMPERATURE = null;
let PREV_HUMIDITY = null;

async function postRecord (req, res, next) {
  console.log('post', req.body)
  const data = req.body
  PREV_UPDATE = new Date()
  if (data.temperature !== PREV_TEMPERATURE || data.humidity !== PREV_HUMIDITY) {
    // start
    PREV_TEMPERATURE = Number(data.temperature)
    PREV_HUMIDITY = Number(data.humidity)
    const pool = new Pool(config)
    const text = `INSERT INTO ${req.params.id}(date, temperature, humidity, motor, fan) VALUES($1, $2, $3, $4, $5) RETURNING *`
    const values = [new Date(), Number(data.temperature), Number(data.humidity), Number(data.motor), Number(data.fan)]
    //console.log('test', text, values)
    pool.query(text, values)
      .then(resp => { 
        console.log('resp', resp.rows[0])
        pool.end()
      })
      .catch(e => console.log(err.stack))
    // end
  }
}

async function getRecord (req, res, next) {
  const client = new Client(config)
  console.log('getRecord', req.params.id)
  await client.connect()
  const re = await client.query(`SELECT * FROM ${req.params.id} ORDER BY date DESC LIMIT 1`)
  console.log('query')
  re.rows[0]['date'] = new Date(re.rows[0]['date'] - 21600000).toISOString()
  re.rows[0]['connection'] = false
  if (PREV_UPDATE) {
  let deltaTime = new Date().getMinutes() - PREV_UPDATE.getMinutes()
  console.log('delta', deltaTime)
    if (deltaTime < 6) {
      re.rows[0]['connection'] = true
    }
  } 
  res.json(re.rows)
  await client.end()
}

app.listen(3278, function() {
  console.log("Listening on port: 3278")
})
