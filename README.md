# Coze API 代理

通过 Vercel Serverless Functions 代理 Coze API，解决跨域问题。

## 部署后 API 地址

https://coze-proxy.vercel.app/api/coze

## 使用方法

```bash
curl -X POST https://coze-proxy.vercel.app/api/coze \
  -H "Content-Type: application/json" \
  -d '{"text":"你好"}'