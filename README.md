# 🔗 URL 管理与短链接使用说明

这是一个简单的短链接工具，你可以：

* 添加短链接
* 访问短链接自动跳转
* 在网页里管理和删除链接

---

## 🚀 一键部署（推荐）

点击部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dlushu/cloudflare-worker-URLManagement)

---

## 🛠 手动部署（使用 `_worker.js`）

如果一键部署失败，可以手动部署：

---

### 1️⃣ 创建 Worker

进入 Cloudflare：

1. 打开 **Workers & Pages**
2. 点击 **创建 Worker**
3. 删除默认代码
4. 把项目里的：

```id="t3yq5l"
_worker.js
```

👉 **完整复制进去**
5. 点击保存并部署

---

### 2️⃣ 创建 KV（必须）

1. 进入 **KV（键值存储）**
2. 创建命名空间：

```id="q8wqv9"
LINKS_KV
```

---

### 3️⃣ 绑定 KV

在 Worker 设置中：

* 添加绑定
* 变量名填写：

```id="x9q3sz"
LINKS_KV
```

* 选择刚创建的 KV

---

### 4️⃣ 设置密码

在 Worker → 设置 → 变量 中添加：

```id="y2d7fu"
ADMIN_PASSWORD = 你的密码
```

---

### 5️⃣ 访问使用

打开：

```id="4r3tdj"
https://你的域名/
```

---

## 📌 一、如何登录

进入首页后输入密码即可。

---

## 📌 二、如何添加短链接（最重要）

### 接口：

```id="h4vdbb"
POST /webhook
```

### 示例：

```bash id="4m9bgs"
curl -X POST https://你的域名/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"test","url":"https://example.com"}'
```

---

### 使用效果：

访问：

```id="j1r9d9"
https://你的域名/test
```

→ 跳转到：

```id="7zk3s1"
https://example.com
```

---

## 📌 三、如何使用短链接

直接访问：

```id="phx2r6"
https://你的域名/短链名称
```

---

### ✅ 支持路径拼接

例如：

```id="zk3vlj"
github → https://github.com
```

访问：

```id="g6s9u1"
https://你的域名/github/user/repo
```

→ 自动跳转：

```id="0d8q2q"
https://github.com/user/repo
```

---

### ✅ 支持参数

```id="f0e4vx"
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

```id="8lbw5v"
https://你的域名/
```

即可查看全部短链。

---

## 📌 六、KV 是干嘛的（简单理解）

KV 用来存数据：

```id="1o8t5w"
短链名 → 真实网址
```

例如：

```id="p9z1f4"
google → https://google.com
```

---

## 📌 七、常见问题

### ❓ 忘了复制 `_worker.js`

👉 Worker 没有功能（必须用这个文件）

---

### ❓ 没创建 KV

👉 功能全部不可用

---

### ❓ KV 名写错

必须是：

```id="7f0ycm"
LINKS_KV
```

---

### ❓ 打不开短链

```id="n6g1x3"
404 Not Found
```

说明不存在。

---

### ❓ 覆盖问题

同名会直接覆盖旧链接。

---

## 📌 八、适合用来干嘛

* 自用短链
* 常用网址管理
* 分享短链接
* 自动跳转
