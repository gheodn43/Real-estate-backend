import express from 'express';
import {
  searchByKeywordInArea,
  searchByAddress,
} from '../modules/googleMap.js';

const router = express.Router();
// 1. Từ vị trí hiện tại tìm các địa điểm gần nhất
router.get('/test/grid', async (req, res) => {
  const { lat, lng, keyword } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      data: null,
      message: 'lat và lng là bắt buộc',
      error: [],
    });
  }

  try {
    const result = await searchByKeywordInArea(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      keyword
    );
    res.json({ count: result.length, locations: result });
  } catch (e) {
    res.status(500).json({
      data: null,
      message: '',
      error: [e.message],
    });
  }
});

// 2. Tìm quanh một địa chỉ cụ thể
router.get('/test/address', async (req, res) => {
  const { address, keyword } = req.query;

  if (!address) {
    return res.status(400).json({
      data: null,
      message: 'address là bắt buộc',
      error: [],
    });
  }
  try {
    const result = await searchByAddress(address, keyword);
    res.json({ count: result.length, locations: result });
  } catch (e) {
    res.status(500).json({
      data: null,
      message: '',
      error: [e.message],
    });
  }
});

export default router;
