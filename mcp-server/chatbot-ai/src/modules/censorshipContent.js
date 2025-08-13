import axios from 'axios';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY =
  'xai-vbgZWSiiVfp1ALBig76ky4OLhb0zuOBVx4bqDisXus4wAuifwEzOD9M21YCHfzvPKf9yYT6RE2p9qegb';
import {
  censorshipPrompt,
  censorshipStatus,
} from '../promts/kiemDuyetBinhLuanPrompt.js';

export async function kiemDuyetBinhLuanByAI(message) {
  try {
    const result = await kiemDuyetBinhLuan(message);
    const status = result?.status?.trim().toLowerCase();
    return status === censorshipStatus.passed;
  } catch (error) {
    console.error('Lỗi kiểm duyệt:', error);
    return false;
  }
}

async function kiemDuyetBinhLuan(message) {
  const messages = [
    { role: 'system', content: censorshipPrompt },
    { role: 'user', content: message },
  ];

  const payload = {
    model: 'grok-3',
    messages,
    max_tokens: 100,
    temperature: 0,
    stream: false,
  };

  const response = await axios.post(XAI_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  try {
    return JSON.parse(response.data.choices[0].message.content);
  } catch {
    throw new Error('Phản hồi AI không phải JSON hợp lệ');
  }
}
