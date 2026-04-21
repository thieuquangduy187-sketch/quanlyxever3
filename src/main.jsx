import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Simple client-side routing
const path = window.location.pathname

async function mount() {
  let Component

  if (path === '/xe-detail') {
    const mod = await import('./pages/XeDetail')
    Component = mod.default
  } else {
    const mod = await import('./App')
    Component = mod.default
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Component />
    </React.StrictMode>
  )
}

mount()
