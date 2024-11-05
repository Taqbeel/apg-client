"use client";

import { assignOrder, getOrders, orderStatusChange } from "@/api/orders";
import { getLabel } from "@/api/shipment";
import { getOperationUsers } from "@/api/users";
import Spinner from "@/app/Components/Shared/Spinner";
import { validateLogin } from "@/helpers/auth";
import type { TableProps } from "antd";
import {
  Button,
  Col,
  Dropdown,
  Flex,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaFileDownload, FaUserCheck, FaUserSlash } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import { useReactToPrint } from "react-to-print";
import * as xlsx from "xlsx";

dayjs.extend(relativeTime);

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const Orders: React.FC = () => {
  const contentToPrint = useRef(null);
  const router = useRouter();

  const [load, setLoad] = useState(false);
  const [data, setData]: Array<any> = useState([]);
  const [checkedOrders, setCheckedOrders]: Array<any> = useState([]);
  const [userList, setUserList]: Array<any> = useState([]);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("unshipped");
  const [orderStatus, setOrderStatus] = useState("Unshipped");
  const [vendor, setVendor] = useState("");
  const [orderId, setOrderId] = useState("");
  const [pONumber, setPONumber] = useState("");
  const [key, setKey] = useState("1");
  const [document, setDocument]: any = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [fileFormat, setFileFormat] = useState("");
  const [userType, setUserType] = useState({
    type: "",
    User: "",
  });

  useEffect(() => {
    setLoad(true);
    getInfo(key);
    setLoad(false);
  }, [key]);

  useEffect(() => {
    getOperationUsers({}).then((x) => {
      setUserList(x?.data?.result || []);
    });
  }, []);

  const handleOk = () => setIsModalOpen(false);
  const handleCancel = () => setIsModalOpen(false);

  const getInfo = async (key: string) => {
    let tempUser = {
      type: "",
      User: "",
    };
    const isLogin = await validateLogin(router);
    console.log("isLogin", isLogin);
    if (!isLogin) {
      userType.User == ""
        ? (tempUser = await getUserInfo())
        : (tempUser = { ...userType });

      const orderData: any = await getOrders(
        {},
        orderId,
        orderStatus,
        pONumber,
        vendor
      );
      if (tempUser.type != "admin") {
        let tempOrders: Array<any> = [];
        await orderData.data.result.forEach((x: any) => {
          if (x.User == tempUser.User) {
            tempOrders.push(x);
          }
        });
        await setData(tempOrders);
      } else {
        console.log("orderData.data.result", orderData.data.result);
        await setData(orderData.data.result);
      }
      tabChange(key || "1");
    }
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

  const handleUpload = (e: any) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data = e?.target?.result;
      let readData = xlsx.read(data, { type: "binary" });
      const wsName = readData.SheetNames[0];
      const ws = readData.Sheets[wsName];

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
      setData(tempData);
    };
    reader.readAsBinaryString(f);
  };

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

  const downloadLabel = (id: string) => {
    // const openInNewTab = (url:string) => {
    //   window.open(url, "_blank", "noreferrer");
    // };
    getLabel({ id })
      .then((x: any) => {
        if (x.data.status == "success") {
          // openInNewTab(`data:application/pdf;base64,${x.data.result.document}`)
          console.log(x.data.result);
          let type = "";
          if (x.data.result.format == "PNG") {
            type = "image";
          } else {
            type = "application";
          }
          setDocument(
            `data:${type}/${x.data.result.format};base64,${x.data.result.document}`
          );
          setSelectedOrderId(id);
          setFileFormat(x.data.result.format);
          setIsModalOpen(true);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  const print = async () => {
    await orderStatusChange({ id: selectedOrderId, status: "Shipped" });
    handlePrint(null, () => contentToPrint.current);
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "-", //<><input type='checkbox' /></>,
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
      title: "Dated", //<><input type='checkbox' /></>,
      key: "Order Date",
      width: 90,
      filters: [
        {
          text: "Date",
          value: "Date",
          children: data?.map((dt: any) => {
            return {
              text: dt?.PurchaseDate,
              value: dt?.PurchaseDate,
            };
          }),
        },
      ],
      filterMode: "tree",
      filterSearch: true,
      // onFilter: (value, record) => record.PurchaseDate.includes(value as string),
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
              href={`/dashboard/order?id=${data["AmazonOrderId"]}`}
              className="text-[11px] font-bold"
            >
              {data["AmazonOrderId"]}
            </Link>
            <div className="text-[10px] font-semibold text-gray-400">
              {data["BuyerAddress"]?.Name ? "Buyer Name:" : "Buyer Email:"}
            </div>
            <div className="text-[10px] font-semibold">
              {(data["BuyerAddress"]?.Name || data["BuyerInfo"]?.BuyerEmail) ??
                ""}
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              Sales Channel:
            </div>
            <div className="text-[10px] font-semibold">
              {data["SalesChannel"]}
            </div>
            <div className="text-[10px] font-semibold text-gray-400">
              Vendor:
            </div>
            <div className="text-[10px] font-semibold">
              {data["vendorName"]}
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
            {data.OrderItems.map((item: any, index: Number) => {
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
                        className="text-[10px] text-gray-500"
                        style={{ lineHeight: 1.1 }}
                      >
                        SKU:
                        <span className="font-semibold"> {item.SellerSKU}</span>
                      </div>
                      <div
                        className="text-[10px] text-gray-500 mt-1"
                        style={{ lineHeight: 1.1 }}
                      >
                        Quantity:
                        <span className="font-semibold">
                          {" "}
                          {item.QuantityOrdered}
                        </span>
                      </div>
                      <div
                        className="text-[10px] text-gray-500 mt-2"
                        style={{ lineHeight: 1.1 }}
                      >
                        Place:
                        <span
                          className={`font-semibold text-sm ${
                            item.SellerSKU?.includes("BULK")
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {" "}
                          {item.SellerSKU?.includes("BULK")
                            ? "In House"
                            : "Vendor"}
                        </span>
                      </div>
                      {item?.poNumber && (
                        <div
                          className="text-[10px] text-gray-500 mt-2"
                          style={{ lineHeight: 1.1 }}
                        >
                          PO Number:
                          <span
                            className={`font-semibold text-sm text-green-500`}
                          >
                            {" "}
                            {item?.poNumber}
                          </span>
                        </div>
                      )}
                      {item?.trackingNumber && (
                        <div
                          className="text-[10px] text-gray-500 mt-2"
                          style={{ lineHeight: 1.1 }}
                        >
                          Tracking Number:
                          <span
                            className={`font-semibold text-sm text-green-500`}
                          >
                            {" "}
                            {item?.trackingNumber}
                          </span>
                        </div>
                      )}
                      {item?.expectedDelivery && (
                        <div
                          className="text-[10px] text-gray-500 mt-2"
                          style={{ lineHeight: 1.1 }}
                        >
                          Expected Delivery:
                          <span
                            className={`font-semibold text-sm text-green-500`}
                          >
                            {" "}
                            {item?.expectedDelivery}
                          </span>
                        </div>
                      )}
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
      key: "OrderStatus",
      render: (data) => {
        return (
          <b className="blue-2-txt ">
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
        status != "Transit" && status != "delivered" && status != "Shipped"
          ? "Actions"
          : status == "Transit" || status == "Shipped"
          ? "Tracking"
          : "-",
      key: "user",
      render: (data) => {
        return (
          <>
            {status != "Transit" &&
              status != "delivered" &&
              status != "Shipped" && (
                <>
                  <div className="shipment-btn text-[11px]">
                    {orderStatus === "Inprocess" ? (
                      <div>
                        <button
                          className="shipment-btn text-[14px]"
                          onClick={() => downloadLabel(data?.id)}
                        >
                          <FaFileDownload />
                          <div>Print Label</div>
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/shipment?id=${data["AmazonOrderId"]}`}
                      >
                        <span className="no-underline text-white">
                          Buy Shipping
                        </span>
                      </Link>
                    )}
                  </div>
                </>
              )}
            {(status == "Transit" || status == "Shipped") && (
              <>
                <div className="shipment-btn text-[11px] my-2">
                  <Link
                    href={`/dashboard/tracking?id=${data["AmazonOrderId"]}&vendorName=${data["vendorName"]}`}
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
        );
      },
    },
  ];

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
        getInfo(key);
      }
    });
  };

  const tabChange = (key: string) => {
    let tempStatus = "";
    key == "1"
      ? (tempStatus = "Unshipped")
      : key == "2"
      ? (tempStatus = "Arriving")
      : key == "3"
      ? (tempStatus = "Inprocess")
      : key == "4"
      ? (tempStatus = "Shipped")
      : key == "5"
      ? (tempStatus = "Transit")
      : (tempStatus = "Delivered");

    setStatus(tempStatus);
    setOrderStatus(tempStatus);
    setKey(key);
  };

  const TableComponent = () => (
    <div className="my-4" style={{ maxHeight: 500, overflowY: "auto" }}>
      <Table
        columns={columns}
        dataSource={data?.filter((x: any) => x.OrderStatus == status)}
      />
    </div>
  );

  const tabItems = [
    {
      key: "1",
      label: "Un-Shipped",
      children: <TableComponent />,
    },
    {
      key: "2",
      label: "Arriving",
      children: <TableComponent />,
    },
    {
      key: "3",
      label: "In-Process",
      children: <TableComponent />,
    },
    {
      key: "4",
      label: "Shipped",
      children: <TableComponent />,
    },
    {
      key: "5",
      label: "In-Transit",
      children: <TableComponent />,
    },
    {
      key: "6",
      label: "Delivered",
      children: <TableComponent />,
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </Col>
        {/* <Col span={5}>
          <Input
            placeholder="Order Status"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          />
        </Col> */}
        <Col span={6}>
          <Input
            placeholder="PO Number"
            value={pONumber}
            onChange={(e) => setPONumber(e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Button
            type="primary"
            onClick={() => getInfo(key)}
            disabled={load}
            style={{ width: "100%" }}
          >
            Filter
          </Button>
        </Col>
      </Row>

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
                  style={{ width: 150 }}
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

          <Tabs defaultActiveKey={key} items={tabItems} onChange={tabChange} />
        </>
      )}

      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        centered
        footer={false}
        className="p-4"
        width={600}
      >
        <div className="flex flex-col items-center p-4">
          <div className="w-full max-w-full overflow-hidden">
            <iframe
              ref={contentToPrint}
              src={document}
              height="500"
              className="w-full flex justify-center items-center"
            />
          </div>
          <div className="flex justify-center mt-4 w-full">
            <Button className="w-full bg-green-400" onClick={print}>
              {fileFormat === "PNG" ? "Print" : "Shipped?"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Orders;
