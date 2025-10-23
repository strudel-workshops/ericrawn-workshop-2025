import { Box, Paper, Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FilterContext } from '../../components/FilterContext';
import { PageHeader } from '../../components/PageHeader';
import { DataView } from './-components/DataView';
import { DataViewHeader } from './-components/DataViewHeader';
import { FiltersPanel } from './-components/FiltersPanel';
import { PreviewPanel } from './-components/PreviewPanel';
import { FilterConfig } from '../../types/filters.types';

export const Route = createFileRoute('/explore-data/')({
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
 * Main explorer page in the explore-data Task Flow.
 * This page includes the page header, filters panel,
 * main table, and the table row preview panel.
 */
function DataExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState<any>();
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [filtersPanelPosition, setFiltersPanelPosition] = useState<
    'left' | 'right'
  >('left');

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

  return (
    <FilterContext>
      <Box>
        <PageHeader
          // CUSTOMIZE: the page title
          pageTitle="Earthquake Data Explorer"
          // CUSTOMIZE: the page description
          description="Explore earthquake events using USGS earthquake data"
          sx={{
            marginBottom: 1,
            padding: 2,
          }}
        />
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
              />
              <DataView
                filterConfigs={filterConfigs}
                searchTerm={searchTerm}
                setPreviewItem={setPreviewItem}
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
    </FilterContext>
  );
}
