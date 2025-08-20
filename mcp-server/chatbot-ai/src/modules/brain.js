import axios from 'axios';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY =
  'xai-vbgZWSiiVfp1ALBig76ky4OLhb0zuOBVx4bqDisXus4wAuifwEzOD9M21YCHfzvPKf9yYT6RE2p9qegb';
import { classifyPrompt, classifyAction } from '../promts/classifyPrompt.js';
import { filterProperty } from '../helpers/propClient.js';
import { searchByKeywordInArea } from '../modules/googleMap.js';
import {
  consultPrompt,
  consultAction,
  googleMapFilterType,
} from '../promts/consultPrompt.js';

export async function getGrokResponse(message, context, { lat, lng }) {
  try {
    const response = {
      reply: '',
      updatedContext: context,
    };

    // Phân loại câu hỏi
    const classifyResult = await classifyRequest(message);

    if (classifyResult.action === classifyAction.consult) {
      const consultResult = await consultRequest(classifyResult.query, context);

      if (consultResult.action === consultAction.reply) {
        response.reply = consultResult.response;
        response.updatedContext = consultResult.updatedContext;
      } else if (consultResult.action === consultAction.queryInDB) {
        if (
          consultResult.googleMapFilterType === googleMapFilterType.findAroundMe
        ) {
          const coordinate = await searchByKeywordInArea(
            { lat: parseFloat(lat), lng: parseFloat(lng) },
            consultResult.location
          );
          const location = coordinate.locations[0];
          const propertiesTruyVanFromDB = await filterProperty(
            location.lat,
            location.lng
          );
          const propertiesText = formatDanhBDSDeXuat(propertiesTruyVanFromDB);
          const consultResultWithProperties = await consultRequest(
            'Tìm bất động sản phù hợp với DS được đề xuất',
            context + propertiesText
          );
          consultResultWithProperties.reply = consultResultWithProperties;
        } else if (
          consultResult.googleMapFilterType ===
          googleMapFilterType.findAroundLocation
        ) {
          response.reply =
            'filter google map và DB theo vị trí cụ thể được chỉ định';
        }
        response.updatedContext = consultResult.updatedContext;
      }
    } else {
      response.reply = classifyResult.response;
    }

    return response;
  } catch (error) {
    throw new Error('Failed to get response from xAI API');
  }
}

async function classifyRequest(message) {
  const messages = [
    { role: 'system', content: classifyPrompt },
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

  return JSON.parse(response.data.choices[0].message.content);
}

async function consultRequest(query, context) {
  const messages = [
    {
      role: 'system',
      content: 'Ngữ cảnh hiện tại: ' + context + consultPrompt,
    },
    { role: 'user', content: query },
  ];
  const payload = {
    model: 'grok-3',
    messages,
    max_tokens: 1000,
    temperature: 0,
    stream: false,
  };
  const response = await axios.post(XAI_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return JSON.parse(response.data.choices[0].message.content);
}

async function formatDanhBDSDeXuat(danhSachBDS) {
  return 'Danh sách bất động sản được đề xuất: ' + danhSachBDS;
}
