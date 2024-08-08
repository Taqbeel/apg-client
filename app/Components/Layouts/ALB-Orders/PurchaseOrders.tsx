'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { getPoData } from '@/api/po';

import 'ag-grid-enterprise';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { SetFilterModule } from "@ag-grid-enterprise/set-filter";
import dayjs from 'dayjs';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  MenuModule,
  SetFilterModule,
]);

const POs = () => {

  const [shippingBox, setShippingBox] = useState([]);

  const onGridReady = useCallback(() => {
    getPoData({}).then((x) => {
      setShippingBox(x.data.result)
    })
  }, []);

  const [colDefs, setColDefs]:any = useState([
    { 
      headerName:"WH",
      width:80,
      field: "warehouse"
    },
    { 
      headerName:"Ship No.", 
      width:120,
      field: "shippernumber",
      cellRenderer:(params:any)=>{
        return (<b>{params.value}</b>)
      }
    },
    { 
      headerName:"P.O No", 
      width:120,
      field: "AlbPoCompleted.customerpo",
      cellRenderer:(params:any)=>{
        return (<b>{params.value}</b>)
      }
    },
    { 
      headerName:"Code",
      width:120,
      field: "itemcode"
    },
    { 
      headerName:"Desc",
      width:120,
      field: "description",
      cellRenderer:(params:any)=>{
        return (<span className='text-[12px] grey-txt'>{params.value}</span>)
      }
    },
    { 
      headerName:"Style",
      width:90,
      field: "style"
    },
    {
      headerName:"Color",
      flex:1,
      field: "color"
    },
    {
      headerName:"Size",
      width:90,
      field: "size"
    },
    {
      headerName:"Weight",
      width:105,
      field: "weight" 
    },
    {
      headerName:"UPC", 
      field: "upccode" ,
      width:130,
      cellRenderer:(params:any)=>{
        return (<span className='text-[12px] blue-link'>{params.value}</span>)
      }
    },
    {
      headerName:"Qty",
      width:80,
      field: "pieces" 
    },
    {
      headerName:"Price",
      width:90,
      field: "price" 
    },
    {
      headerName:"Status",
      width:110,
      field: "shipstatus" 
    },
    {
      headerName:"Dated", 
      field: "createdAt",
      valueGetter:(params:any)=>{
        return dayjs(params.value).format("DD/MM/YY - HH:mm a")
      }
      //dayjs
    },
  ]);

  const defaultColDef = useMemo(() => { 
    return {
      floatingFilter: true,
      filter: "agMultiColumnFilter"
    };
  }, []);

  return (
    <div
      className="ag-theme-quartz" // applying the Data Grid theme
      style={{ height: '73vh' }} // the Data Grid will fill the size of the parent container
    >
      <AgGridReact 
        rowData={shippingBox} 
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
      />
    </div>
  )
};

export default POs