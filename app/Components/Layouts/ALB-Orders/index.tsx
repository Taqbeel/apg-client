"use client";
import { assignOrder, getAlbOrders, uploadManualOrders } from "@/api/orders";
import { getOperationUsers } from "@/api/users";
import Spinner from "@/app/Components/Shared/Spinner";
import { validateLogin } from "@/helpers/auth";
import type { TableProps } from "antd";
import { Button, Dropdown, Flex, Select, Space, Table, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaUserCheck, FaUserSlash } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import * as xlsx from "xlsx";
import PurchaseOrders from "./PurchaseOrders";
dayjs.extend(relativeTime);

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const Orders: React.FC = () => {
  const router = useRouter();
  const [load, setLoad] = useState(false);
  const [data, setData]: Array<any> = useState([]);
  const [checkedOrders, setCheckedOrders]: Array<any> = useState([]);
  const [userList, setUserList]: Array<any> = useState([]);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("unshipped");
  const [userType, setUserType] = useState({
    type: "",
    User: "",
  });

  useEffect(() => {
    getInfo();
    getOperationUsers({}).then((x) => {
      setUserList(x?.data?.result || []);
    });
  }, []);

  const checkItems = (orderData: any) => {
    let temp = [...checkedOrders];
    if (orderData.value == true) {
      temp.push(orderData.id);
    } else {
      temp = temp.filter((x) => {
        return x != orderData.id;
      });
    }
    setCheckedOrders(temp);
  };

  const getUserInfo = async () => {
    const userInfo: string = (await Cookies.get("token")) || "";
    let decoded: any = {};
    if (userInfo) {
      decoded = jwtDecode(userInfo);
      setUserType({
        User: decoded.username,
        type: decoded.type,
      });
    }
    return {
      User: decoded.username,
      type: decoded.type,
    };
  };

  const getInfo = async () => {
    setLoad(true);
    let tempUser = {
      type: "",
      User: "",
    };
    const isLogin = await validateLogin(router);
    if (!isLogin) {
      userType.User == ""
        ? (tempUser = await getUserInfo())
        : (tempUser = { ...userType });

      const orderData: any = await getAlbOrders({});
      if (tempUser.type != "admin") {
        let tempOrders: Array<any> = [];
        orderData.data.result.forEach((x: any) => {
          if (x.User == tempUser.User) {
            tempOrders.push(x);
          }
        });
        setData(tempOrders);
      } else {
        setData(orderData.data.result);
      }
    }
    setLoad(isLogin);
  };

  const handleUpload = (e: any) => {
    e.preventDefault();
    if (e?.target?.files[0]) {
      var files = e.target.files,
        f = files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = e?.target?.result;
        let readedData = xlsx.read(data, { type: "binary" });
        const wsname = readedData.SheetNames[0];
        const ws = readedData.Sheets[wsname];

        /* Convert array to json*/
        const dataParse: any[] = xlsx.utils.sheet_to_json(ws, { header: 1 });
        let tempData: Array<any> = [];
        dataParse.forEach((x: any[], i: number) => {
          if (i != 0) {
            tempData.push({
              "order-id": x[0],
              "order-item-id": x[1],
              "purchase-date": x[2],
              "payments-date": x[3],
              "buyer-email": x[4],
              "buyer-name": x[5],
              "payment-method-details": x[6],
              cpf: x[7],
              "buyer-phone-number": x[8],
              sku: x[9],
              "number-of-items": x[10],
              "product-name": x[11],
              "quantity-purchased": x[12],
              currency: x[13],
              "item-price": x[14],
              "item-tax": x[15],
              "shipping-price": x[16],
              "shipping-tax": x[17],
              "ship-service-level": x[18],
              "recipient-name": x[19],
              "ship-address-1": x[20],
              "ship-address-2": x[21],
              "ship-address-3": x[22],
              "ship-city": x[23],
              "ship-state": x[24],
              "ship-postal-code": x[25],
              "ship-country": x[26],
              "ship-phone-number": x[27],
              "item-promotion-discount": x[28],
              "item-promotion-id": x[29],
              "ship-promotion-discount": x[30],
              "ship-promotion-id": x[31],
              "delivery-start-date": x[32],
              "delivery-end-date": x[33],
              "delivery-time-zone": x[34],
              "delivery-Instructions": x[35],
              "earliest-ship-date": x[36],
              "latest-ship-date": x[37],
              "earliest-delivery-date": x[38],
              "latest-delivery-date": x[39],
              "is-business-order": x[40],
              "purchase-order-number": x[41],
              "price-designation": x[42],
              "is-prime": x[43],
              "signature-confirmation-recommended": x[44],
            });
          }
        });
        parseData(tempData);
      };
      reader.readAsBinaryString(f);
    }
  };

  const orderItemObject = (x: any) => {
    return {
      OrderItemId: x["order-item-id"],
      QuantityOrdered: x["quantity-purchased"],
      SellerSKU: x["sku"],
      ItemPriceAmount: x["item-price"],
      TaxAmount: x["item-tax"],
      Title: x["product-name"],
      PromoDiscountAmount: x["item-promotion-discount"],
      ProductInfo: {
        NumberOfItems: x["number-of-items"],
      },
      isAlpha: true,
    };
  };

  const orderObject = (x: any) => {
    return {
      status: "arriving",
      AmazonOrderId: x["order-id"],
      isPrime: x["is-prime"],
      PurchaseDate: x["purchase-date"],
      isBusinessOrder: x["is-business-order"],
      OrderType: x["ship-service-level"],
      EarliestDeliveryDate: x["earliest-delivery-date"],
      LatestDeliveryDate: x["latest-delivery-date"],
      LatestShipDate: x["latest-ship-date"],
      EarliestShipDate: x["earliest-ship-date"],
      Amount: Number(x["item-price"]) + Number(x["item-tax"]),
      BuyerInfo: {
        BuyerEmail: x["buyer-email"],
        AddressLine1: x["ship-address-1"],
        City: x["ship-city"],
        CountryCode: x["ship-country"],
        Name: x["recipient-name"],
        Phone: x["ship-phone-number"],
        PostalCode: x["ship-postal-code"],
        StateOrRegion: x["ship-state"],
      },
      OrderItems: [orderItemObject(x)],
    };
  };

  const parseData = (data: any) => {
    let orders: any = [];
    data.forEach((x: any) => {
      if (orders.length == 0) {
        orders.push(orderObject(x));
      } else {
        if (orders[orders.length - 1].AmazonOrderId == x["order-id"]) {
          orders[orders.length - 1].OrderItems.push(orderItemObject(x));
          orders[orders.length - 1].Amount =
            orders[orders.length - 1].Amount +
            Number(x["item-price"]) +
            Number(x["item-tax"]);
        } else {
          orders.push(orderObject(x));
        }
      }
    });
    uploadManualOrders({
      orders,
    }).then((x) => {
      console.log(x);
    });
    // console.log(orders);
    // setData(orders);
  };

  const items = [
    {
      label: (
        <div className="p-2">
          <input type="file" id="fileInput" onChange={handleUpload} />
        </div>
      ),
      key: "0",
    },
  ];

  const handleChange = (e: any) => {
    setUser(e);
  };

  const assign = () => {
    let userName = "";
    userList.forEach((x: any) => {
      if (x.id == user) {
        userName = x.name;
      }
    });
    const payload = {
      name: userName,
      id: checkedOrders,
    };
    assignOrder(payload).then((x) => {
      if (x.status == 200) {
        setCheckedOrders([]);
        getInfo();
      }
    });
  };

  const tabChange = (key: string) => {
    let tempStatus = "";
    key == "1"
      ? (tempStatus = "unshipped")
      : key == "3"
      ? (tempStatus = "shipped")
      : key == "6"
      ? (tempStatus = "arriving")
      : key == "4"
      ? (tempStatus = "transit")
      : (tempStatus = "delivered");
    setStatus(tempStatus);
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "-",
      key: "check",
      width: 5,
      render: (item) => {
        return (
          <>
            <input
              type="checkbox"
              checked={item.check ? true : false}
              onChange={(e) => {
                let temp = [...data];
                const index = temp.map((e: any) => e.id).indexOf(item.id);
                temp[index].check = !temp[index].check;
                checkItems({
                  value: e.target.checked,
                  id: item.id,
                });
                setData(temp);
              }}
            />
          </>
        );
      },
    },
    {
      title: "Dated",
      key: "Order Date",
      width: 90,
      render: (data) => {
        return (
          <>
            <div className="text-[10px] font-bold">
              {dayjs(data.PurchaseDate).fromNow()}
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              {dayjs(data.PurchaseDate).format("D/M/YYYY")}
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              {dayjs(data.PurchaseDate).format("hh:mm a")}
            </div>
          </>
        );
      },
    },
    {
      title: "Order Details",
      key: "order-id",
      width: 152,
      render: (data) => {
        return (
          <>
            <Link
              href={`/dashboard/alb-order?id=${data["AmazonOrderId"]}`}
              className="text-[11px] font-bold"
            >
              {data["AmazonOrderId"]}
            </Link>
            <div className="text-[10px] font-semibold text-gray-400">
              Buyer Name
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              {data["BuyerInfo"]?.Name || ""}
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              Sales Channel: {data["SalesChannel"]}
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
                    <div style={{ width: 50 }}>
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
                        className="text-[10px] text-gray-500 mt-1"
                        style={{ lineHeight: 1.1 }}
                      >
                        <a
                          href={`https://www.amazon.com/gp/product/${item.ASIN}`}
                          target="_blank"
                        >
                          ASIN:
                          <span className="font-semibold"> {item.ASIN}</span>
                        </a>
                      </div>
                      <div
                        className="text-[10px] text-gray-500 my-1"
                        style={{ lineHeight: 1.1 }}
                      >
                        SKU:
                        <span className="font-semibold"> {item.SellerSKU}</span>
                      </div>
                      <div
                        className="text-[10px] text-gray-500"
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
                  <hr className="my-1" />
                </div>
              );
            })}
            <div className="text-[11px] text-gray-500">
              Sub-total:
              <span className="font-semibold"> ${data.Amount}</span>
            </div>
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
            <div className="text-[10px] font-bold">{data.OrderType}</div>
            <div className="text-[10px] font-semibold text-gray-400">
              Ship: {dayjs(data.LatestShipDate).format("dd, MMM D, hh:mm a")}
            </div>
            {data.LatestDeliveryDate && (
              <div className="text-[10px] font-semibold text-gray-400">
                Delivery:{" "}
                {dayjs(data.LatestDeliveryDate).format("dd, MMM D, hh:mm a")}
              </div>
            )}
          </>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (data) => {
        return (
          <b className="blue-2-txt">
            {status == "arriving" && (
              <Tag
                color={
                  data.status == "Pending"
                    ? "#f50"
                    : data.status == "Unshipped"
                    ? "#2db7f5"
                    : "green"
                }
              >
                <div className="text-[10px]">{data.status}</div>
              </Tag>
            )}
            {status != "arriving" && (
              <Tag
                color={
                  data.OrderStatus == "Pending"
                    ? "#f50"
                    : data.OrderStatus == "Unshipped"
                    ? "#2db7f5"
                    : "green"
                }
              >
                <div className="text-[10px]">{data.OrderStatus}</div>
              </Tag>
            )}
          </b>
        );
      },
    },
    {
      title: "Assignee",
      key: "user",
      render: (data) => {
        return (
          <div className="flex">
            {data.User && (
              <span className="text-green-400">
                <FaUserCheck />
              </span>
            )}
            <span className="mx-1"></span>
            {data.User}
            {!data.User && (
              <span className="text-gray-400">
                <FaUserSlash />
              </span>
            )}
          </div>
        );
      },
    },
    {
      title:
        status != "transit" && status != "delivered" && status != "arriving"
          ? "Actions"
          : status == "transit"
          ? "Tracking"
          : "-",
      key: "user",
      render: (data) => {
        return (
          <>
            {status != "arriving" && (
              <>
                {status != "transit" && status != "delivered" && (
                  <>
                    <div className="shipment-btn text-[11px]">
                      <Link
                        href={`/dashboard/shipment?id=${data["AmazonOrderId"]}`}
                      >
                        <span className="no-underline text-white">
                          Buy Shipping
                        </span>
                      </Link>
                    </div>
                  </>
                )}
                {status == "transit" && (
                  <>
                    <div className="shipment-btn text-[11px] my-2">
                      <Link
                        href={`/dashboard/tracking?id=${data["AmazonOrderId"]}`}
                      >
                        <span className="no-underline text-white">
                          Order Tracking
                        </span>
                      </Link>
                    </div>
                    <div className="text-[11px]">
                      <div>Expected Delivery By:</div>
                      <div>
                        <b>
                          {dayjs(
                            data["OrderShipment"]?.promise?.deliveryWindow.end
                          ).format("ddd DD, MMMM - hh:mm a")}
                        </b>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        );
      },
    },
  ];

  const TableComponent = () => (
    <div className="my-4" style={{ maxHeight: 500, overflowY: "auto" }}>
      <Table
        columns={columns}
        dataSource={data?.filter((x: any) => x.status == status)}
      />
    </div>
  );

  const tabItems = [
    {
      key: "7",
      label: "Purchase orders",
      children: <PurchaseOrders />,
    },
    {
      key: "6",
      label: "Alb Orders",
      children: <TableComponent />,
    },
    {
      key: "1",
      label: "Un-Shipped",
      children: <TableComponent />,
    },
    {
      key: "2",
      label: "In-Process",
      children: <TableComponent />,
    },
    {
      key: "3",
      label: "Shipped",
      children: <TableComponent />,
    },
    {
      key: "4",
      label: "In-Transit",
      children: <TableComponent />,
    },
    {
      key: "5",
      label: "Delivered",
      children: <TableComponent />,
    },
  ];

  return (
    <>
      {load && <Spinner />}
      {!load && (
        <>
          <Flex gap="middle" align="center">
            <Dropdown menu={{ items }} trigger={["click"]}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  {/* Update Manually */}
                  <RxUpdate />
                </Space>
              </a>
            </Dropdown>
            <div>
              {checkedOrders.length > 0 && (
                <Select
                  defaultValue={null}
                  placeholder="Select User"
                  style={{
                    width: 150,
                  }}
                  value={user}
                  onChange={handleChange}
                  options={userList.map((x: any) => {
                    return { value: x.id, label: x.name };
                  })}
                />
              )}
            </div>
            <div>
              {checkedOrders.length > 0 && user != "" && user != null && (
                <Button type="primary" onClick={assign}>
                  Assign
                </Button>
              )}
            </div>
          </Flex>
          <Tabs defaultActiveKey="7" items={tabItems} onChange={tabChange} />
        </>
      )}
    </>
  );
};

export default Orders;
