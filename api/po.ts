const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/po`;
import axios from "axios";

export const getPoData = (params:object) => {
  return axios.get(`${url}/getPoData`,{
    headers:{
      ...params
    }
  })
};
