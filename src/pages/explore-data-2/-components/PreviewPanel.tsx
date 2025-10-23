import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LabelValueTable } from '../../../components/LabelValueTable';
import { AppLink } from '../../../components/AppLink';

interface PreviewPanelProps {
  /**
   * Data for the selected row from the main table
   */
  previewItem: any;
  /**
   * Function to handle hiding
   */
  onClose: () => void;
}

/**
 * Panel to show extra information about a row in a separate panel
 * next to the `<DataTablePanel>`.
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previewItem,
  onClose,
}) => {
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    return value.toString();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        padding: 2,
        overflowY: 'auto',
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Stack direction="row">
            <Typography variant="h6" component="h3" flex={1}>
              <AppLink to="/explore-data-2/$id" params={{ id: previewItem.id }}>
                {previewItem.title || previewItem.place || 'Earthquake Event'}
              </AppLink>
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="body2">
            {previewItem.place || 'Location not available'}
          </Typography>
        </Stack>

        <Box>
          <Typography fontWeight="medium" mb={1}>
            Basic Information
          </Typography>
          <LabelValueTable
            rows={[
              { label: 'Magnitude', value: formatValue(previewItem.mag) },
              { label: 'Magnitude Type', value: previewItem.magType || 'N/A' },
              { label: 'Time', value: formatDate(previewItem.time) },
              { label: 'Updated', value: formatDate(previewItem.updated) },
              { label: 'Type', value: previewItem.type || 'N/A' },
              { label: 'Status', value: previewItem.status || 'N/A' },
            ]}
          />
        </Box>

        <Box>
          <Typography fontWeight="medium" mb={1}>
            Location Details
          </Typography>
          <LabelValueTable
            rows={[
              { label: 'Longitude', value: formatValue(previewItem.longitude) },
              { label: 'Latitude', value: formatValue(previewItem.latitude) },
              { label: 'Depth', value: `${formatValue(previewItem.depth)} km` },
              { label: 'Place', value: previewItem.place || 'N/A' },
            ]}
          />
        </Box>

        <Box>
          <Typography fontWeight="medium" mb={1}>
            Status & Alerts
          </Typography>
          <LabelValueTable
            rows={[
              { label: 'Review Status', value: previewItem.status || 'N/A' },
              {
                label: 'Tsunami Warning',
                value: previewItem.tsunami ? 'Yes' : 'No',
              },
              { label: 'Alert Level', value: previewItem.alert || 'N/A' },
              { label: 'Significance', value: formatValue(previewItem.sig) },
            ]}
          />
        </Box>

        <Box>
          <Typography fontWeight="medium" mb={1}>
            Seismic Metrics
          </Typography>
          <LabelValueTable
            rows={[
              { label: 'Felt Reports', value: formatValue(previewItem.felt) },
              { label: 'CDI', value: formatValue(previewItem.cdi) },
              { label: 'MMI', value: formatValue(previewItem.mmi) },
              {
                label: 'Number of Stations',
                value: formatValue(previewItem.nst),
              },
              { label: 'Azimuthal Gap', value: formatValue(previewItem.gap) },
              { label: 'Min Distance', value: formatValue(previewItem.dmin) },
              { label: 'RMS', value: formatValue(previewItem.rms) },
            ]}
          />
        </Box>

        <Box>
          <Typography fontWeight="medium" mb={1}>
            Network Information
          </Typography>
          <LabelValueTable
            rows={[
              { label: 'Network', value: previewItem.net || 'N/A' },
              { label: 'Code', value: previewItem.code || 'N/A' },
              { label: 'IDs', value: previewItem.ids || 'N/A' },
              { label: 'Sources', value: previewItem.sources || 'N/A' },
              { label: 'Types', value: previewItem.types || 'N/A' },
            ]}
          />
        </Box>

        <Stack direction="row" spacing={1}>
          <AppLink to="/explore-data-2/$id" params={{ id: previewItem.id }}>
            <Button variant="contained" size="small">
              View details
            </Button>
          </AppLink>
          {previewItem.url && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(previewItem.url, '_blank')}
            >
              USGS Page
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
