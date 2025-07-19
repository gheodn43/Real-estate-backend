import express from 'express';
import {
  searchByGrid,
  searchByAddress,
  searchByTextQuery,
} from '../modules/googleMap.js';

const router = express.Router();

router.get('/test/grid', async (req, res) => {
  const { lat, lng, keyword = 'ATM' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat và lng là bắt buộc' });
  }

  try {
    const result = await searchByGrid(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      keyword
    );
    res.json({ count: result.length, locations: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Tìm quanh một địa chỉ cụ thể
router.get('/test/address', async (req, res) => {
  const { address, keyword = 'ATM' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'address là bắt buộc' });
  }

  try {
    const result = await searchByAddress(address, keyword);
    res.json({ count: result.length, locations: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Tìm theo mô tả tự nhiên
router.get('/test/text', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query là bắt buộc' });
  }

  try {
    const result = await searchByTextQuery(query);
    res.json({ count: result.length, locations: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
