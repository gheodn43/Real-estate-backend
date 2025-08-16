const axios = require('axios');

const getListPropOfUser = async (userId, page, limit, type, search, needsType, token) => {
    try {
        const res = await axios.get(
            `http://property-service:4002/prop/get-list-property-of-user/${userId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    type,
                    search,
                    needsType,
                },
            }
        );
        return res.data.data;
    } catch (err) {
    }
}

module.exports = {
    getListPropOfUser
}


