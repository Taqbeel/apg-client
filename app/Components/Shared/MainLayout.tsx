'use client'

import { useEffect, useState } from 'react';
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayout from './DashboardLayout';

export interface IAppProps {
  children:React.ReactNode
}

export function MainLayout (props: IAppProps) {

  const router = useRouter();
  const path = usePathname();

  const Login = () => {
    return (
      <div>
        <Suspense fallback={<p>Loading... Please Wait.</p>}>
          {props.children}
        </Suspense>
      </div>
    )
  }

  const Dashboard = () => {
    return (
      <div className='sidebar-styles'>
        <DashboardLayout>
          <Suspense fallback={<p>Loading feed...</p>}>
            {props.children}
          </Suspense>
        </DashboardLayout>
      </div>
    )
  }

  return path=="/"?<Login/>:<Dashboard/>
}