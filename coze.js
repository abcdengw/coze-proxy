// Vercel Serverless Function - Coze API 代理
const COZE_API_URL = 'https://c4d66yxh4d.coze.site/stream_run';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NTYyZmQ2LTczYTYtNGQyYi1hMzQyLTk4YmYwNDExMjQ2OCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjVWalZaSGg3TTBHTVBSYXJ6Z1Zjb0UxdWFVS09xUWNvIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczMTQwOTI1LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE1MTU2NzkxMjMxMzgxNTY3Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE1NTgyMjg1ODE0ODI0OTg3In0.R8kelDlflrpfii0X1FuJALJoJwRDTIFCZ1pC8oKemrwmDoOP1okYMBhR2GMW5kNs6dEGWLBmHf0qz2pc_mL5WdJ-zywKK_LsVmQa1X3D87CWXdswHMQ7QroLpwy1fKNLm3RN5CNuyBz_D1kGXS-dBIP6NugTbqrVFgoj4uMgEHUroheoqR-1o39NHN-r_in9V0F7GeXeeEkWf_UR35FGd8zSrwNKobSIfOyBWL4dk-DFF_FTepdSw7WhYaBh9w54bBjWBgM8gHrJF5R_-f9TxzNvLxXSHHrm2iaISXyZw7rn0vYAN4eaFal5iouJkleIeXBJkWJd67GyLNPGVGB39g';

export default async function handler(req, res) {
  // CORS 处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-run-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, run_id } = req.body;
    const sessionId = run_id || `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 调用 Coze API
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'x-run-id': sessionId,
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: { text: text || '' }
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Coze API error: ${response.status} - ${errorText}` });
    }

    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.content?.answer) {
              fullText += data.content.answer;
            }
          } catch (e) {}
        }
      }
    }

    return res.status(200).json({
      full_text: fullText,
      run_id: sessionId
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}