const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/users`;
import axios from "axios";

export const getOperationUsers = (params:object) => {
  return axios.get(`${url}/getOperationUsers`,{
    headers:{
      ...params
    }
  })
}