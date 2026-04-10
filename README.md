# 🔗 URL 管理与短链接

一个基于 Cloudflare Workers 的简单短链接工具，支持：

* 登录管理
* 添加 / 更新短链接（Webhook）
* 删除短链接
* 短链跳转（支持路径拼接）
* 管理页面可视化操作

---

## 🚀 一键部署（推荐）

点击部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dlushu/cloudflare-worker-URLManagement)

---

## 🛠 手动部署（使用 `_worker.js`）

如果一键部署失败，可以手动部署：

---

### 1️⃣ 创建 Worker

1. 打开 Cloudflare → **Workers & Pages**
2. 点击 **创建 Worker**
3. 删除默认代码
4. 把项目中的：

```id="7f5s3d"
_worker.js
```

👉 **完整复制进去**
5. 点击保存并部署

---

### 2️⃣ 创建 KV（必须）

1. 进入 **KV（键值存储）**
2. 创建命名空间：

```id="p6u3wr"
LINKS_KV
```

---

### 3️⃣ 绑定 KV

在 Worker 设置中：

* 添加绑定
* 变量名填写：

```id="k2m9cs"
LINKS_KV
```

* 选择刚创建的 KV

---

### 4️⃣ 设置管理员密码

在 Worker → 设置 → 变量 中添加：

```id="z4v2hx"
ADMIN_PASSWORD = 你的密码
```

---

### 5️⃣ 访问使用

```id="6u9b1x"
https://你的域名/
```

---

## 📌 一、如何登录

打开首页后输入密码即可进入管理页面。

---

## 📌 二、如何添加短链接（最重要）

### 接口：

```id="9h8n4a"
POST /webhook
```

### 示例：

```bash id="g2v7ka"
curl -X POST https://你的域名/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"test","url":"https://example.com"}'
```

---

### 参数说明：

| 参数   | 说明   |
| ---- | ---- |
| name | 短链名称 |
| url  | 跳转地址 |

---

### 使用效果：

访问：

```id="q8d4zs"
https://你的域名/test
```

→ 跳转到：

```id="c3p7hf"
https://example.com
```

---

## 📌 三、如何使用短链接

直接访问：

```id="x6f2ke"
https://你的域名/短链名称
```

---

### ✅ 支持路径拼接

例如：

```id="r5b8ut"
github → https://github.com
```

访问：

```id="m4n7vy"
https://你的域名/github/user/repo
```

→ 自动跳转：

```id="a9k3pe"
https://github.com/user/repo
```

---

### ✅ 支持参数

```id="t7c2md"
https://你的域名/google?q=1
```

会自动带参数跳转。

---

## 📌 四、如何删除短链接

1. 打开管理页面
2. 点击 **删除按钮**

（需要登录）

---

## 📌 五、如何查看所有链接

打开：

```id="y2j6qx"
https://你的域名/
```

即可查看全部短链。

---

## 📌 六、KV 是什么（必须了解）

KV 用来存你的短链接数据：

```id="n3v8zd"
短链名 → 真实网址
```

例如：

```id="p9c4rt"
google → https://google.com
```

👉 所有短链都存这里

---

## 📌 七、使用场景

### 🔧 场景 1：Lucky + STUN 内网穿透（强烈推荐）

在使用 Lucky 的 STUN 内网穿透时：

```id="h2q7vx"
http://公网IP:端口
```

问题：

* IP 会变
* 端口会变
* 很难记

---

### ✅ 解决方案

设置短链：

```id="w5k9ds"
home → http://当前IP:端口
```

更新：

```bash id="z8m3yf"
curl -X POST https://你的域名/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"home","url":"http://最新IP:端口"}'
```

---

### 🚀 使用效果

你只需要访问：

```id="d7r2nc"
https://你的域名/home
```

自动跳转到最新地址。

---

👉 优点：

* 不需要记 IP
* 不怕端口变化
* 适合 HTTP 服务

---

### 🌐 场景 2：临时地址

```id="q3x9bd"
test → http://临时地址
```

随时更新，不影响访问入口。

---

### 📱 场景 3：常用网址快捷入口

```id="m1v8ka"
ai → https://chat.openai.com
nas → http://192.168.1.2:5000
```

---

### 🔁 场景 4：路径透传

```id="u9c2qp"
github → https://github.com
```

访问：

```id="b7d4rs"
/github/user/repo
```

---

## 📌 八、常见问题

### ❓ 没创建 KV

👉 功能无法使用（必须创建）

---

### ❓ KV 名写错

必须是：

```id="j6n4xe"
LINKS_KV
```

---

### ❓ 忘了使用 `_worker.js`

👉 Worker 不会正常工作

---

### ❓ 打不开短链

```id="k3p8zw"
404 Not Found
```

说明不存在。

---

### ❓ 覆盖问题

同名会直接覆盖旧链接。

---

## 📌 九、适合用来干嘛

* 自用短链
* 内网穿透入口
* 常用网址管理
* 动态地址跳转
* API 自动更新跳转
