const axios = require('axios')

module.exports = async (req, res) => {
  const url = String(req.query.url || '').trim()
  if (!/^https?:\/\/([\w-]+\.)*tiktok\.com\//i.test(url)) {
    return res.status(400).json({ error: 'Link TikTok tidak valid' })
  }
  try {
    const { data } = await axios.get('https://bintangapi.my.id/api/amfind/', {
      params: { url },
      headers: {
        Accept: '*/*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        Origin: 'https://starlabs.biz.id',
        Referer: 'https://starlabs.biz.id/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"'
      },
      timeout: 30000
    })
    res.status(200).json(data)
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.response?.data || e.message })
  }
}
