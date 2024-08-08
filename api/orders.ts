const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/orders`;
import axios from "axios";

export const getOrders = (params:object) => {
  return axios.get(`${url}/getOrders`,{
    headers:{
      ...params
    }
  })
};

export const getAlbOrders = (params:object) => {
  return axios.get(`${url}/getAlphaOrdersOrders`,{
    headers:{
      ...params
    }
  })
};

export const uploadManualOrders = (body:object) => {
  return axios.post(`${url}/uploadManualOrders`,{
    ...body
  })
};

export const assignOrder = (body:object) => {
  return axios.post(`${url}/assignOrder`,{
    ...body
  })
};

export const getOrderByAPI = (params:object) => {
  return axios.get(`${url}/getOrderByAPI`,{
    headers:{
      ...params
    }
  })
};