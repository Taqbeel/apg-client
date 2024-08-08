'use client'

import React, { useState } from 'react';
import { TiUser } from "react-icons/ti";
import { FaLock } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { userAuth } from '@/api/auth';
import { Spin } from 'antd';
import Cookies from 'js-cookie';
import openNotification from '../Shared/Notification';

const Login = () => {

  const router = useRouter();
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [load, setLoad] = useState(false)

  const handleSubmit = (e:any) => {
    setLoad(true);
    e.preventDefault();
    const params = {
      username,
      password
    }
    userAuth(params).then((x)=>{
      setLoad(false);
      if(x.data.status=="success"){
        Cookies.set('token', x.data.token, { expires: 1 });
        router.push("/dashboard")
      } else {
        openNotification("Error","Incorrect Credentials","red")
      } 
    })
  };

  return (
  <div className='pg-container'>
    <h1 className='text-white font-bold text-[30px]'>Login</h1>
    <p className='text-white'>Please Enter your E-mail and Password</p>
    <form onSubmit={handleSubmit}>
      <hr className='mb-5' />
      <div className='login-input-container'>
        <TiUser className='inp-icon' />
        <input 
          className='login-input' 
          placeholder='Email'
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          type='email' 
          required
        />
      </div>
      <div className='login-input-container'>
        <FaLock className='inp-icon' />
        <input 
          className='login-input' 
          placeholder='Password'
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          type="password" 
          required
        />
      </div>
      <button className='login-btn'>
        {
          !load?'Submit':<Spin />
        }
      </button>
    </form>
  </div>
  )
}

export default Login