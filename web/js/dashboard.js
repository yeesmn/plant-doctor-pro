// web/js/dashboard.js
import { supabase } from './supabase.js'

async function testConnection() {
  const { data, error } = await supabase
    .from('devices')
    .select('*')

  if (error) {
    document.getElementById('output').innerText = 'Error: ' + error.message
    console.error(error)
    return
  }

  document.getElementById('output').innerText = 'Connected! Data: ' + JSON.stringify(data)
  console.log('Success:', data)
}

testConnection()