'use client'
 
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTracking } from '@/api/tracking';
import { Col, Row, Flex, Spin, Timeline  } from 'antd';
import { useRouter } from 'next/navigation';

import dayjs from 'dayjs';
import relativeTime  from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const Shipment = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder]:any = useState({
    eventHistory:[]
  });
  const [load, setLoad] = useState(true);

  useEffect(()=>{
    const id:any = searchParams.get('id')
    fetchOrderData(id);
  }, []);

  const fetchOrderData = (id:string) => {
    getTracking({
      id:id
    }).then((x)=>{
      console.log(x.data.result)
      setOrder(x.data.result)
      setLoad(false)
    })
  };

  const codeMaking = (code:string) => {
    let result = "";
    if(code=="ArrivedAtCarrierFacility"){
      result = "Arrived At USPS Facility"
    } else if(code=="ReadyForReceive"){
      result = "Accepted At USPS Facility"
    } else if(code=="Departed"){
      result = "Departed USPS Facility"
    }
    return result
  }

  return (
  <>
    {!load && 
    <div>
      <p className='text-[12px]'>
        <b>Tracking Number:</b>
      </p>
      <p className='text-[22px]'><b>{order.trackingId}</b></p>
      <hr className='my-3' />
      <Row>
        <Col span={12}>
          <div className='tracking-info-box'>
            <div className='text-[12px] text-blue-900'>
              <b>Promised Delivery by</b>
            </div>
            <div className='my-3'>
              <b className='text-[20px] text-blue-900'>
                {dayjs(order.promisedDeliveryDate).format("dddd")?.toUpperCase()}
              </b>
              <br/>
              <Flex align='text-end'>
                <div>
                  <b className='text-[50px] text-blue-900'>
                    {dayjs(order.promisedDeliveryDate).format("DD")}
                  </b>
                </div>
                <div>
                  <Flex>
                    <div className='text-[12px] text-blue-900 pt-6'>
                      <b>{dayjs(order.promisedDeliveryDate).format("MMMM")}</b><br/>
                      <b>{dayjs(order.promisedDeliveryDate).format("YYYY")}</b>
                    </div>
                    <div className='pt-3 px-3 mx-3' style={{borderLeft:'1px solid grey'}}>
                      <div>BY</div>
                      <b className='text-[20px] text-blue-900'>
                        {dayjs(order.promisedDeliveryDate).format("hh:mm a")}
                      </b>
                    </div>
                  </Flex>
                </div>
              </Flex>
            </div>
          </div>
        </Col>
        <Col span={12}>
        <div className='p-4' style={{height:'65vh', overflowY:'auto'}}>
          {order.eventHistory && 
            <Timeline
              pending="Delivering..."
              reverse={true}
              items={
                order?.eventHistory.filter((x:any)=>{
                  return x.eventCode=="ReadyForReceive" || x?.location?.city!=null
                }).map((x:any)=>{
                  return {
                    children:<>
                      <div>
                        <b className="text-[12px] text-blue-900">{codeMaking(x.eventCode)}</b>
                        <div >
                          {x?.location?.city?.toUpperCase()} {x?.location?.city?", ":''}
                          {x?.location?.stateOrRegion?.toUpperCase()} {x?.location?.stateOrRegion?", ":''}
                          {x?.location?.countryCode?.toUpperCase()}
                        </div>
                        <div className='text-[11px]'>
                          {/* {dayjs.tz(x.eventTime, "America/Toronto").format("MMMM DD, YYYY, hh:mm ")} */}
                          {dayjs(x.eventTime).format("MMMM DD, YYYY, hh:mm a")}
                        </div>
                      </div>
                    </>
                }}).reverse()
              }
            />
          }
        </div>
        </Col>
      </Row>
    </div>
    }
    {load && <Spin /> }
  </>
  )
}

export default Shipment