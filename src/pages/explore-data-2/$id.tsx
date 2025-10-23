import { createFileRoute } from '@tanstack/react-router';
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { useDetailQuery } from '../../hooks/useDetailQuery';
import { LabelValueTable } from '../../components/LabelValueTable';

export const Route = createFileRoute('/explore-data-2/$id')({
  component: DataDetailPage,
});

/**
 * Detail view for a selected row from the` <DataExplorer>` in the explore-data-2 Task Flow.
 */
function DataDetailPage() {
  const { id } = Route.useParams();

  // Define query for this page and fetch data item
  const { data } = useDetailQuery({
    // CUSTOMIZE: detail data source
    dataSource: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    // CUSTOMIZE: detail data unique ID field
    dataIdField: 'id',
    paramId: id,
    // CUSTOMIZE: query mode, 'client' or 'server'
    queryMode: 'client',
    staticParams: {
      format: 'geojson',
      limit: '1000',
      orderby: 'time',
    },
  });

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    return value.toString();
  };

  return (
    <Box>
      <PageHeader
        // CUSTOMIZE: page header field
        pageTitle={
          data ? data.title || data.place || 'Earthquake Event' : 'Loading...'
        }
        // CUSTOMIZE: breadcrumb title text
        breadcrumbTitle="Earthquake Details"
        sx={{
          marginBottom: 1,
          padding: 2,
        }}
      />
      <Container maxWidth="xl">
        <Stack spacing={3}>
          {/* Basic Information */}
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'Magnitude', value: formatValue(data?.mag) },
                    { label: 'Magnitude Type', value: data?.magType || 'N/A' },
                    { label: 'Event Type', value: data?.type || 'N/A' },
                    { label: 'Status', value: data?.status || 'N/A' },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'Time', value: formatTimestamp(data?.time) },
                    { label: 'Updated', value: formatTimestamp(data?.updated) },
                    { label: 'Time Zone', value: data?.tz || 'N/A' },
                    { label: 'Title', value: data?.title || 'N/A' },
                  ]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Location Information */}
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Location Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'Place', value: data?.place || 'N/A' },
                    { label: 'Longitude', value: formatValue(data?.longitude) },
                    { label: 'Latitude', value: formatValue(data?.latitude) },
                    {
                      label: 'Depth',
                      value: data?.depth
                        ? `${formatValue(data.depth)} km`
                        : 'N/A',
                    },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    {
                      label: 'Horizontal Error',
                      value: formatValue(data?.horizontalError),
                    },
                    {
                      label: 'Depth Error',
                      value: formatValue(data?.depthError),
                    },
                    { label: 'Mag Error', value: formatValue(data?.magError) },
                    { label: 'Mag Stations', value: formatValue(data?.magNst) },
                  ]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Alerts and Impact */}
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Alerts and Impact
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'Alert Level', value: data?.alert || 'N/A' },
                    {
                      label: 'Tsunami Warning',
                      value: data?.tsunami ? 'Yes' : 'No',
                    },
                    { label: 'Significance', value: formatValue(data?.sig) },
                    { label: 'Felt Reports', value: formatValue(data?.felt) },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'CDI (Intensity)', value: formatValue(data?.cdi) },
                    { label: 'MMI (Intensity)', value: formatValue(data?.mmi) },
                    { label: 'Alert', value: data?.alert || 'N/A' },
                  ]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seismic Measurements */}
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Seismic Measurements
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    {
                      label: 'Number of Stations',
                      value: formatValue(data?.nst),
                    },
                    { label: 'Azimuthal Gap', value: formatValue(data?.gap) },
                    { label: 'Min Distance', value: formatValue(data?.dmin) },
                    { label: 'RMS', value: formatValue(data?.rms) },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LabelValueTable
                  rows={[
                    { label: 'Network', value: data?.net || 'N/A' },
                    { label: 'Code', value: data?.code || 'N/A' },
                    { label: 'Event ID', value: data?.id || 'N/A' },
                  ]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Additional Information */}
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Additional Information
            </Typography>
            <LabelValueTable
              rows={[
                { label: 'IDs', value: data?.ids || 'N/A' },
                { label: 'Sources', value: data?.sources || 'N/A' },
                { label: 'Types', value: data?.types || 'N/A' },
                { label: 'Detail URL', value: data?.detail || 'N/A' },
              ]}
            />
            {data?.url && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  onClick={() => window.open(data.url, '_blank')}
                >
                  View on USGS Website
                </Button>
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
