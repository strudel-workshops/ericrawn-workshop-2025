import { Box, Paper, Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FilterContext } from '../../components/FilterContext';
import { PageHeader } from '../../components/PageHeader';
import { DataView } from './-components/DataView';
import { DataViewHeader } from './-components/DataViewHeader';
import { FiltersPanel } from './-components/FiltersPanel';
import { PreviewPanel } from './-components/PreviewPanel';
import { MapView } from './-components/MapView';
import { FilterConfig } from '../../types/filters.types';
import { useListQuery } from '../../hooks/useListQuery';
import { useFilters } from '../../components/FilterContext';
import { filterData } from '../../utils/filters.utils';
import { downloadCSV } from '../../utils/csv.utils';

export const Route = createFileRoute('/explore-data-2/')({
  component: DataExplorer,
});

// CUSTOMIZE: the filter definitions
const filterConfigs: FilterConfig[] = [
  {
    field: 'mag',
    label: 'Magnitude',
    operator: 'between-inclusive',
    filterComponent: 'RangeSlider',
    filterProps: {
      min: 0,
      max: 10,
      step: 0.1,
    },
    paramType: 'minmax',
    paramTypeOptions: {
      minParam: 'minmagnitude',
      maxParam: 'maxmagnitude',
    },
  },
  {
    field: 'depth',
    label: 'Depth (km)',
    operator: 'between-inclusive',
    filterComponent: 'RangeSlider',
    filterProps: {
      min: 0,
      max: 700,
      step: 10,
    },
    paramType: 'minmax',
    paramTypeOptions: {
      minParam: 'mindepth',
      maxParam: 'maxdepth',
    },
  },
  {
    field: 'type',
    label: 'Event Type',
    operator: 'contains-one-of',
    filterComponent: 'CheckboxList',
    filterProps: {
      options: [
        {
          label: 'Earthquake',
          value: 'earthquake',
        },
        {
          label: 'Quarry Blast',
          value: 'quarry blast',
        },
        {
          label: 'Explosion',
          value: 'explosion',
        },
        {
          label: 'Ice Quake',
          value: 'ice quake',
        },
        {
          label: 'Other',
          value: 'other event',
        },
      ],
    },
  },
  {
    field: 'alert',
    label: 'Alert Level',
    operator: 'contains-one-of',
    filterComponent: 'CheckboxList',
    filterProps: {
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Green',
          value: 'green',
        },
        {
          label: 'Yellow',
          value: 'yellow',
        },
        {
          label: 'Orange',
          value: 'orange',
        },
        {
          label: 'Red',
          value: 'red',
        },
      ],
    },
  },
];

/**
 * Inner component that uses FilterContext
 */
function DataExplorerContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState<any>();
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [filtersPanelPosition, setFiltersPanelPosition] = useState<
    'left' | 'right'
  >('left');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { activeFilters } = useFilters();

  // Fetch data for the map
  const { data } = useListQuery({
    activeFilters,
    dataSource: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    filterConfigs,
    offset: 0,
    page: 0,
    pageSize: 1000,
    queryMode: 'client',
    staticParams: {
      format: 'geojson',
      limit: '1000',
      orderby: 'time',
    },
  });

  const handleCloseFilters = () => {
    setShowFiltersPanel(false);
  };

  const handleToggleFilters = () => {
    setShowFiltersPanel(!showFiltersPanel);
  };

  const handleToggleFilterPosition = () => {
    setFiltersPanelPosition(filtersPanelPosition === 'left' ? 'right' : 'left');
  };

  const handleClosePreview = () => {
    setPreviewItem(null);
  };

  // Filter data for the map and table
  const filteredData = data
    ? filterData(data, activeFilters, filterConfigs, searchTerm)
    : [];

  // Further filter by brush selection if any
  const brushFilteredData =
    selectedIds.length > 0
      ? filteredData.filter((item: any) => selectedIds.includes(item.id))
      : filteredData;

  const handleDownloadCSV = () => {
    const columns = [
      'id',
      'place',
      'mag',
      'time',
      'depth',
      'latitude',
      'longitude',
      'alert',
      'type',
      'status',
      'sig',
    ];
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `earthquake-data-${timestamp}.csv`;
    downloadCSV(brushFilteredData, filename, columns);
  };

  return (
    <Box>
      <PageHeader
        // CUSTOMIZE: the page title
        pageTitle="Earthquake Data Explorer 2"
        // CUSTOMIZE: the page description
        description="Explore earthquake events using USGS earthquake data"
        sx={{
          marginBottom: 1,
          padding: 2,
        }}
      />
      <Box sx={{ marginBottom: 2 }}>
        <MapView
          data={filteredData}
          onBrushSelect={setSelectedIds}
          selectedIds={selectedIds}
        />
      </Box>
      <Box>
        <Stack direction="row">
          {showFiltersPanel && filtersPanelPosition === 'left' && (
            <Box
              sx={{
                width: '350px',
              }}
            >
              <FiltersPanel
                filterConfigs={filterConfigs}
                onClose={handleCloseFilters}
                onTogglePosition={handleToggleFilterPosition}
                position={filtersPanelPosition}
              />
            </Box>
          )}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minHeight: '600px',
              minWidth: 0,
            }}
          >
            <DataViewHeader
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onToggleFiltersPanel={handleToggleFilters}
              onDownloadCSV={handleDownloadCSV}
              selectedCount={brushFilteredData.length}
            />
            <DataView
              filterConfigs={filterConfigs}
              searchTerm={searchTerm}
              setPreviewItem={setPreviewItem}
              brushFilteredData={brushFilteredData}
            />
          </Paper>
          {previewItem && (
            <Box
              sx={{
                minWidth: '400px',
              }}
            >
              <PreviewPanel
                previewItem={previewItem}
                onClose={handleClosePreview}
              />
            </Box>
          )}
          {showFiltersPanel && filtersPanelPosition === 'right' && (
            <Box
              sx={{
                width: '350px',
              }}
            >
              <FiltersPanel
                filterConfigs={filterConfigs}
                onClose={handleCloseFilters}
                onTogglePosition={handleToggleFilterPosition}
                position={filtersPanelPosition}
              />
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

/**
 * Main explorer page in the explore-data-2 Task Flow.
 * This page includes the page header, filters panel,
 * map view, main table, and the table row preview panel.
 */
function DataExplorer() {
  return (
    <FilterContext>
      <DataExplorerContent />
    </FilterContext>
  );
}
