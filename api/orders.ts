const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/orders`;
import axios from "axios";

export const getOrders = (
  params: object,
  orderId: string,
  orderStatus: string,
  pONumber: string,
  vendorName: string
) => {
  return axios.get(
    `${url}/getOrders?orderId=${orderId}&orderStatus=${orderStatus}&pONumber=${pONumber}&vendorName=${vendorName}`,
    {
      headers: {
        ...params,
      },
    }
  );
};

export const getAlbOrders = (params: object) => {
  return axios.get(`${url}/getAlphaOrdersOrders`, {
    headers: {
      ...params,
    },
  });
};

export const uploadManualOrders = (body: object) => {
  return axios.post(`${url}/uploadManualOrders`, {
    ...body,
  });
};

export const assignOrder = (body: object) => {
  return axios.post(`${url}/assignOrder`, {
    ...body,
  });
};

export const getOrderByAPI = (params: object) => {
  return axios.get(`${url}/getOrderByAPI`, {
    headers: {
      ...params,
    },
  });
};

export const orderStatusChange = (payload: object) => {
  return axios.post(`${url}/orderStatusChange`, payload);
};
