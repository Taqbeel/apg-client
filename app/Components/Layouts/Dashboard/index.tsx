'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateLogin } from "@/helpers/auth";
import Spinner from "@/app/Components/Shared/Spinner"

const Dashboard = () => {

  const router = useRouter();
  const [load, setLoad] = useState(true);

  const getInfo = async() => {
    const islogin = await validateLogin(router);
    setLoad(islogin);
  }

  useEffect(()=>{
    getInfo()
  }, [])

  return (
    <div>
      {load && <Spinner />}
      {!load && <>
        Dashboard
      </>
      }
    </div>
  )
}

export default Dashboard