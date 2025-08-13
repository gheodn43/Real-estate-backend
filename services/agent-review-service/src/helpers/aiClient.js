import axios from 'axios';

const kiemDuyetBinhLuan = async (comment, token) => {
  try {
    const res = await axios.post(
      'http://agent-chat-service:3000/agent-chat/censorship/comment',
      { comment }, // body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data.data.passed;
  } catch (err) {
    console.error(
      'Lỗi khi kiểm duyệt bình luận:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

export { kiemDuyetBinhLuan };
