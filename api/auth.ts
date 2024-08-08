const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth`;
import axios from "axios";

export const userAuth = (params:object) => {
  return axios.get(`${url}/login`,{
    headers:{
      ...params
    }
  })
}

export const userVerify = (params:object) => {
  return axios.get(`${url}/verifyLogin`,{
    headers:{
      ...params
    }
  })
}