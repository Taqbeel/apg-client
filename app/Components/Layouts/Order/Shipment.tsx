"use client";

import { getOrderByAPI, orderStatusChange } from "@/api/orders";
import { getRates, purchaseShipment } from "@/api/shipment";
import { LoadingOutlined } from "@ant-design/icons";
import { Col, Flex, InputNumber, Row, Select, Spin } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaShippingFast } from "react-icons/fa";

import { addresses } from "@/addresses";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CiCircleCheck } from "react-icons/ci";
import openNotification from "../../Shared/Notification";

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
  const [addressOptions, setAddressOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedAddress, setSelectedAddress] = useState<number>(0);
  const [addressFetchedFor, setAddressFetchedFor] = useState<string>("");
  const [enableShipment, setEnableShipment] = useState(false);
  const [load, setLoad] = useState(true);
  const [priceLoad, setPriceLoad] = useState(false);
  const [weight, setWeight] = useState(0);
  const [oz, setOz] = useState(0);
  const [error, setError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [dimension, setDimension] = useState({
    length: 1.0,
    width: 1.0,
    height: 1.0,
  });

  useEffect(() => {
    const address = addresses.map((ad) => {
      return {
        value: ad.id,
        label: `${ad.addressLine1}, ${
          ad.addressLine1 && ad.addressLine1 + ","
        } ${ad.city}, ${ad.stateOrRegion}, ${ad.postalCode}, ${
          ad.stateOrRegion
        }`,
      };
    });

    setAddressOptions(address);

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
        console.log("This Order", temp);
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

  const fetchRates = async () => {
    setPurchaseError("");
    setError("");

    // const address = selectedAddress !== undefined && addresses[selectedAddress];
    const address = addresses[selectedAddress];

    const shipFrom = {
      name: order?.DefaultShipFromLocationAddress?.Name,
      addressLine1: address
        ? address?.addressLine1
        : order?.DefaultShipFromLocationAddress?.AddressLine1,
      // addressLine2: address ? address?.addressLine2 : "",
      stateOrRegion: address
        ? address?.stateOrRegion
        : order?.DefaultShipFromLocationAddress?.StateOrRegion,
      city: address
        ? address?.city
        : order?.DefaultShipFromLocationAddress?.City,
      countryCode: address
        ? address?.countryCode
        : order?.DefaultShipFromLocationAddress?.CountryCode,
      postalCode: address
        ? address?.postalCode?.toString()
        : order?.DefaultShipFromLocationAddress?.PostalCode,
    };

    console.log("shipFrom", shipFrom);

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
      shipFrom,
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
            order.BuyerAddress?.Name || `AMAZON${order.AmazonOrderId}`,
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

    console.log("body", body);

    if (
      (weight < totalWeight && oz === 0) ||
      (oz < totalWeight && weight === 0)
    ) {
      setError(
        `Weight cannot be less than items total weight e.g. ${itemWeightUnit} ${totalWeight}`
      );
      return;
    }

    try {
      setEnableShipment(false);
      setPriceLoad(true);
      setRates({
        requestToken: "",
        rates: [],
      });
      await getRates(data).then((x) => {
        // console.log('response', JSON.parse(x.data.result))
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
          setAddressFetchedFor(addressOptions[selectedAddress].label);
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
    setPurchaseError("");
    let tempRate: any = rates.rates.filter((x: any) => x.isCheck == true)[0];
    console.log("tempRate", tempRate);
    let formatType: any = tempRate.supportedDocumentSpecifications.filter(
      (x: any) => x.format == "PDF" || x.format == "PNG"
      // (x: any) => x.format == "PNG"
    )[0];
    console.log("formatType", formatType);

    const payload = {
      vendorName: order?.DefaultShipFromLocationAddress?.Name,
      body: {
        requestToken: rates?.requestToken,
        rateId: tempRate?.rateId,
        requestedDocumentSpecification: {
          format: formatType.format,
          size: formatType.size,
          dpi: formatType?.printOptions[0]?.supportedDPIs[0],
          pageLayout: formatType?.printOptions[0]?.supportedPageLayouts[0],
          // pageLayout: ["DEFAULT"],
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
          tempRate?.availableValueAddedServiceGroups?.flatMap((item: any) =>
            item?.valueAddedServices
              ?.filter(
                (service: any) => service?.id === "DELIVERY_CONFIRMATION"
              )
              .map((service: any) => ({ id: service?.id }))
          ),
      }, //[{id:'DELIVERY_CONFIRMATION'}]
      OrderId: order.id,
    };
    console.log("payload.body", payload.body);
    purchaseShipment(payload).then(async (res: any) => {
      console.log("data", res.data);
      if (res.data.status == "success") {
        openNotification("Success", "Shipment bought successfully!", "green");

        await orderStatusChange({ id: order.id, status: "Inprocess" });

        router.refresh();
        // console.log(JSON.parse(res.data.result));
      } else {
        setPurchaseError(res.data?.result?.details);
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
                            {item.SellerSKU}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Order Item ID:{" "}
                          <span className="font-semibold">
                            {item.OrderItemId}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Dimensions:{" "}
                          <span className="font-semibold">
                            {`${(
                              item?.dimensions?.height?.value / 2.54
                            ).toFixed(2)}" H x ${(
                              item?.dimensions?.width?.value / 2.54
                            ).toFixed(2)}" W x ${(
                              item?.dimensions?.length?.value / 2.54
                            ).toFixed(2)}" L`}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-500">
                          Wight:{" "}
                          <span className="font-semibold">
                            {`${(item?.weight?.value * 2.20462).toFixed(2)} LB`}
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
          </Row>

          <Row style={{}}>
            <Col style={{ flex: 1, marginTop: "0.5rem" }}>
              <div>
                <span className="mr-4">Address:</span>
                <Select
                  style={{ width: "75%" }}
                  value={selectedAddress}
                  onChange={setSelectedAddress}
                  options={addressOptions}
                />
              </div>
            </Col>
            <Col style={{ width: "10rem" }}>
              <button
                className="shipment-btn text-[14px] h-full w-full"
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
            {priceLoad && <LoadingOutlined className="text-[30px] m-5" />}
            {!priceLoad && rates?.rates?.length > 0 && (
              <Col span={12}>
                <p className="text-[12px]">
                  <b>Address: {addressFetchedFor}</b>
                </p>

                <p className="text-[12px] mt-4">
                  <b>
                    Select from below shipping services
                    {" ("}
                    {rates.rates.length}
                    {")"}
                  </b>
                </p>

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
                                    {` ${rate.totalCharge.value}`.split(".")[1]}
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
              </Col>
            )}
            <Col className="p-5" span={12}>
              <div>
                {enableShipment && !order?.shipmentBought && (
                  <>
                    <button
                      className="shipment-btn text-[14px]"
                      onClick={confirmShipment}
                    >
                      <FaShippingFast />
                      <div>Buy Shipment</div>
                    </button>

                    {purchaseError && (
                      <div className="my-4">
                        <p className="text-red-500">{purchaseError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Col>
          </Row>
        </>
      )}
      {load && <Spin />}
    </>
  );
};

export default Shipment;
