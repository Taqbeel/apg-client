'use client';

import React, { useEffect, useState } from 'react';
import { getAlphaOrderById, getByItemNo, createPo } from '@/api/alb-orders';
import { getOrderByAPI } from '@/api/orders';
import { useSearchParams } from 'next/navigation';
import { Col, Row, Table, Tag, Spin, Modal } from 'antd';
import type { TableProps } from 'antd';
import relativeTime  from 'dayjs/plugin/relativeTime';
import { FaFileAlt } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import dayjs from 'dayjs';
import delay from '@/helpers/delay';

dayjs.extend(relativeTime);

interface DataType {
  key: string;
  age: number;
  name: string;
  address: string;
  tags: string[];
};

const AlbOrder = () => {

  const searchParams = useSearchParams();
  const [price, setPrice] = useState(0);
  const [load, setLoad] = useState(true);
  const [poLoad, setPoLoad] = useState(false);
  const tempPo = {
    "_attributes": {
        "creditcard": "N",
        "orderreferenceno": "A0001TQS",
        "responsecode": "00"
    },
    "customerpo": {
        "_text": "PO-23:17:29"
    },
    "freighttotal": {
        "_text": "12.3"
    },
    "taxtotal": {
        "_text": "0"
    },
    "coupon": {
        "_text": "0"
    },
    "ordervalue": {
        "_text": "5.18"
    },
    "shoppingbox": {
        "lineitem": {
            "style": {
                "_text": "3931"
            },
            "description": {
                "_text": "FL 3930R 5 OZ 100% HD COTN TEE"
            },
            "color": {
                "_text": "TRUE RED"
            },
            "size": {
                "_text": "3XL"
            },
            "pieces": {
                "_text": "1"
            },
            "price": {
                "_text": "5.18"
            },
            "amount": {
                "_text": "5.18"
            },
            "warehouse": {
                "_text": "PH"
            },
            "weight": {
                "_text": ".5864"
            },
            "itemcode": {
                "_text": "B11120108"
            },
            "upccode": {
                "_text": "00076031365654"
            },
            "shippernumber": {
                "_text": "A0001TQS"
            },
            "shipstatus": {
                "_text": "In Picking"
            }
        }
    },
    "shippingpage": {
        "shiptoaddresses": {
            "address": {
                "attention": {
                    "_text": "Sohail A Butt"
                },
                "company": {
                    "_text": "ABC Company"
                },
                "address1": {},
                "address2": {
                    "_text": "86 lackawanna ave"
                },
                "address3": {},
                "city": {
                    "_text": "woodland Park"
                },
                "state": {
                    "_text": "NJ"
                },
                "zipcode": {
                    "_text": "07424"
                },
                "residence": {
                    "_text": "N"
                },
                "email": {
                    "_text": "accounts@apparelglobe.com"
                }
            }
        }
    },
    "shipviapage": {
        "shipmethods": {
            "shipmethod": {
                "_attributes": {
                    "warehouse": "PH"
                },
                "selectoption": {
                    "shippernumber": {
                        "_text": "A0001TQS"
                    },
                    "optcode": {
                        "_text": "UPS-Surface"
                    },
                    "display": {
                        "_text": "UPS-Surface"
                    },
                    "freightestimate": {
                        "_text": "12.3"
                    },
                    "shipstatus": {
                        "_text": "In Picking"
                    },
                    "transitdays": {
                        "_text": "1"
                    }
                }
            }
        }
    }
  }
  const [po, setPo]:any = useState({...tempPo});
  const [show, setShow] = useState(false);
  const [order, setOrder]:any = useState({});
  const [inventory, setInventory] = useState([
    {
      "inv-balance":{
        "item":{
          "_attributes":{
            "color-code": null,
            "description": null,
            "item-number": null,
            "price": null,
            "size-code": null,
            "special-expiry": null,
            "special-price": null,
            "style-code": null,
          },
          "whse":[
            {
              "_attributes": { "code": null },
              "_text": null
            },
          ]
        },
        "whse-info":{
          "whse-item":[
            {
              "_attributes": {
                "carrier-days": null,
                "cutoff": null,
                "est-delivery": null,
                "minutes-left": null,
                "transit-days": null,
                "whse": null
              },
              "cutoff-msg": {
                "_text": null
              },
              "whse-msg": {}
            }
          ]
        }
      }
    }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleOk = () =>  setIsModalOpen(false);
  const handleCancel = () => setIsModalOpen(false);

  let count = 0;
  let globalItemsList:any = [];
  const whseList = ["PH", "MA", "CH", "GA", "FO", "KC"];

  useEffect(()=>{
    if(count==0){
      const id:any = searchParams.get('id')
      fetchOrderData(id);
      count=count+1
    }
  }, []);

  const fetchOrderData = (id:string) => {
    setLoad(true)
    if(Object.keys(order).length==0){
      getOrderByAPI({
        id:id
      }).then(async(x) => {
        let items:any = [];
        setOrder(x.data.result);
        await x.data?.result?.OrderItems?.forEach((y:any) => {
          items.push({
            id:y.id,
            itemNo:y.SellerSKU
          });
        });
        fetchInventory(items);
        setLoad(false);
      })
    }
  };
  const fetchInventory = async(list:string[]) => {
    let tempInventory:any = [];
    let itemNos:any = []
    let count = 0;
    list.forEach((item:any)=>{
      getAlphaOrderById({
        itemid:item.itemNo
      }).then((res:any)=>{
        if(res.data.status="success"){
          tempInventory.push(res.data);
          // res?.data?.itemNumbers.length>0 ? fetchAddtionalOrders(res?.data?.itemNumbers) : null;
          res?.data?.itemNumbers?.forEach((itmNo:string) => itemNos.push(itmNo))
          
          count = count + 1;
          if(count == list.length){
            globalItemsList = tempInventory
            fetchAddtionalOrders(itemNos)
          }
        }
      })
    });
  };

  const fetchAddtionalOrders = async(data:Array<string>) => {
    let tempItemNos = [...data];
    if(tempItemNos.length>0){
      getByItemNo({
        id:tempItemNos[0]
      }).then((x:any)=>{
        globalItemsList.push(x.data)
        tempItemNos.shift();
        fetchAddtionalOrders(tempItemNos)
      })
    } else {
      setShow(true)
      setInventory(globalItemsList);
      getTotalPrice(globalItemsList);
    }
  };
  
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Dated',//<><input type='checkbox' /></>,
      key: 'Order Date',
      width:120,
      render: (data) => {
        return(
          <>
            <div className='text-[12px] font-bold'>{order?.PurchaseDate && dayjs(order?.PurchaseDate)?.fromNow()}</div>
            <div className='text-[12px] font-semibold text-gray-400'>{dayjs(data?.PurchaseDate).format("D/M/YYYY")}</div>
            <div className='text-[12px] font-semibold text-gray-400'>{dayjs(data?.PurchaseDate).format("hh:mm a")}</div>
          </>
        )
      },
    },
    {
      title: 'Order Details',
      key: 'order-id',
      width:200,
      render: (data) => {
        return(
          <>
            <div className='text-[12px] font-semibold text-gray-400'>Buyer Name</div>
            <div className='text-[12px] font-semibold text-gray-400'>{order.ShippingAddress?.Name||''}</div>
            <div className='text-[12px] font-semibold text-gray-400'>Sales Channel: {data['SalesChannel']}</div>
          </>
        )
      },
    },
    {
      title: 'Product Info',
      key: 'image',
      width:400,
      render: (data) => {
        return(
        <>
          {data?.OrderItems?.map((item:any, index:Number)=>{
            return(
            <div key={item.id}>
              <div className='flex mt-2'>
                <div>
                  <img key={item.id} src={item.image} className='order-image' />
                </div>
                <div className='mx-3'>
                  <a className='font-semibold text-[12px]' style={{lineHeight:1.1}}>
                    <div>{item.Title}</div>
                  </a>
                  <div className='text-[12px] text-gray-500 mt-1' style={{lineHeight:1.1}}>
                    ASIN:
                    <span className='font-semibold'>
                      {" "}{item.ASIN}
                    </span>
                  </div>
                  <div className='text-[12px] text-gray-500' style={{lineHeight:1.1}}>
                    SKU:
                    <span className='font-semibold'>
                      {" "}{item.SellerSKU}
                    </span>
                  </div>
                  <div className='text-[12px] text-gray-500' style={{lineHeight:1.1}}>
                    Quantity:
                    <span className='font-semibold'>
                      {" "}{item.QuantityOrdered}
                    </span>
                  </div>
                </div>
              </div>
              {index!=data?.OrderItems.length-1 && <hr/>}
            </div>
          )})}
        </>
        )
      },
    },
    {
      title: 'Order Type',
      key: 'orderType',
      render: (data) => {
        return(
          <div className='text-[12px] font-bold'>{order?.OrderType}</div>
        )
      },
    },
    {
      title: 'Status',
      key: 'OrderStatus',
      render: (data) => {
        return(
          <b className='blue-2-txt'>
            <Tag color={order.OrderStatus=="Unshipped"?"#f50":"#2db7f5"}>
              {order?.OrderStatus}
            </Tag>
          </b>
        )
      },
    },
    {
      title: 'Total',
      key: 'OrderStatus',
      render: (data) => {
        return(
        <>
          <div>
            Price:{" "}
            <span className='font-semibold'>
              {/* {data?.ItemPrice?.Amount} */}
              {data?.OrderItems?.reduce((acc:any, curVal:any)=>{ return acc+curVal.ItemPriceAmount},0)}
              </span>
          </div>
          <div>
            Tax:{" "}
            <span className='font-semibold'>
              {data?.OrderItems?.reduce((acc:any, curVal:any)=>{ return acc+curVal.TaxAmount},0)}
            </span>
          </div>
          <div>
            Item Total:{" "}
            <span className='font-semibold'>{parseFloat(data?.Amount).toFixed(2)}</span>
          </div>
        </>
        )
      },
    },
  ];
  const getWhseDesc = (whse:any, index:number) => {
    const item = inventory[index]['inv-balance']['whse-info']['whse-item'].filter((x)=>x._attributes.whse==whse)[0];
    return `Carrier Days: ${item._attributes['carrier-days']}, cutoff: ${item._attributes.cutoff}, Est Deliver: ${item._attributes['est-delivery']}, Transit Days: ${item._attributes['transit-days']} --- ${item['cutoff-msg']._text||''}`
  };
  const getTotalPrice = (list:string[]) => {
    let tempPrice = 0;
    list.forEach((x:any)=>{
      tempPrice = tempPrice + parseFloat(x['inv-balance']?.item?._attributes['special-price']?.slice(1)) || parseFloat(x['inv-balance']?.item?._attributes['price']?.slice(1));
    });
    setPrice(tempPrice)
  };

  const placeOrder = () => {
    setPoLoad(true)
    const orderFile = `3451167,PO-${dayjs().format("HH:mm:ss")},UPS-Surface,${inventory[0]["inv-balance"]?.item?._attributes["item-number"]},,${inventory[0]["inv-balance"]?.item?._attributes["color-code"]},${inventory[0]["inv-balance"]?.item?._attributes["size-code"]},1,ABC Company,Sohail A Butt,86 lackawanna ave,,woodland Park,NJ,07424,PH,,,N,,sabdullah369@gmail.com`
    createPo({
      orderfile:orderFile
    }).then((x:any)=>{
      console.log(x.data)
      if(x.data.status=="success" && x?.data?.order){
        setPo(x?.data?.order);
        showModal();
      }
      setPoLoad(false)
    })
    
  };

  return (
  <>
    {!load &&
    <div style={{maxHeight:'80vh', overflowY:'auto'}}>
      <Row justify="start">
        <Col span={24}>
          <div className='text-[20px] font-semibold'>
            Order ID: # <span className='text-gray-400'>{order?.AmazonOrderId}</span>
          </div>
          <hr className='my-2' />
        </Col>
      </Row>
      <div className='my-4' style={{maxHeight:500, overflowY:'auto'}}>
        {order.OrderItems.length>0 &&
          <Table columns={columns} dataSource={[order]} pagination={false} />
        }
      </div>
      <Row>
        <Col span={4}>
          <p className='text-[25px]'>
            Total Price:{" "}
            <span className='text-red-600'>
              ${price}
            </span>
          </p>
        </Col>
        <Col span={4} className='mx-2'>
          {show &&
            <button onClick={placeOrder} className='create-po'>
              {poLoad?<CgSpinner className='spinning' />:<><FaFileAlt /> Create P.O</>}
            </button>
          }
        </Col>
      </Row>
      <br/>
      <>
      {(inventory.length>0 && show==true) && 
        <>
          {inventory?.map((item, index)=>{
          return(
            <Row key={index}>
              <Col span={5}>
                <b>Item Information</b><br/><br/>
                <b>Item No.: </b>{item["inv-balance"]?.item?._attributes["item-number"] || ""}<br/>
                <b>Color Code: </b>{item["inv-balance"]?.item?._attributes["color-code"] || ""}<br/>
                <b>Description: </b>{item["inv-balance"]?.item?._attributes["description"] || ""}<br/>
                <b>Price: </b>{item["inv-balance"]?.item?._attributes["price"] || ""}<br/>
                <b><span className='text-green-600'>Special Price:</span> </b>{item["inv-balance"]?.item?._attributes["special-price"] || ""}<br/>
                <b>Special EXP: </b>{item["inv-balance"]?.item?._attributes["special-expiry"] || ""}<br/>
                <b>Size: </b>{item["inv-balance"]?.item?._attributes["size-code"] || ""}<br/>
              </Col>
              <Col span={19}>
                <b>Warehouse Information</b><br/><br/>
                {item["inv-balance"]?.item?.whse?.filter((whse:any)=>{
                  return whseList.includes(whse?._attributes?.code)
                }).map((whse, whIndex) => {
                  return(
                    <div key={whIndex+ '' + index} className='whse-line'>
                      <span style={{width:50}}>State: </span><b>{whse?._attributes?.code}</b>
                      <span className='mx-2' style={{width:50}}>QTY: </span><b>{whse?._text}</b>
                      <span className='mx-2'> | </span>
                      <span>{getWhseDesc(whse?._attributes?.code, index)}</span>
                    </div>
                )})}
              </Col>
              <Col span={24}><hr className='my-2' /></Col>
            </Row>
          )})}
          <Modal title="Purchase Order" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} width={700} footer={false} centered>
            <div className='po-container'>
              <Row>
                <Col span={8}>
                  <p className='text-[12px] text-slate-500'>Order No Reference.</p>
                  <p className='text-[20px] font-medium'>{po?._attributes.orderreferenceno}</p>
                  <p className='text-[12px] text-slate-500'>
                    C. Card: <b>{po?._attributes.creditcard}</b>,{" "}
                    Responce Code: <b>{po?._attributes.responsecode}</b>
                  </p>
                  <p className='text-[12px] text-slate-500 mt-4'>Customer P.O Reference</p>
                  <p className='text-[20px] font-medium'>{po?.customerpo?._text}</p>
                </Col>
                <Col span={8}>
                  <div className='po-tracking-box'>
                    <p className='text-[12px] text-slate-500'>Tracking Status</p>
                    <p className='text-[20px] font-medium'>{po?.shoppingbox?.lineitem?.shipstatus?._text}</p>
                  </div>
                </Col>
                <Col span={6}>
                  <p className='text-[12px] text-slate-500 text-end'>Dated:</p>
                  <p className='text-[16px] font-medium text-end'>{dayjs().format("MM/DD/YY")}</p>
                  <p className='text-[12px] font-medium text-end'>{dayjs().format("HH:mm a")}</p>
                </Col>
              </Row>
              <hr className='my-4' />
              <Row>
                <Col span={12}>
                  <p className='text-[12px] text-slate-500'>Item Style No.</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.style?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item Description</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.description?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item Color</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.color?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item Size</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.size?._text}</p>
                  <p className='text-[12px] text-slate-500'>Pieces Bought</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.pieces?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item Price</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.price?._text}</p>
                  <p className='text-[12px] text-slate-500'>Warehouse From Shipped</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.warehouse?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item Weight</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.weight?._text}</p>
                  <p className='text-[12px] text-slate-500'>Item No.</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.itemcode?._text}</p>
                  <p className='text-[12px] text-slate-500'>Shipping No.</p>
                  <p className='text-[16px] font-medium'>{po?.shoppingbox?.lineitem?.shippernumber?._text}</p>
                </Col>
                <Col span={12}>
                  <p className='text-[12px] text-slate-500'>Customer Info</p>
                  <p className='text-[18px] font-medium'>{po?.shippingpage?.shiptoaddresses?.address?.attention._text}</p>
                  <p className='text-[14px] font-medium'>{po?.shippingpage?.shiptoaddresses?.address?.company._text}</p>
                  <p className='text-[14px] font-medium'>{po?.shippingpage?.shiptoaddresses?.address?.address1?._text||'' + ' ' + po?.shippingpage?.shiptoaddresses?.address?.address2?._text||''}</p>
                  <p className='text-[14px] font-medium'>{po?.shippingpage?.shiptoaddresses?.address?.city?._text+' '+ po?.shippingpage?.shiptoaddresses?.address?.state?._text+' '+po?.shippingpage?.shiptoaddresses?.address?.zipcode?._text}</p>
                  <p>{po?.shippingpage?.shiptoaddresses?.address?.email?._text}</p>
                </Col>
              </Row>
            </div>
          </Modal>
        </>
      }
      {!show && <>Fetcing Inventory <Spin /></>}
      </>
    </div>
    }
    {load &&  <Spin />}
  </>
  )
};

export default AlbOrder