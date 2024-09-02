"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderByAPI } from "@/api/orders";
import { getRates, purchaseShipment, getLabel } from "@/api/shipment";
import { Col, Row, Flex, Select, Spin, InputNumber, Modal } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { FaShippingFast, FaFileDownload } from "react-icons/fa";
import { useRouter } from "next/navigation";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import openNotification from "../../Shared/Notification";
import { CiCircleCheck } from "react-icons/ci";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const Shipment = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder]: any = useState({});
  const [rates, setRates] = useState({
    requestToken: "",
    rates: [],
  });
  const [enableShipment, setEnableShipment] = useState(false);
  const [load, setLoad] = useState(true);
  const [priceLoad, setPriceLoad] = useState(false);
  const [weight, setWeight] = useState(0);
  const [oz, setOz] = useState(0);
  const [error, setError] = useState("");
  const [dimension, setDimension] = useState({
    length: 1.0,
    width: 1.0,
    height: 1.0,
  });

  const [document, setDocument]: any = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOk = () => setIsModalOpen(false);
  const handleCancel = () => setIsModalOpen(false);

  useEffect(() => {
    const id: any = searchParams.get("id");
    fetchOrderData(id);
  }, []);

  const fetchOrderData = (id: string) => {
    setLoad(true);
    // setRates([])
    if (Object.keys(order).length == 0) {
      getOrderByAPI({
        id: id,
      }).then(async (x) => {
        let temp = { ...x.data.result };
        temp?.OrderItems?.forEach((x: any) => {
          x.qty = x.QuantityOrdered;
        });

        setOrder(temp);
        setLoad(false);
      });
    }
  };

  const getQtyList = (qty: number) => {
    let tempQty = qty;
    let qtyList = [];
    while (tempQty >= 0) {
      qtyList.push({ label: tempQty, value: tempQty });
      tempQty = tempQty - 1;
    }
    return qtyList.reverse();
  };

  const setQuantity = (value: number, orderItem: any) => {
    let tempOrderItems = [...order.OrderItems];
    const index = tempOrderItems.findIndex((x) => x.id == orderItem.id);
    tempOrderItems[index].qty = value;
    setOrder({
      ...order,
      OrderItems: tempOrderItems,
    });
  };

  const fetchRates = () => {
    setError("");

    let totalWeight = 0;

    const itemWeightValue = weight !== 0 ? 0.1 : 1.6; // Determine weight based on condition
    const itemWeightUnit = weight !== 0 ? "POUND" : "OUNCE";

    const items = order.OrderItems.filter((x: any) => {
      return x.qty > 0;
    }).map((x: any) => {
      // Calculate the total weight for each item (item weight * quantity)
      totalWeight += itemWeightValue * x.qty;

      return {
        itemValue: {
          value: Number(x.ItemPriceAmount),
          unit: "USD",
        },
        itemIdentifier: x.OrderItemId,
        quantity: x.qty,
        weight: {
          value: itemWeightValue,
          unit: itemWeightUnit,
        },
        isHazmat: false,
      };
    });

    let body = {
      shipTo: {
        name: order.BuyerAddress?.Name || "",
        addressLine1: order?.BuyerAddress?.AddressLine1,
        stateOrRegion: order?.BuyerAddress?.StateOrRegion,
        city: order?.BuyerAddress?.City,
        countryCode: order?.BuyerAddress?.CountryCode,
        postalCode: order?.BuyerAddress?.PostalCode,
        // phoneNumber: order?.BuyerInfo?.Phone?.slice(3,15),
      },
      shipFrom: {
        name: order?.DefaultShipFromLocationAddress?.Name,
        addressLine1: order?.DefaultShipFromLocationAddress?.AddressLine1,
        // addressLine2: "Suite 103",
        stateOrRegion: order?.DefaultShipFromLocationAddress?.StateOrRegion,
        city: order?.DefaultShipFromLocationAddress?.City,
        countryCode: order?.DefaultShipFromLocationAddress?.CountryCode,
        postalCode: order?.DefaultShipFromLocationAddress?.PostalCode,

        // stateOrRegion: "NJ",
        // addressLine1: "36 jaime court",
        // postalCode: "08857",
        // city: "OLD BRIDGE",
        // countryCode: "US",
        // name: "HIGH END FASHION",
      },
      packages: [
        {
          dimensions: {
            ...dimension,
            unit: "INCH",
          },
          weight: {
            value: weight != 0 ? weight : oz,
            unit: weight != 0 ? "POUND" : "OUNCE",
          },
          insuredValue: {
            value: 0,
            unit: "USD",
          },
          isHazmat: false,
          sellerDisplayName: order?.DefaultShipFromLocationAddress?.Name, //order?.BuyerInfo?.Name,
          charges: [
            {
              amount: {
                value: parseFloat(order.OrderTotal.Amount),
                unit: "USD",
              },
              chargeType: "TAX",
            },
          ],
          packageClientReferenceId:
            order?.BuyerInfo?.Name || `AMAZON${order.AmazonOrderId}`,
          items: items,
        },
      ],
      channelDetails: {
        channelType: "AMAZON",
        amazonOrderDetails: {
          orderId: order.AmazonOrderId,
        },
      },
    };

    const data = {
      vendorName: order?.DefaultShipFromLocationAddress?.Name,
      body,
    };

    if (
      (weight < totalWeight && oz === 0) ||
      (oz < totalWeight && weight === 0)
    ) {
      setError(
        `Weight cannot be less than items total weight e.g. ${itemWeightUnit} ${totalWeight}`
      );
      return;
    }

    setPriceLoad(true);

    try {
      getRates(data).then((x) => {
        // console.log('responce', JSON.parse(x.data.result))
        if (x.data.status == "success") {
          let temp = JSON.parse(x.data.result)?.payload?.rates.map(
            (rate: any) => {
              return { ...rate, isCheck: false };
            }
          );
          setRates({
            ...JSON.parse(x.data.result).payload,
            rates: temp.sort(
              (a: any, b: any) => a.totalCharge.value - b.totalCharge.value
            ),
          });
        } else {
          setError(
            `Some data is missing from order therefore unable to fetch shipping rates`
          );
        }
      });
    } catch (error) {
      console.log(error);
      setError(
        `Some data is missing from order therefore unable to fetch shipping rates`
      );
    } finally {
      setPriceLoad(false);
    }
  };

  const confirmShipment = () => {
    let tempRate: any = rates.rates.filter((x: any) => x.isCheck == true)[0];
    console.log(tempRate);
    let formatType: any = tempRate.supportedDocumentSpecifications.filter(
      (x: any) => x.format == "PDF" || x.format == "PNG"
    )[0];
    const payload = {
      body: {
        requestToken: rates?.requestToken,
        rateId: tempRate?.rateId,
        requestedDocumentSpecification: {
          format: formatType.format,
          size: formatType.size,
          pageLayout: formatType?.printOptions[0]?.supportedPageLayouts[0],
          needFileJoining:
            formatType?.printOptions[0]?.supportedFileJoiningOptions[0],
          requestedDocumentTypes:
            formatType?.printOptions[0]?.supportedDocumentDetails.map(
              (x: any) => {
                return x.name;
              }
            ),
        },
        requestedValueAddedServices:
          tempRate.availableValueAddedServiceGroups.map((x: any) => {
            return { id: x.groupId };
          }),
      }, //[{id:'DELIVERY_CONFIRMATION'}]
      OrderId: order.id,
    };
    console.log(payload.body);
    // purchaseShipment(payload).then((res:any) => {
    //   console.log(res)
    //   if(res.data.status=="success"){
    //     openNotification("Success", "Shipment bought successfully!", "green");
    //     router.refresh()
    //     // console.log(JSON.parse(res.data.result));
    //   }
    // });
  };

  const downloadLabel = () => {
    // const openInNewTab = (url:string) => {
    //   window.open(url, "_blank", "noreferrer");
    // };
    getLabel({
      id: order.id,
    }).then((x: any) => {
      if (x.data.status == "success") {
        // openInNewTab(`data:application/pdf;base64,${x.data.result.document}`)
        console.log(x.data.result.format);
        let type = "";
        if (x.data.result.format == "PNG") {
          type = "image";
        } else {
          type = "application";
        }
        setDocument(
          `data:${type}/${x.data.result.format};base64,${x.data.result.document}`
        );
        setIsModalOpen(true);
      }
    });
  };

  return (
    <>
      {!load && (
        <>
          <Row justify="start">
            <Col span={24} className="text-[20px]">
              <Flex gap={"10px"} justify="text-end">
                <div className=" font-semibold">Buy Shipping</div>
                <div>
                  - Order ID: #{" "}
                  <span className="text-gray-400">{order.AmazonOrderId}</span>
                </div>
              </Flex>
              <hr className="my-2" />
            </Col>
          </Row>
          <Row className="my-2">
            <Flex gap={"10px"}>
              {order.OrderItems.map((item: any) => {
                return (
                  <div key={item?.id} className="shipping-item-box">
                    <Flex gap={"10px"}>
                      <img src={item.image} className="shipping-item-img" />
                      <div>
                        <div className="text-[12px] text-gray-500">
                          ASIN:{" "}
                          <span className="font-semibold"> {item.ASIN} </span>
                        </div>
                        <div className="text-[12px] text-gray-500">
                          SKU:{" "}
                          <span className="font-semibold">
                            {" "}
                            {item.SellerSKU}{" "}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Order Item ID:{" "}
                          <span className="font-semibold">
                            {" "}
                            {item.OrderItemId}{" "}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="mx-2">Quantity:</span>
                          <Select
                            style={{ width: 60 }}
                            value={item.qty}
                            onChange={(e) => setQuantity(e, item)}
                            options={getQtyList(item.QuantityOrdered)}
                          />
                        </div>
                      </div>
                    </Flex>
                  </div>
                );
              })}
            </Flex>
          </Row>
          <hr className="my-3" />
          <Row>
            <Col className="py-4 mr-4">
              <p>
                <b>Dimension/Weight:</b>
              </p>
            </Col>
            <Col span={6}>
              <Flex gap={5}>
                <div>
                  Length:<b> {"(in)"}</b>
                  <InputNumber
                    value={dimension.length}
                    onChange={(e) =>
                      setDimension({ ...dimension, length: Number(e) })
                    }
                    min={0.1}
                  />
                </div>
                <div>
                  Height:<b> {"(in)"}</b>
                  <InputNumber
                    value={dimension.height}
                    onChange={(e) =>
                      setDimension({ ...dimension, height: Number(e) })
                    }
                    min={0.1}
                  />
                </div>
                <div>
                  Width:<b> {"(in)"}</b>
                  <InputNumber
                    value={dimension.width}
                    onChange={(e) =>
                      setDimension({ ...dimension, width: Number(e) })
                    }
                    min={0.1}
                  />
                </div>
              </Flex>
            </Col>
            <Col span={2}></Col>
            <Col>
              <Flex gap={4}>
                <div>
                  Weight <b> {"(lb)"}</b>
                  <br />
                  <InputNumber
                    value={weight}
                    onChange={(e) => {
                      setOz(0);
                      setWeight(Number(e));
                    }}
                  />
                </div>
                <div>
                  Weight <b> {"(oz)"}</b>
                  <br />
                  <InputNumber
                    value={oz}
                    onChange={(e) => {
                      setWeight(0);
                      setOz(Number(e));
                    }}
                  />
                </div>
              </Flex>
            </Col>

            <Col className="mx-4">
              <br />
              <button
                className="shipment-btn text-[14px]"
                onClick={fetchRates}
                disabled={priceLoad}
              >
                {!priceLoad ? (
                  "Get Rates"
                ) : (
                  <LoadingOutlined className="mx-5" />
                )}
              </button>
            </Col>
            <Col className="mx-2">
              <br />
              {order.shipmentBought && (
                <button
                  className="shipment-btn text-[14px]"
                  onClick={downloadLabel}
                >
                  <FaFileDownload />
                  <div>Download Label</div>
                </button>
              )}
            </Col>
          </Row>

          {error && (
            <div className="my-4 w-full">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}
          <hr className="mt-3 mb-2" />
          <Row>
            {order.shipmentBought && (
              <>
                <div className="already-bought center">
                  Shipment Already Bought <CiCircleCheck />
                </div>
              </>
            )}
            {rates.rates.length != 0 && (
              <Col span={12}>
                {rates.rates.length > 0 && (
                  <p className="text-[12px]">
                    <b>
                      Select from below shipping services
                      {" ("}
                      {rates.rates.length}
                      {")"}
                    </b>
                  </p>
                )}
                {priceLoad && <LoadingOutlined className="text-[30px] m-5" />}
                {!priceLoad && (
                  <Row style={{ maxHeight: "40vh", overflowY: "auto" }}>
                    <Col span={23}>
                      <div className="mt-1">
                        {rates.rates.map((rate: any, index) => {
                          return (
                            <div
                              key={index}
                              className={
                                rate.isCheck ? "checked-rate-row" : "rate-row"
                              }
                              onClick={() => {
                                let temp: any = rates.rates.map((rate: any) => {
                                  return { ...rate, isCheck: false };
                                });
                                temp[index].isCheck = true;
                                setRates({ ...rates, rates: temp });
                                if (!enableShipment) {
                                  setEnableShipment(true);
                                }
                              }}
                            >
                              <div>
                                <p>
                                  <b>{rate.serviceName}</b>
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="text-[18px]">
                                    {`$${rate.totalCharge.value}`.split(".")[0]}
                                  </span>
                                  <span
                                    className="text-[11px]"
                                    style={{ position: "relative", bottom: 5 }}
                                  >
                                    <span>
                                      {
                                        ` ${rate.totalCharge.value}`.split(
                                          "."
                                        )[1]
                                      }
                                    </span>
                                  </span>
                                </p>
                                <p className="text-gray-400">
                                  {dayjs
                                    .tz(
                                      rate.promise.deliveryWindow.end,
                                      "America/Toronto"
                                    )
                                    .format("ddd, MMM DD")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                )}
              </Col>
            )}
            <Col className="p-5">
              {enableShipment && !order?.shipmentBought && (
                <button
                  className="shipment-btn text-[14px]"
                  onClick={confirmShipment}
                >
                  <FaShippingFast />
                  <div>Buy Shipment</div>
                </button>
              )}
            </Col>
          </Row>
        </>
      )}
      {load && <Spin />}
      <Modal
        title="Basic Modal"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        centered
        footer={false}
        width={540}
      >
        <h1>Hello</h1>
        <div className="center">
          <embed src={document} height={500} width={500} />
        </div>
      </Modal>
    </>
  );
};

export default Shipment;
