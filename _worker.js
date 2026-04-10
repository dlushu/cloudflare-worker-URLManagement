export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =====================
    // 🔐 登录
    // =====================
    if (url.pathname === '/login' && request.method === 'POST') {
      const { password } = await request.json();

      if (password === env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Set-Cookie': `auth=${password}; Path=/; Max-Age=604800`,
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response('Unauthorized', { status: 401 });
    }

    // =====================
    // 🔗 Webhook（添加/更新）
    // =====================
    if (url.pathname === '/webhook' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }

      const { name, url: target } = body;

      if (!name || !target) {
        return new Response('Missing name or url', { status: 400 });
      }

      const exist = await env.LINKS_KV.get(name);
      await env.LINKS_KV.put(name, target);

      return new Response(JSON.stringify({
        success: true,
        isUpdate: !!exist
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // =====================
    // 🗑 删除
    // =====================
    if (url.pathname === '/delete' && request.method === 'POST') {
      const cookie = request.headers.get('Cookie') || '';
      if (!cookie.includes(`auth=${env.ADMIN_PASSWORD}`)) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { name } = await request.json();
      await env.LINKS_KV.delete(name);

      return new Response(JSON.stringify({ success: true }));
    }

    // =====================
    // 🔐 登录判断
    // =====================
    const cookie = request.headers.get('Cookie') || '';
    const isAuth = cookie.includes(`auth=${env.ADMIN_PASSWORD}`);

    // =====================
    // 📄 首页（列表）
    // =====================
    if (url.pathname === '/' || url.pathname === '') {
      if (!isAuth) {
        return new Response(loginPage(), {
          headers: { 'Content-Type': 'text/html;charset=utf-8' }
        });
      }

      const list = await env.LINKS_KV.list();
      const links = [];

      for (const key of list.keys) {
        const val = await env.LINKS_KV.get(key.name);
        links.push([key.name, val]);
      }

      return new Response(generatePage(links, request.url), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // =====================
    // 📦 PWA（只保留 manifest，移除 Service Worker）
    // =====================
    if (url.pathname === '/manifest.json') {
      return new Response(JSON.stringify({
        name: "URL管理",
        short_name: "URL管理",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#4CAF50"
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 不再提供 sw.js，避免缓存
    if (url.pathname === '/sw.js') {
      return new Response('', { status: 404 });
    }

    // =====================
    // 🔗 短链跳转（核心）
    // =====================
    if (request.method === 'GET') {
      let fullPath = url.pathname.slice(1);

      let decoded;
      try {
        decoded = decodeURIComponent(fullPath);
      } catch {
        decoded = fullPath;
      }

      let target = await env.LINKS_KV.get(decoded);
      let suffix = '';

      if (!target) {
        const parts = decoded.split('/');

        for (let i = parts.length - 1; i > 0; i--) {
          const prefix = parts.slice(0, i).join('/');
          const match = await env.LINKS_KV.get(prefix);

          if (match) {
            target = match;
            suffix = '/' + parts.slice(i).join('/');
            break;
          }
        }
      }

      if (!target) {
        return new Response('Not Found', { status: 404 });
      }

      let final = target;

      if (suffix) {
        if (final.endsWith('/') && suffix.startsWith('/')) {
          final = final.slice(0, -1) + suffix;
        } else {
          final += suffix;
        }
      }

      if (url.search) {
        final += (final.includes('?') ? '&' : '?') + url.search.slice(1);
      }

      return Response.redirect(final, 307);
    }

    return new Response('Method not allowed', { status: 405 });
  }
};

function loginPage() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>URL管理 · 登录</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .login-container {
        background: rgba(255, 255, 255, 0.98);
        border-radius: 24px;
        padding: 40px 32px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        animation: fadeInUp 0.5s ease-out;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .login-icon {
        font-size: 56px;
        margin-bottom: 12px;
      }
      
      .login-title {
        font-size: 28px;
        font-weight: 600;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
      }
      
      .login-subtitle {
        color: #666;
        font-size: 14px;
        margin-top: 8px;
      }
      
      .input-group {
        margin-bottom: 24px;
      }
      
      .input-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 8px;
      }
      
      .password-input {
        width: 100%;
        padding: 14px 16px;
        font-size: 16px;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        transition: all 0.3s ease;
        font-family: monospace;
        background: #fafafa;
      }
      
      .password-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
      
      .login-btn {
        width: 100%;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .login-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
      }
      
      .login-btn:active {
        transform: translateY(0);
      }
      
      .footer-note {
        text-align: center;
        margin-top: 24px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <div class="login-header">
        <div class="login-icon">🔗</div>
        <div class="login-title">URL管理</div>
        <div class="login-subtitle">请输入密码以继续</div>
      </div>
      
      <div class="input-group">
        <label class="input-label">密码</label>
        <input class="password-input" id="pwd" type="password" placeholder="请输入管理密码" autofocus />
      </div>
      
      <button class="login-btn" onclick="login()">登录</button>
      <div class="footer-note">🔒</div>
    </div>

    <script>
      async function login() {
        const pwd = document.getElementById('pwd').value;
        if (!pwd) {
          alert('请输入密码');
          return;
        }
        
        try {
          const r = await fetch('/login', {
            method: 'POST',
            body: JSON.stringify({ password: pwd }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (r.ok) {
            location.reload();
          } else {
            alert('密码错误，请重试');
          }
        } catch (e) {
          alert('登录失败，请稍后重试');
        }
      }
      
      // 支持回车登录
      document.getElementById('pwd').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
      });
    </script>
  </body>
  </html>`;
}

function generatePage(links, requestUrl) {
  const origin = new URL(requestUrl).origin;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#4CAF50">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>URL管理面板</title>
  <link rel="manifest" href="/manifest.json">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 20px;
      /* 完整的安全区域适配 */
      padding-top: max(20px, env(safe-area-inset-top));
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      padding-left: max(20px, env(safe-area-inset-left));
      padding-right: max(20px, env(safe-area-inset-right));
    }
    
    /* 针对 iOS 刘海屏和动态岛的专门优化 */
    @supports (padding-top: env(safe-area-inset-top)) {
      body {
        padding-top: calc(env(safe-area-inset-top) + 10px);
      }
    }
    
    /* 针对全面屏手机的额外处理 */
    @media (display: standalone) {
      body {
        padding-top: calc(env(safe-area-inset-top) + 10px);
      }
      
      .header {
        margin-top: 0;
      }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* 头部区域 - 确保不被状态栏遮挡 */
    .header {
      background: white;
      border-radius: 24px;
      padding: 24px 32px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      /* 确保内容区域安全 */
      position: relative;
      z-index: 1;
    }
    
    .title-section h1 {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    
    .title-section p {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }
    
    .stats {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 12px 24px;
      border-radius: 40px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .refresh-btn {
      background: white;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-size: 20px;
      padding: 6px 12px;
      border-radius: 20px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    
    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: scale(1.1);
    }
    
    /* 卡片网格 */
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 20px;
    }
    
    .card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      animation: fadeInUp 0.4s ease-out backwards;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* 卡片内容 */
    .card-name {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .name-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      font-family: monospace;
      word-break: break-all;
    }
    
    .wildcard-badge {
      background: #ff9800;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .url-box {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 12px;
      margin: 12px 0;
      border: 1px solid #e9ecef;
      font-size: 12px;
      color: #495057;
      word-break: break-all;
      font-family: monospace;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    
    .url-text {
      flex: 1;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    /* 按钮组 - 强制并排一行 */
    .button-group {
      display: flex;
      flex-wrap: nowrap;
      gap: 8px;
      margin-top: 16px;
      overflow-x: auto;
    }
    
    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      filter: brightness(0.95);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-secondary {
      background: #ff9800;
      color: white;
    }
    
    .btn-outline {
      background: white;
      border: 1px solid #dee2e6;
    }
    
    .btn-danger {
      background: #f44336;
      color: white;
    }
    
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 24px;
      color: #999;
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    
    /* 响应式：小屏幕时允许横向滚动 */
    @media (max-width: 640px) {
      body {
        padding: 12px;
        /* 小屏幕也要保持安全区域 */
        padding-top: max(12px, env(safe-area-inset-top));
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
      
      .links-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        text-align: center;
      }
      
      .button-group {
        overflow-x: auto;
        padding-bottom: 4px;
      }
      
      .btn {
        padding: 6px 10px;
        font-size: 11px;
      }
    }
    
    /* 滚动条美化 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  </style>
  <script>
    function copy(text, type) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('✅ 已复制 ' + type);
      }).catch(() => {
        alert('复制失败，请手动复制\\n' + text);
      });
    }
    
    function showToast(msg) {
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:40px;font-size:14px;z-index:9999;opacity:0;transition:opacity0.3s;pointer-events:none';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }
    
    async function del(name, cardElement) {
      if (!confirm('⚠️ 确定要删除 "' + name + '" 吗？')) return;
      try {
        const r = await fetch('/delete', {
          method: 'POST',
          body: JSON.stringify({ name }),
          headers: { 'Content-Type': 'application/json' }
        });
        if (r.ok) {
          // 直接从 DOM 移除卡片
          cardElement.remove();
          showToast('🗑 已删除');
          
          // 更新统计数字
          const statsSpan = document.querySelector('.stats');
          const currentCount = parseInt(statsSpan.textContent.match(/\\d+/)?.[0] || 0);
          statsSpan.innerHTML = statsSpan.innerHTML.replace(/\\d+/, currentCount - 1);
          
          // 如果没有链接了，重新加载显示空状态
          if (document.querySelectorAll('.card').length === 0) {
            location.reload();
          }
        } else {
          alert('删除失败');
        }
      } catch (e) {
        alert('请求失败');
      }
    }
    
    function refreshPage() {
      location.reload();
    }
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-section">
        <h1>🔗 URL管理</h1>
      </div>
      <div class="stats">
        共计 ${links.length} 个短链接
        <button class="refresh-btn" onclick="refreshPage()" title="刷新页面">刷新</button>
      </div>
    </div>
    
    <div class="links-grid">
      ${links.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔗</div>
          <h3>暂无短链接</h3>
          <p>使用 POST /webhook 接口添加你的第一个短链接</p>
        </div>
      ` : links.map(([name, url]) => {
        const short = origin + '/' + name;
        return `
          <div class="card" style="animation-delay: ${Math.random() * 0.2}s">
            <div class="card-name">
              <span class="name-badge">${name}</span>
            </div>
            <div class="url-box">
              <span class="url-text" title="${url.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
              })}">${url.length > 60 ? url.substring(0, 60) + '…' : url}</span>
            </div>
            <div class="button-group">
              <button class="btn btn-primary" onclick="copy('${short.replace(/'/g, "\\'")}', '短链接')">短链</button>
              <button class="btn btn-secondary" onclick="copy('${url.replace(/'/g, "\\'")}', '原URL')">原链</button>
              <a href="${short}" target="_blank" class="btn btn-outline" style="text-decoration:none">打开</a>
              <button class="btn btn-danger" onclick="del('${name.replace(/'/g, "\\'")}', this.closest('.card'))">删除</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
  <div id="toast" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:40px;font-size:14px;z-index:9999;opacity:0;transition:opacity0.3s;pointer-events:none"></div>
  <script>
    // 不再注册 Service Worker，避免缓存问题
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // 检测是否在独立应用中运行，动态调整样式
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      document.body.style.paddingTop = 'calc(env(safe-area-inset-top) + 10px)';
    }
  </script>
</body>
</html>`;
}
