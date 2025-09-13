export function showLoading() {
  if (typeof window === 'undefined') return null
  
  const overlay = document.createElement('div')
  overlay.id = 'tx-loading-overlay'
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.7); z-index: 10000;
    display: flex; align-items: center; justify-content: center;
  `
  
  const loader = document.createElement('div')
  loader.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="width: 50px; height: 50px; border: 3px solid #333; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <div style="font-size: 20px; font-weight: bold;">Processing Transaction...</div>
      <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">Please wait for blockchain confirmation</div>
    </div>
  `
  
  // Add spinner animation
  if (!document.getElementById('spinner-style')) {
    const style = document.createElement('style')
    style.id = 'spinner-style'
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
  
  overlay.appendChild(loader)
  document.body.appendChild(overlay)
  
  return {
    remove: () => overlay.remove()
  }
}

export function confettiBurst() {
  if (typeof window === 'undefined') return
  
  // Play success sound
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEELIHO8tiJOQgZaLvt559NEAxQp+PwtmMcBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgBz2a3PLEcSEEE=')
    audio.volume = 0.3
    audio.play().catch(() => {}) // Ignore if autoplay blocked
  } catch (e) {
    // Ignore audio errors
  }
  
  const duration = 900
  const end = Date.now() + duration
  const colors = ['#34d399', '#10b981', '#a7f3d0', '#6ee7b7']

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)

  type P = { x:number, y:number, r:number, c:string, vx:number, vy:number, a:number }
  const particles: P[] = []
  const spawn = (count:number) => {
    for (let i=0;i<count;i++) {
      particles.push({
        x: canvas.width/2,
        y: canvas.height/2,
        r: Math.random()*6+4,
        c: colors[(Math.random()*colors.length)|0],
        vx: (Math.random()-0.5)*8,
        vy: (Math.random()-1.2)*8,
        a: 1,
      })
    }
  }

  const tick = () => {
    if (!ctx) return
    ctx.clearRect(0,0,canvas.width,canvas.height)
    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.a -= 0.015
      ctx.globalAlpha = Math.max(p.a, 0)
      ctx.fillStyle = p.c
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill()
    })
    const now = Date.now()
    if (now < end) requestAnimationFrame(tick); else cleanup()
  }

  const cleanup = () => {
    window.removeEventListener('resize', resize)
    canvas.remove()
  }

  // Show success message
  const msg = document.createElement('div')
  msg.textContent = '🎉 Purchase Successful!'
  msg.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #10b981; color: white; padding: 16px 32px; border-radius: 12px;
    font-size: 24px; font-weight: bold; z-index: 10000; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: successPop 2s ease-out forwards;
  `
  
  // Add keyframe animation
  if (!document.getElementById('success-style')) {
    const style = document.createElement('style')
    style.id = 'success-style'
    style.textContent = `
      @keyframes successPop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        40% { transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 2000)

  spawn(120)
  tick()
}


