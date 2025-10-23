import React from 'react';
import { IconButton, Tooltip, Stack } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { FilterField } from '../../../components/FilterField';
import { Filters } from '../../../components/Filters';
import { FilterConfig } from '../../../types/filters.types';

interface FiltersPanelProps {
  filterConfigs: FilterConfig[];
  onClose: () => any;
  onTogglePosition: () => void;
  position: 'left' | 'right';
}

/**
 * Main filters panel in the explore-data Task Flow.
 * Filters are generated based on the configurations in definitions.filters.main.
 * The input values will filter data in the main table.
 */
export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filterConfigs,
  onClose,
  onTogglePosition,
  position,
}) => {
  const customHeader = (
    <Stack direction="row" spacing={1} alignItems="center">
      <span>Filters</span>
      <Tooltip
        title={`Move filters to ${position === 'left' ? 'right' : 'left'}`}
      >
        <IconButton size="small" onClick={onTogglePosition}>
          <SwapHorizIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <Filters
      grouped={false}
      onClose={onClose}
      header={customHeader}
      sx={{
        border: 'none',
      }}
    >
      {filterConfigs.map((f, i) => (
        <FilterField
          key={`${f.field}-${i}`}
          field={f.field}
          label={f.label}
          operator={'contains'}
          filterComponent={f.filterComponent}
          filterProps={f.filterProps}
        />
      ))}
    </Filters>
  );
};
