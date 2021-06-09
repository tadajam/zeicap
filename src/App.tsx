import React, { useState } from 'react';
import './App.css';
import { CSVReader } from 'react-papaparse';
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridRowId,
  GridValueGetterParams,
} from '@material-ui/data-grid';
import { Button, Typography } from '@material-ui/core';

function App() {
  const splittableField = [
    'buyAmount',
    'buyCurrency',
    'buyCurrencyAddress',
    'buyFiatAmount',
    'buyFiatCurrency',
    'sellAmount',
    'sellCurrency',
    'sellCurrencyAddress',
    'sellFiatAmount',
    'sellFiatCurrency',
  ];
  const divisibleField = [
    'buyAmount',
    'buyFiatAmount',
    'sellAmount',
    'sellFiatAmount',
  ];
  const unduplicatableField = [
    'feeAmount',
    'feeCurrency',
    'feeFiatAmount',
    'feeFiatCurrency',
  ];

  const linkableField = ['link'];

  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);

  const toCamel = (p: string): string => {
    p = p.charAt(0).toLowerCase() + p.substring(1);
    return p.replace(/ ./g, (s: string) => s.charAt(1).toUpperCase());
  };

  const onDrop = (csv: any[]) => {
    let newColumns: GridColDef[] = [];
    if (csv.length > 0) {
      newColumns = csv[0].data.map((col: string) => {
        if (linkableField.some((field) => field === toCamel(col))) {
          return {
            field: toCamel(col),
            headerName: col,
            width: (col.length + 20) ** 1.5,
            renderCell: (params: GridCellParams) => (
              <a
                href={params.value as string}
                target="_blank"
                rel="noopener noreferrer"
              >
                {params.value}
              </a>
            ),
          };
        }
        return {
          field: toCamel(col),
          headerName: col,
          width: (col.length + 20) ** 1.5,
        };
      });

      setColumns(newColumns);
    }

    if (csv.length > 1) {
      const newRows: any[] = [];
      csv.forEach((rowData: any, csvIndex: number) => {
        if (csvIndex !== 0) {
          const numberOfLines: number = rowData.data.reduce(
            (accumulator: number, colData: string) =>
              colData.split('\n').length > accumulator
                ? colData.split('\n').length
                : accumulator,
            0
          );
          for (let lineIndex = 0; lineIndex < numberOfLines; lineIndex++) {
            const row: any = {};
            rowData.data.forEach((colData: string, colDataIndex: number) => {
              row[newColumns[colDataIndex].field] = colData;

              if (newColumns[colDataIndex].field === 'date') {
                const dateArray = colData.split('/');
                row[newColumns[colDataIndex].field] =
                  dateArray[2] + '/' + dateArray[0] + '/' + dateArray[1];
              } else if (
                splittableField.some(
                  (field) => field === newColumns[colDataIndex].field
                )
              ) {
                const lines = colData.split('\n');
                if (lines.length > 1) {
                  row[newColumns[colDataIndex].field] = lines[lineIndex];
                } else if (
                  divisibleField.some(
                    (field) => field === newColumns[colDataIndex].field
                  )
                ) {
                  row[newColumns[colDataIndex].field] =
                    colData !== '' ? Number(colData) / numberOfLines : '';
                } else {
                  row[newColumns[colDataIndex].field] = colData;
                }
              } else if (
                unduplicatableField.some(
                  (field) => field === newColumns[colDataIndex].field
                )
              ) {
                if (lineIndex === 0) {
                  row[newColumns[colDataIndex].field] = colData;
                } else {
                  row[newColumns[colDataIndex].field] = '';
                }
              } else if (newColumns[colDataIndex].field === 'txHash') {
                row['id'] = colData;
                if (lineIndex !== 0) {
                  row['id'] = row['id'] + '_' + lineIndex;
                }
              }
            });
            newRows.push(row);
          }
        }
      });

      setRows(newRows);
    }
  };

  const downloadCSV = () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

    let titleRow = '';
    const fields = columns.map((col: GridColDef, colIndex: number) => {
      if (colIndex !== 0) {
        titleRow += ',';
      }
      titleRow += col.headerName;
      return col.field;
    });

    const csvData: string[] = [titleRow];

    rows.forEach((row) => {
      let bodyRow = '';
      fields.forEach((field: string, fieldIndex: number) => {
        if (fieldIndex !== 0) {
          bodyRow += ',';
        }
        if (row[field].toString().indexOf(',') !== -1) {
          bodyRow += '"' + row[field].toString().replace(/"/g, '""') + '"';
        } else {
          bodyRow += row[field];
        }
      });
      csvData.push(bodyRow);
    });

    const blob = new Blob([bom, csvData.join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const Y = date.getFullYear();
    const M = ('00' + (date.getMonth() + 1)).slice(-2);
    const D = ('00' + date.getDate()).slice(-2);
    const h = ('00' + date.getHours()).slice(-2);
    const m = ('00' + date.getMinutes()).slice(-2);
    const s = ('00' + date.getSeconds()).slice(-2);
    a.download = Y + M + D + h + m + s + 'formatted.csv';
    const clickHandler = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
  };

  const getSlogan = () => {
    var slogans = [
      '納税思想の高揚',
      '自主納税の推進',
      '納税貯蓄',
      '税を考える',
      '確定申告',
      'ぜい ぜい ぜい ぜい ぜい ぜい ぜい ぜい ぜい ぜい ぜい',
      '笑顔で納税',
      '納税義務',
    ];
    return slogans[Math.floor(Math.random() * slogans.length)];
  };

  return (
    <div className="App">
      <Typography variant="h3">{getSlogan()}</Typography>
      <div style={{ height: 800, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={50}
          checkboxSelection
          onSelectionModelChange={(newSelection) => {
            setSelectionModel(newSelection.selectionModel);
            console.log(newSelection.selectionModel);
          }}
          selectionModel={selectionModel}
        />
      </div>
      <CSVReader
        onDrop={onDrop}
        onError={(e) => console.log(e)}
        addRemoveButton
        onRemoveFile={() => {
          setRows([]);
        }}
      >
        <span>Drop CSV file</span>
      </CSVReader>
      <Button variant="contained" color="primary" onClick={downloadCSV}>
        Download CSV
      </Button>
    </div>
  );
}

export default App;
