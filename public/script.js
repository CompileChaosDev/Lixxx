const $ = (id) => document.getElementById(id)

const urlInput = $('url-input')
const btnSearch = $('btn-search')
const result = $('result')

const HIDDEN_KEYS = new Set(['success', 'author', 'creator', 'query_url', 'source', 'found_in'])

const EMPTY_STATE = `
  <div class="box">
    <h2>Belum ada link</h2>
    <p>Paste link video TikTok di atas, lalu klik Cari.</p>
  </div>`

function escapeHTML(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
  return String(text).replace(/[&<>"]/g, (c) => map[c])
}

function isUrl(text) {
  return /^https?:\/\//i.test(String(text))
}

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString('id-ID') : '-'
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function showMessage(title, text, isError = false) {
  result.innerHTML = `
    <div class="box ${isError ? 'box-blue' : ''}">
      <h2>${title}</h2>
      <p>${text}</p>
    </div>`
}

function presetButtonLabel(item) {
  const label = String(item.label || '')
  if (/xml/i.test(label) || /drive\.google\.com/i.test(item.url)) return 'Download XML'
  if (/alightcreative|alightmotion/i.test(item.url)) return 'Buka di Alight Motion'
  return label ? 'Buka ' + label : 'Buka link'
}

function renderPreset(preset) {
  const items = Array.isArray(preset.items) ? preset.items.filter((item) => item && isUrl(item.url)) : []
  const meta = [
    preset.username ? '@' + escapeHTML(preset.username) : '',
    preset.likes != null ? formatNumber(preset.likes) + ' suka' : '',
    formatDate(preset.created_at)
  ].filter(Boolean).join(' · ')

  const buttons = items
    .map((item) => `<a class="btn" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(presetButtonLabel(item))}</a>`)
    .join('')

  return `
    <div class="box box-blue preset">
      <h2>${items.length ? 'Preset ketemu' : 'Komentar preset ketemu'}</h2>
      ${meta ? `<p class="meta">Dikirim oleh ${meta}</p>` : ''}
      ${items.length
        ? `<div class="preset-actions">${buttons}</div>`
        : '<p>Komentarnya ada, tapi nggak ada link yang bisa dibuka.</p>'}
    </div>`
}

function renderVideo(video, user, thumbnail) {
  const poster = isUrl(thumbnail) ? ` poster="${escapeHTML(thumbnail)}"` : ''
  let media = ''

  if (isUrl(video.play_url)) {
    media = `<video controls playsinline preload="none" referrerpolicy="no-referrer"${poster} src="${escapeHTML(video.play_url)}"></video>`
  } else if (isUrl(thumbnail)) {
    media = `<img src="${escapeHTML(thumbnail)}" referrerpolicy="no-referrer" alt="Thumbnail video">`
  }

  const owner = user && (user.display_name || user.username)
    ? `<p class="meta">${escapeHTML(user.display_name || '')}${user.username ? ' @' + escapeHTML(user.username) : ''}</p>`
    : ''

  const links = [
    isUrl(video.url) ? `<a class="btn" href="${escapeHTML(video.url)}" target="_blank" rel="noopener noreferrer">Buka di TikTok</a>` : '',
    isUrl(video.play_url) ? `<a class="btn" href="${escapeHTML(video.play_url)}" target="_blank" rel="noopener noreferrer">Download video</a>` : ''
  ].join('')

  return `
    <div class="box video-box">
      <h2>Video</h2>
      ${media}
      ${video.caption ? `<p class="caption">${escapeHTML(video.caption)}</p>` : ''}
      ${owner}
      <div class="stats">
        <div class="stat"><b>${formatNumber(video.views)}</b>Views</div>
        <div class="stat"><b>${formatNumber(video.likes)}</b>Suka</div>
        <div class="stat"><b>${formatNumber(video.comments)}</b>Komentar</div>
        <div class="stat"><b>${formatNumber(video.shares)}</b>Share</div>
      </div>
      ${links ? `<div class="preset-actions">${links}</div>` : ''}
    </div>`
}

function renderRows(obj, prefix = '') {
  let html = ''

  for (const [key, value] of Object.entries(obj)) {
    if (HIDDEN_KEYS.has(key)) continue
    const label = prefix + key

    if (value && typeof value === 'object') {
      html += renderRows(value, label + ' / ')
      continue
    }
    if (value === '' || value == null) continue

    const text = String(value)

    html += `
      <div class="box">
        <div class="result-row">
          <div>
            <span class="result-label">${escapeHTML(label)}</span>
            ${escapeHTML(text)}
          </div>
          ${isUrl(text)
            ? `<a class="btn btn-dark" href="${escapeHTML(text)}" target="_blank" rel="noopener noreferrer">Buka</a>`
            : ''}
        </div>
      </div>`
  }

  return html
}

function renderResult(payload) {
  const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload

  if (data && typeof data === 'object' && (data.preset || data.video)) {
    let html = ''
    if (data.preset) html += renderPreset(data.preset)
    if (data.video) html += renderVideo(data.video, data.user, data.thumbnail)
    return html
  }

  return renderRows(data && typeof data === 'object' ? data : { hasil: data })
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
        ? 'Server /api/find nggak ketemu. Jalankan lewat server.js (npm start) atau deploy ke Vercel, jangan dibuka sebagai file statis'
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
    const html = renderResult(await fetchData(url))

    if (html) {
      result.innerHTML = html
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
    
