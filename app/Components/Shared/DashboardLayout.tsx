import React, { useEffect, useState } from 'react';
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { MdOutlineInventory2 } from "react-icons/md";
import { Button, Layout, Menu, theme, Flex } from 'antd';
import { RiDashboard2Line } from "react-icons/ri";
import { FaListCheck } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import { IoLogOut } from "react-icons/io5";
import { logout } from "@/helpers/auth";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';
import Spinner from './Spinner';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;

interface IAppProps {
  children:React.ReactNode,
};

const DashboardLayout = (props: IAppProps) => {

  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState("");
  const [load, setLoad] = useState(false);

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const items = [
    {
      key: '1',
      icon: <RiDashboard2Line />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '2',
      icon: <FaListCheck />,
      label: <Link href="/dashboard/orders">Orders</Link>,
    },
    {
      key: '3',
      icon: <FaListCheck />,
      label: <Link href="/dashboard/alb-orders">ALB Orders</Link>,
    },
    {
      key: '4',
      icon: <MdOutlineInventory2 />,
      label: <Link href="/dashboard/inventory">Inventory</Link>,
    }
  ];

  const getUserInfo = async() => {
    const userInfo:string = await Cookies.get('token')||'';
    if(userInfo){
      const decoded:any = jwtDecode(userInfo);
      setUser(decoded.username)
    }
  };

  useEffect(()=>{ getUserInfo(); }, []);

  return (
  <Layout>
    <Sider trigger={null} collapsible collapsed={collapsed}>
      <Flex vertical justify='space-between' style={{height:'100vh'}}>
        <div>
          <div className="demo-logo-vertical" />
          <div className='profile'>
            {!collapsed &&
            <>
              <div className='profile-img profile-large'></div>
              <div className='text-white text-center mt-4'>
                {user}
              </div>
            </>
            }
            {collapsed &&<div className='profile-img profile-small'></div>}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            // defaultSelectedKeys={['1']}
            items={items}
            className='side-menu-styles'
            selectedKeys={[`0`]}
          />
        </div>
        <div>
          <div className='text-center pb-4'>
            <Button type='text' onClick={()=>{setLoad(true); logout(router)}}>
              <div className='flex text-gray-300'>
                {!collapsed && <div className='text-[16px]'>Logout</div>}
                <IoLogOut className='mx-2 text-[22px]'/>
              </div>
            </Button>
          </div>
          <Button
            type="text"
            icon={collapsed ? <IoIosArrowDropright style={{fontSize:25}} /> : <IoIosArrowDropleft style={{fontSize:25}} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: '100%',
              height: 64,
              borderRadius:0,
              color:'grey',
              borderTop:'1px solid grey'
            }}
          />
        </div>
      </Flex>
    </Sider>
    <Layout>
      <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={<IoIosArrowDropleft style={{fontSize:25}} />}
            onClick={() => router.back()}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              borderRadius:0,
            }}
          />
      </Header>
      <Content
        style={{
          margin: '24px 16px',
          padding: 24,
          height: '80vh',
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        {!load && 
          <>{props.children}</>
        }
        {load && <Spinner/>}
      </Content>
    </Layout>
  </Layout>
  );
};

export default DashboardLayout;