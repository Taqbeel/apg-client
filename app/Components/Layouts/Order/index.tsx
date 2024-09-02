"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderByAPI } from "@/api/orders";
import { GiUsaFlag } from "react-icons/gi";
import { FaPhone } from "react-icons/fa";
import delay from "@/helpers/delay";
import { Col, Row, Flex, Table, Tag, Spin } from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const Order = () => {
  const searchParams = useSearchParams();
  const [order, setOrder]: any = useState({});
  const [load, setLoad] = useState(true);

  const borderClass = "border-solid border-2 border-gray-300 p-4 rounded";

  useEffect(() => {
    const id: any = searchParams.get("id");
    fetchOrderData(id);
  }, []);

  const fetchOrderData = async (id: string) => {
    setLoad(true);
    if (Object.keys(order).length == 0) {
      await getOrderByAPI({
        id: id,
      }).then(async (x) => {
        await setOrder(x.data.result);
        setLoad(false);
      });
    }
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Dated", //<><input type='checkbox' /></>,
      key: "Order Date",
      width: 120,
      render: (data) => {
        return (
          <>
            <div className="text-[12px] font-bold">
              {order?.PurchaseDate && dayjs(order?.PurchaseDate)?.fromNow()}
            </div>
            <div className="text-[12px] font-semibold text-gray-400">
              {dayjs(data?.PurchaseDate).format("D/M/YYYY")}
            </div>
            <div className="text-[12px] font-semibold text-gray-400">
              {dayjs(data?.PurchaseDate).format("hh:mm a")}
            </div>
          </>
        );
      },
    },
    {
      title: "Order Details",
      key: "order-id",
      width: 200,
      render: (data) => {
        return (
          <>
            <div className="text-[12px] font-semibold text-gray-400">
              {data["BuyerAddress"]?.Name ? "Buyer Name:" : "Buyer Email:"}
            </div>
            <div className="text-[12px] font-semibold text-white">
              {(data["BuyerAddress"]?.Name || data["BuyerInfo"]?.BuyerEmail) ??
                ""}
            </div>
            <div className="text-[12px] font-semibold text-gray-400">
              Sales Channel:
            </div>
            <div className="text-[12px] font-semibold text-white">
              {data["SalesChannel"]}
            </div>
          </>
        );
      },
    },
    {
      title: "Product Info",
      key: "image",
      width: 400,
      render: (data) => {
        return (
          <>
            {data?.OrderItems?.map((item: any, index: Number) => {
              return (
                <div key={item.id}>
                  <div className="flex mt-2">
                    <div>
                      <img
                        key={item.id}
                        src={item.image}
                        className="order-image"
                      />
                    </div>
                    <div className="mx-3">
                      <a
                        className="font-semibold text-[12px]"
                        style={{ lineHeight: 1.1 }}
                      >
                        <div>{item.Title}</div>
                      </a>
                      <div
                        className="text-[12px] text-gray-500 mt-1"
                        style={{ lineHeight: 1.1 }}
                      >
                        ASIN:
                        <span className="font-semibold"> {item.ASIN}</span>
                      </div>
                      <div
                        className="text-[12px] text-gray-500"
                        style={{ lineHeight: 1.1 }}
                      >
                        SKU:
                        <span className="font-semibold"> {item.SellerSKU}</span>
                      </div>
                      <div
                        className="text-[12px] text-gray-500"
                        style={{ lineHeight: 1.1 }}
                      >
                        Quantity:
                        <span className="font-semibold">
                          {" "}
                          {item.QuantityOrdered}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index != data?.OrderItems.length - 1 && <hr />}
                </div>
              );
            })}
          </>
        );
      },
    },
    {
      title: "Order Type",
      key: "orderType",
      render: (data) => {
        return (
          <>
            <div className="text-[12px] font-bold">{order?.OrderType}</div>
            <div className="text-[10px] font-semibold text-gray-400">
              {/* Ship By Date {dayjs(data.LatestShipDate).format("ddd, MMM D, YYYY, hh:mm a")} */}
            </div>
            {data.LatestDeliveryDate && (
              <div className="text-[10px] font-semibold text-gray-400">
                {/* Deliver By Date {dayjs(data.LatestDeliveryDate).format("ddd, MMM D, YYYY, hh:mm a")} */}
              </div>
            )}
          </>
        );
      },
    },
    {
      title: "Status",
      key: "OrderStatus",
      render: (data) => {
        return (
          <b className="blue-2-txt">
            <Tag color={order.OrderStatus == "Pending" ? "#f50" : "#2db7f5"}>
              {order?.OrderStatus}
            </Tag>
          </b>
        );
      },
    },
    {
      title: "Total",
      key: "OrderStatus",
      render: (data) => {
        return (
          <>
            <div>
              Price:{" "}
              <span className="font-semibold">
                {/* {data?.ItemPrice?.Amount} */}
                {data?.OrderItems?.reduce((acc: any, curVal: any) => {
                  return acc + curVal.ItemPriceAmount;
                }, 0)}
              </span>
            </div>
            <div>
              Tax:{" "}
              <span className="font-semibold">
                {data?.OrderItems?.reduce((acc: any, curVal: any) => {
                  return acc + curVal.TaxAmount;
                }, 0)}
              </span>
            </div>
            <div>
              Item Total:{" "}
              <span className="font-semibold">
                {parseFloat(data?.OrderTotal?.Amount)}
              </span>
            </div>
          </>
        );
      },
    },
  ];

  return (
    <div>
      {!load && (
        <>
          <Row justify="start">
            <Col span={24}>
              <div className="text-[20px] font-semibold">Order Details</div>
              <hr className="my-2" />
            </Col>
            <Col span={24} className="font-bold">
              <div className="text-[11px]">
                <Flex gap={"10px"}>
                  <div>
                    Order ID: #{" "}
                    <span className="text-gray-400">{order.AmazonOrderId}</span>
                  </div>
                </Flex>
              </div>
            </Col>
          </Row>
          <Row className="my-2">
            <Col span={12} className="px-1">
              <div className={`${borderClass}`}>
                <div className="text-[18px] font-semibold">Order Summary</div>
                <hr className="my-2" />
                <div className="text-[11px]  font-bold">
                  <Flex justify="space-between" gap={"20px"}>
                    <div className="w-3/4">
                      <Flex gap={"10px"}>
                        <div className="w-1/4">Ship By:</div>
                        <div className="w-3/4 text-yellow-1">
                          {dayjs(order.LatestShipDate).format(
                            "ddd, MMM D, YYYY"
                          )}
                        </div>
                      </Flex>
                    </div>
                    <div className="w-2/4">
                      <Flex gap={"10px"}>
                        {/* FulfillmentChannel */}
                        <div className="w-2/4">Shipping Service:</div>
                        <div className="w-2/4 text-gray-400">
                          {order.ShipmentServiceLevelCategory}
                        </div>
                      </Flex>
                    </div>
                  </Flex>
                  <Flex justify="space-between" gap={"20px"} className="mt-2">
                    <div className="w-3/4">
                      <Flex gap={"10px"}>
                        <div className="w-1/4">Deliver By:</div>
                        <div className="w-3/4 text-gray-400">
                          {order.OrderStatus != "Pending" && (
                            <>
                              {dayjs(order.EarliestDeliveryDate).format(
                                "ddd, MMM D, YYYY"
                              )}{" "}
                              to{" "}
                              {dayjs(order.LatestDeliveryDate).format(
                                "ddd, MMM D, YYYY"
                              )}
                            </>
                          )}
                          {order.OrderStatus == "Pending" && (
                            <div>Info Pending</div>
                          )}
                        </div>
                      </Flex>
                    </div>
                    <div className="w-2/4">
                      <Flex gap={"10px"}>
                        {/* FulfillmentChannel */}
                        <div className="w-2/4">Fulfillment:</div>
                        <div className="w-2/4 text-gray-400">
                          {order.FulfillmentChannel}
                        </div>
                      </Flex>
                    </div>
                  </Flex>
                  <Flex justify="space-between" gap={"20px"} className="mt-2">
                    <div className="w-3/4">
                      <Flex gap={"10px"}>
                        <div className="w-1/4">Purchase Date:</div>
                        <div className="w-3/4 text-gray-400">
                          {dayjs(order.PurchaseDate).format(
                            "ddd, MMM D, YYYY, hh:mm a"
                          )}
                        </div>
                      </Flex>
                    </div>
                    <div className="w-2/4">
                      <Flex gap={"10px"}>
                        {/* FulfillmentChannel */}
                        <div className="w-2/4">Sales Channel:</div>
                        <div className="w-2/4 text-gray-400">
                          <Flex align="center">
                            {order.SalesChannel} <GiUsaFlag className="mx-1" />
                          </Flex>
                        </div>
                      </Flex>
                    </div>
                  </Flex>
                </div>
              </div>
            </Col>
            <Col span={12} className="px-1">
              <div className={`${borderClass}`}>
                <div className="text-[18px] font-semibold">Ship to</div>
                <hr className="my-1" />
                {order.OrderStatus != "Pending" && (
                  <div className="text-[11px]  font-bold">
                    <Flex justify="space-between" gap={"20px"}>
                      <div>
                        <div className="text-gray-400">
                          Address Line 1:{" "}
                          <span className="font-normal text-white">
                            {order?.BuyerAddress?.AddressLine1}
                          </span>
                          ,
                        </div>
                        <div className="text-gray-400">
                          City:{" "}
                          <span className="font-normal text-white">
                            {order?.BuyerAddress?.City}
                          </span>
                          ,
                        </div>
                        <div className="text-gray-400">
                          State/Region:{" "}
                          <span className="font-normal text-white">
                            {order?.BuyerAddress?.StateOrRegion}
                          </span>
                          ,
                        </div>
                        <div className="text-gray-400">
                          Country Code:{" "}
                          <span className="font-normal text-white">
                            {order?.BuyerAddress?.CountryCode}
                          </span>
                          ,
                        </div>
                        <div className="text-gray-400">
                          Postal Code:{" "}
                          <span className="font-normal text-white">
                            {order?.BuyerAddress?.PostalCode}
                          </span>
                          ,
                        </div>
                        <br />
                        <div className="mt-1">
                          Address Type:{" "}
                          <span className="text-gray-400">
                            {order?.BuyerAddress?.AddressType || "Nil"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-white text-sm">
                          {order?.BuyerAddress?.Name ||
                            order?.BuyerInfo?.BuyerEmail}
                        </div>
                        <br />
                        Buyer Contact
                        <br />
                        <span className="text-gray-400">
                          <Flex align="center">
                            <FaPhone />
                            <span className="mx-2">
                              {order?.BuyerAddress?.Phone || "Nil"}
                            </span>
                          </Flex>
                        </span>
                      </div>
                    </Flex>
                  </div>
                )}
                {order.OrderStatus == "Pending" && (
                  <div className="text-[11px] text-gray-400 font-bold">
                    Shipper Info Pending
                  </div>
                )}
              </div>
            </Col>
            <Col span={24} className={`px-1 mt-2`}>
              <div className={borderClass}>
                <div className="text-[18px] font-semibold">More Details</div>
                <hr className="my-1" />
                <div>
                  Order Total Amount:{" "}
                  <span className="font-semibold">
                    {order?.OrderTotal?.Amount}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
          <div className="my-4" style={{ maxHeight: 500, overflowY: "auto" }}>
            {order.OrderItems.length > 0 && (
              <Table
                columns={columns}
                dataSource={[order]}
                pagination={false}
              />
            )}
          </div>
        </>
      )}
      {load && (
        <div>
          {/* <span className='mx-2'>Loading..</span> */}
          <Spin />
        </div>
      )}
    </div>
  );
};

export default Order;
