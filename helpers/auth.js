import { userVerify } from '@/api/auth';
import Cookies from 'js-cookie';
import delay from "@/helpers/delay";

export async function validateLogin(router) {

  const token = await Cookies.get('token');
  const params = {
    'x-access-token':token
  }
  let isLogin = false;
  userVerify(params).then((x)=>{
    if(x.data.status=="success"){
      isLogin = true
    } else {
      router.push("/")
    }
  })
  return isLogin
}

export async function logout(router) {
  await delay(2000);
  await Cookies.remove('token');
  router.push("/");
}