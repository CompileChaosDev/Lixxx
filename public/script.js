const $ = (id) => document.getElementById(id)

const urlInput  = $('url-input')
const btnSearch = $('btn-search')
const result    = $('result')

const EMPTY_STATE = `
  <div class="box">
    <h2>Belum ada link</h2>
    <p>Paste link video TikTok di atas, lalu klik Cari.</p>
  </div>`


function escapeHTML(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(text).replace(/[&<>"]/g, (c) => map[c])
}

function showMessage(title, text, blue = false) {
  result.innerHTML = `
    <div class="box ${blue ? 'box-blue' : ''}">
      <h2>${title}</h2>
      <p>${text}</p>
    </div>`
}

function buildMarquee(id, words, separator) {
  const unit = words.map((word) => `<span>${word}</span>${separator}`).join('')
  $(id).innerHTML = unit.repeat(12)
}

buildMarquee('marquee-top', ['Link TikTok', 'Gratis', 'AM Preset'], '<span><em>😋</em></span>')
buildMarquee('marquee-mid', ['Import', 'Paste', 'Cari'], '<span><i>🍀</i></span>')


function renderRows(obj, prefix = '') {
  let html = ''

  for (const [key, value] of Object.entries(obj)) {
    const label = prefix + key

    if (value && typeof value === 'object') {
      html += renderRows(value, label + ' / ')
      continue
    }
    if (value === '' || value == null) continue

    const text  = String(value)
    const isUrl = /^https?:\/\//i.test(text)

    html += `
      <div class="box">
        <div class="result-row">
          <div><b>${escapeHTML(label)}</b>${escapeHTML(text)}</div>
          ${isUrl
            ? `<a class="btn btn-dark" href="${escapeHTML(text)}" target="_blank" rel="noopener noreferrer">Buka</a>`
            : ''}
        </div>
      </div>`
  }

  return html
}


async function fetchData(url) {
  const response = await fetch('/api/find?url=' + encodeURIComponent(url))
  const text = await response.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    const notFound = response.status === 404 || /not found/i.test(text)
    throw new Error(
      notFound
        ? 'Server /api/find nggak ketemu. Halaman ini harus dijalankan lewat server.js (npm start) atau di-deploy ke hosting Node/Vercel, bukan dibuka sebagai file statis'
        : 'Respons server bukan JSON: ' + text.slice(0, 120)
    )
  }

  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
  }
  return data
}

async function search() {
  const url = urlInput.value.trim()

  if (!/tiktok\.com/i.test(url)) {
    showMessage('Link nggak valid', 'Link harus dari tiktok.com.', true)
    return
  }

  btnSearch.disabled = true
  btnSearch.textContent = 'Mencari...'
  showMessage('Lagi nyari...', 'Tunggu sebentar, bisa sampai 30 detik.')

  try {
    const data = await fetchData(url)
    const rows = renderRows(data && typeof data === 'object' ? data : { hasil: data })

    if (rows) {
      result.innerHTML = rows
    } else {
      showMessage('Nggak ketemu', 'Nggak ada link preset di komentar video ini.')
    }
  } catch (err) {
    showMessage('Gagal', escapeHTML(err.message) + '. Cek link-nya lalu coba lagi.', true)
  } finally {
    btnSearch.disabled = false
    btnSearch.textContent = 'Cari'
  }
}

async function pasteFromClipboard() {
  try {
    urlInput.value = await navigator.clipboard.readText()
  } catch {
    urlInput.focus() 
  }
}

function reset() {
  urlInput.value = ''
  result.innerHTML = EMPTY_STATE
}

btnSearch.addEventListener('click', search)
$('btn-paste').addEventListener('click', pasteFromClipboard)
$('btn-reset').addEventListener('click', reset)
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search()
})
