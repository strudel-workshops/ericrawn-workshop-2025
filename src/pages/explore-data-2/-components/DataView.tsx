import { Alert, Box, LinearProgress, Skeleton } from '@mui/material';
import { GridPaginationModel } from '@mui/x-data-grid';
import React, { useState } from 'react';
import { useFilters } from '../../../components/FilterContext';
import { SciDataGrid } from '../../../components/SciDataGrid';
import { filterData } from '../../../utils/filters.utils';
import { useListQuery } from '../../../hooks/useListQuery';
import { FilterConfig } from '../../../types/filters.types';

interface DataViewProps {
  filterConfigs: FilterConfig[];
  searchTerm: string;
  setPreviewItem: React.Dispatch<React.SetStateAction<any>>;
  brushFilteredData?: any[];
}
/**
 * Query the data rows and render as an interactive table
 */
export const DataView: React.FC<DataViewProps> = ({
  filterConfigs,
  searchTerm,
  setPreviewItem,
  brushFilteredData,
}) => {
  const { activeFilters } = useFilters();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [offset, setOffest] = useState(page * pageSize);
  // CUSTOMIZE: the unique ID field for the data source
  const dataIdField = 'id';
  // CUSTOMIZE: query mode, 'client' or 'server'
  const queryMode = 'client';

  const { isPending, isFetching, isError, data, error } = useListQuery({
    activeFilters,
    // CUSTOMIZE: the table data source
    dataSource: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    filterConfigs,
    offset,
    page,
    pageSize,
    queryMode,
    staticParams: {
      format: 'geojson',
      limit: '1000',
      orderby: 'time',
    },
  });

  const handleRowClick = (rowData: any) => {
    setPreviewItem(rowData.row);
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    // Reset page to first when the page size changes
    const newPage = model.pageSize !== pageSize ? 0 : model.page;
    const newPageSize = model.pageSize;
    const newOffset = newPage * newPageSize;
    setPage(newPage);
    setPageSize(newPageSize);
    setOffest(newOffset);
  };

  // Show a loading skeleton while the initial query is pending
  if (isPending) {
    const emptyRows = new Array(pageSize).fill(null);
    const indexedRows = emptyRows.map((row, i) => i);
    return (
      <Box
        sx={{
          padding: 2,
        }}
      >
        {indexedRows.map((row) => (
          <Skeleton key={row} height={50} />
        ))}
      </Box>
    );
  }

  // Show an error message if the query fails
  if (isError) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  // Show the data when the query completes
  // Use brushFilteredData if provided, otherwise filter the data normally
  const displayData =
    brushFilteredData ||
    filterData(data, activeFilters, filterConfigs, searchTerm);

  return (
    <>
      {isFetching && <LinearProgress variant="indeterminate" />}
      <SciDataGrid
        rows={displayData}
        pagination
        paginationMode={queryMode}
        onPaginationModelChange={handlePaginationModelChange}
        getRowId={(row) => row[dataIdField]}
        pageSizeOptions={[25, 50, 100, { value: -1, label: 'All' }]}
        // CUSTOMIZE: the table columns
        columns={[
          {
            field: 'place',
            headerName: 'Location',
            width: 300,
          },
          {
            field: 'mag',
            headerName: 'Magnitude',
            type: 'number',
            width: 120,
          },
          {
            field: 'time',
            headerName: 'Time',
            width: 200,
            valueFormatter: (value) => {
              if (!value) return '';
              return new Date(value).toLocaleString();
            },
          },
          {
            field: 'depth',
            headerName: 'Depth',
            units: 'km',
            type: 'number',
            width: 120,
          },
          {
            field: 'alert',
            headerName: 'Alert Level',
            width: 120,
          },
          {
            field: 'type',
            headerName: 'Type',
            width: 150,
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 120,
          },
          {
            field: 'sig',
            headerName: 'Significance',
            type: 'number',
            width: 130,
          },
        ]}
        disableColumnSelector
        autoHeight
        initialState={{
          pagination: { paginationModel: { page, pageSize } },
        }}
        onRowClick={handleRowClick}
      />
    </>
  );
};
