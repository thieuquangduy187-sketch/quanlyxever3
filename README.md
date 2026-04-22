# HSG Fleet Dashboard — Netlify Version

React + Vite frontend, Apps Script backend.

## Cấu trúc

```
netlify-app/
├── src/
│   ├── api.js          ← Gọi Apps Script REST API
│   ├── App.jsx         ← Root component, routing, data loading
│   ├── index.css       ← Global styles
│   ├── main.jsx        ← React entry point
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── LoadingScreen.jsx
│   │   └── ErrorBar.jsx
│   ├── hooks/
│   │   └── useCharts.js  ← Shared utilities (colors, formatters)
│   └── pages/
│       ├── PageOverview.jsx
│       ├── PageXeTai.jsx
│       ├── PageOtoCon.jsx
│       └── PageCuaHang.jsx
├── public/index.html
├── .env.example
├── netlify.toml
├── vite.config.js
└── package.json
```

## Setup

### Bước 1: Cấu hình Apps Script

Mở `Code.gs` trong Apps Script và đảm bảo đã thêm CORS support (doGet trả JSON).

**Thêm vào `appsscript.json`:**
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

Deploy Apps Script: **Deploy → New deployment → Web App → Anyone → Deploy**

Lấy URL dạng: `https://script.google.com/macros/s/XXXX/exec`

### Bước 2: Cấu hình React app

```bash
cd netlify-app
cp .env.example .env
# Sửa .env, điền URL Apps Script vào VITE_GAS_URL
npm install
npm run dev   # chạy local http://localhost:5173
```

### Bước 3: Deploy lên Netlify

**Cách A — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Cách B — GitHub + Netlify UI:**
1. Push code lên GitHub
2. Vào netlify.com → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_GAS_URL = https://script.google.com/macros/s/XXXX/exec`
6. Deploy

### Bước 4: Gắn domain GoDaddy

1. Trên Netlify: **Site settings → Domain management → Add custom domain**
   - Nhập domain mua từ GoDaddy (vd: `danhsachxe.hoasen.vn`)
   - Netlify sẽ cung cấp nameservers

2. Trên GoDaddy: **DNS → Nameservers → Custom**
   - Thay bằng nameservers của Netlify
   - Chờ 24–48h để propagate

3. Netlify tự động cấp SSL certificate miễn phí (Let's Encrypt)

## Lưu ý CORS

Apps Script Web App mặc định **không có CORS headers** khi gọi từ domain khác.

**Fix:** Trong Code.gs, `ContentService.createTextOutput()` không hỗ trợ custom headers. 

Có 2 giải pháp:
1. **Dùng Netlify Functions** làm proxy (xem `netlify/functions/proxy.js` bên dưới)
2. **Dùng `no-cors` mode** — nhưng sẽ không đọc được response

### Giải pháp recommended: Netlify Function proxy

Tạo file `netlify/functions/api.js`:
```javascript
exports.handler = async (event) => {
  const GAS_URL = process.env.GAS_URL  // server-side env, không expose
  const params = new URLSearchParams(event.queryStringParameters || {})
  
  const res = await fetch(`${GAS_URL}?${params}`)
  const data = await res.text()
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: data,
  }
}
```

Sau đó trong `src/api.js` đổi endpoint sang `/api/...` thay vì gọi thẳng GAS URL.
