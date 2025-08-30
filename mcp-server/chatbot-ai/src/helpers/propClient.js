import axios from 'axios';

const filterProperty = async (lat, lng) => {
  const query = {
    page: 1,
    limit: 100,
    latitude: lat,
    longitude: lng,
    radius: 10,
  };
  const res = await axios.get('http://property-service:4002/prop/filter-prop', {
    params: query,
  });

  const properties = res?.data?.data?.properties;
  const textOutput = formatPropertiesResult(properties);

  return textOutput;
};

const initCustomerNeeds = async (email, name, number_phone, lat, lng) => {
  try {
    const res = await axios.post(
      'http://property-service:4002/prop/init-customer-needs',
      {
        email,
        name,
        number_phone,
        lat,
        lng,
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error calling initCustomerNeeds:', error.message);
    throw new Error(
      error.response?.data?.message || 'Failed to init customer needs'
    );
  }
};

function formatPropertiesResult(properties) {
  if (!properties || !Array.isArray(properties))
    return 'Không có bất động sản nào được tìm thấy. \n';

  let result = `${properties.length} \n`;

  properties.forEach((p, idx) => {
    const mediaUrls = p.media?.map((m) => m.url).join(', ') || 'Không có ảnh';
    const address = [
      p.locations?.addr_city,
      p.locations?.addr_district,
      p.locations?.addr_street,
      p.locations?.addr_details,
    ]
      .filter(Boolean)
      .join(', ');

    const detailsText = (p.details || [])
      .map((d) => `${d.category_detail.field_name}: ${d.value}`)
      .join('; ');

    const amenityNames =
      (p.amenities || [])
        .map((a) => a.amenity?.name)
        .filter(Boolean)
        .join(', ') || 'chưa có tiện ích';
    result += `${idx + 1}. id: ${p.id}; title: ${p.title}; description: ${p.description}; slug: ${p.slug}; assets: ${p.assets.name} - id=${p.assets.id}; needs: ${p.needs.name} - id=${p.needs.id}; giá: ${p.before_price_tag} ${p.price} ${p.after_price_tag}; requestpost_status: ${p.requestpost_status}; media: [${mediaUrls}]; address: ${address}; latitude: ${p.locations?.latitude}; longitude: ${p.locations?.longitude}; details: [${detailsText}]; amenities: [${amenityNames}]\n`;
  });

  return result;
}

export { filterProperty, initCustomerNeeds };
