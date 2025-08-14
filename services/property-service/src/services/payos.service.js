import axios from 'axios';
import crypto from 'crypto';

const PAYOS_CLIENT_ID = '8f05f54a-62da-4cef-951a-7e045c54ed91';
const PAYOS_API_KEY = '2e26f07c-06b6-426f-80fe-4a5f237cc0f8';
const PAYOS_CHECKSUM_KEY =
  '60c66692d99e1003427bc662566c75ea27899bae139bbb33fcc8f45b1154f31a';
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn';

function generateOrderCode() {
  return Math.floor(Date.now() / 1000);
}

function sortObjDataByKey(object) {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

function convertObjToQueryStr(object) {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key];

      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((val) => sortObjDataByKey(val)));
      }
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = '';
      }

      return `${key}=${value}`;
    })
    .join('&');
}

function generateSignature(payload, secretKey) {
  const sortedData = sortObjDataByKey(payload);
  const queryStr = convertObjToQueryStr(sortedData);
  return crypto.createHmac('sha256', secretKey).update(queryStr).digest('hex');
}

export async function createPayment(amount, description) {
  try {
    const orderCode = generateOrderCode();
    const payload = {
      orderCode,
      amount: Number(amount),
      description: description || '',
      returnUrl: 'https://app.propintel.id.vn/payment-success',
      cancelUrl: 'https://app.propintel.id.vn/payment-cancel',
    };
    const signature = generateSignature(payload, PAYOS_CHECKSUM_KEY);

    const fullPayload = { ...payload, signature };

    const res = await axios.post(
      `${PAYOS_BASE_URL}/v2/payment-requests`,
      fullPayload,
      {
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.data?.code !== '00') {
      throw new Error(res.data.desc || 'Tạo payment thất bại');
    }

    const pager = res.data.data;
    return {
      checkoutUrl: pager.checkoutUrl,
      qrCode: pager.qrCode,
      orderCode: pager.orderCode,
    };
  } catch (err) {
    console.error('Error creating payment:', err.response?.data || err.message);
    throw new Error('Failed to create payment');
  }
}

export async function isValidSignature(data, currentSignature) {
  const computedSignature = generateSignature(data, PAYOS_CHECKSUM_KEY);
  return computedSignature === currentSignature;
}
