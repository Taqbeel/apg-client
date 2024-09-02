const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/shipping`;
import axios from "axios";

export const getRates = (payload: object) => {
  return axios.post(`${url}/getRates`, payload);
};

export const purchaseShipment = (payload: object) => {
  return axios.post(`${url}/purchaseShipment`, payload);
};

export const getLabel = (payload: object) => {
  return axios.post(`${url}/getLabel`, payload);
};
