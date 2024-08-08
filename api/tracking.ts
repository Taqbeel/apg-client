const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/tracking`;
import axios from "axios";

export const getTracking = (params:object) => {
  return axios.get(`${url}/tracking`, {
    headers:{
      ...params
    }
  })
};