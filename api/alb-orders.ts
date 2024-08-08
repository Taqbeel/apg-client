const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/alpha`;
import axios from "axios";

export const getAlphaOrderById = (params:object) => {
  return axios.get(`${url}/getInventoryById`,{
    headers:{
      ...params
    }
  })
};

export const getByItemNo = (params:object) => {
  return axios.get(`${url}/getInventoryByItemNumber`,{
    headers:{
      ...params
    }
  })
};

export const createPo = (params:object) => {
  return axios.get(`${url}/createPo`,{
    headers:{
      ...params
    }
  })
};