import axios from 'axios';
const getListPropOfUser = async (userId, roleId) => {

    try {
        const res = await axios.get(
            `http://property-service:4002/prop/get-list-property-of-user/${userId}?roleId=${roleId}`,

            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (res.status === 200) {
            return res.data.data;
        }
        return [];
    } catch (err) {
        return [];
    }
  
}

export {
    getListPropOfUser
}


