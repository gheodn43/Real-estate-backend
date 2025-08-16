import axios from 'axios';
import crypto from 'crypto';
import commissionService from '../services/commission.service.js';
import AgentCommissionFeeStatus from '../enums/AgentCommissionFeeStatus.js';

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

const createPayment = async (property_id, commisionData) => {
  const { agent_id, commission_id, last_price, commission, contract_url } =
    commisionData;
  try {
    const orderCode = generateOrderCode();
    const commission_value = (last_price * commission) / 100;

    const payload = {
      orderCode,
      amount: Number(commission_value),
      description: 'Thanh toán hoa hồng.',
      returnUrl: `https://hub.propintel.id.vn/estates-deposit/${property_id}`,
      cancelUrl: `https://hub.propintel.id.vn/estates-deposit/${property_id}`,
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
    await commissionService.createAgentCommissionFee({
      commission_id: Number(commission_id),
      agent_id: Number(agent_id),
      commission_value: commission_value,
      order: String(orderCode),
      status: AgentCommissionFeeStatus.PROCESSING,
    });
    await commissionService.updateCommission({
      id: commission_id,
      commission: commission,
      latest_price: last_price,
      contract_url: contract_url,
    });
    return {
      checkoutUrl: pager.checkoutUrl,
      qrCode: pager.qrCode,
      orderCode: pager.orderCode,
    };
  } catch (err) {
    console.error('Error creating payment:', err.response?.data || err.message);
    throw new Error('Failed to create payment');
  }
};

const isValidSignature = async (data, currentSignature) => {
  const computedSignature = generateSignature(data, PAYOS_CHECKSUM_KEY);
  return computedSignature === currentSignature;
};

const handleCancelPayment = async (orderCode) => {
  console.log('payment failed with orderCOde', orderCode);
};

const handleSuccessPayment = async (orderCode) => {
  console.log('payment succed with orderCOde', orderCode);
};

export default {
  createPayment,
  isValidSignature,
  handleCancelPayment,
  handleSuccessPayment,
};
