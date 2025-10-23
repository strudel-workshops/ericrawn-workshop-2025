import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Card, CardContent } from '@mui/material';
import { json } from 'd3-fetch';

interface MapViewProps {
  data: any[];
  onBrushSelect?: (selectedIds: string[]) => void;
  selectedIds?: string[];
}

interface HoverInfo {
  x: number;
  y: number;
  data: any;
}

interface BrushSelection {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Helper functions
const createSVGElement = (
  type: string,
  attributes?: Record<string, string>
): SVGElement => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', type);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
};

const getRelativeMousePosition = (e: MouseEvent, element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

const getMagnitudeColor = (mag: number): string => {
  if (mag >= 5) return '#f44336'; // red for large
  if (mag >= 3) return '#ff9800'; // orange for medium
  return '#4caf50'; // green for small
};

const createProjectionFunction = (
  width: number,
  height: number,
  lonMin: number,
  lonMax: number,
  latMin: number,
  latMax: number
) => {
  return (lon: number, lat: number) => {
    const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
    const y = height - ((lat - latMin) / (latMax - latMin)) * height;
    return { x, y };
  };
};

/**
 * Map view component to display earthquake locations on a US map
 */
export const MapView: React.FC<MapViewProps> = ({
  data,
  onBrushSelect,
  selectedIds = [],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [brushing, setBrushing] = useState(false);
  const [brushSelection, setBrushSelection] = useState<BrushSelection | null>(
    null
  );
  const dataPointsRef = useRef<Map<SVGCircleElement, any>>(new Map());
  const brushingRef = useRef(false);
  const brushSelectionRef = useRef<BrushSelection | null>(null);

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    const loadMapAndData = async () => {
      try {
        // Clear existing content
        mapRef.current!.innerHTML = '';

        // Create SVG map with proper aspect ratio
        const containerWidth = mapRef.current!.clientWidth || 800;

        // US bounds (approximate)
        const lonMin = -125;
        const lonMax = -66;
        const latMin = 24;
        const latMax = 50;

        // Calculate proper aspect ratio
        // At US latitudes (~38°), we need to apply cosine correction
        const centerLat = (latMin + latMax) / 2;
        const latRange = latMax - latMin;
        const lonRange = lonMax - lonMin;

        // Apply cosine correction for latitude
        const aspectRatio =
          (lonRange * Math.cos((centerLat * Math.PI) / 180)) / latRange;

        // Calculate dimensions maintaining aspect ratio
        const width = containerWidth;
        const height = width / aspectRatio;

        const svg = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.backgroundColor = '#e3f2fd';
        svg.style.maxHeight = '600px';
        svg.style.cursor = 'crosshair';
        svgRef.current = svg;

        // Projection function
        const project = createProjectionFunction(
          width,
          height,
          lonMin,
          lonMax,
          latMin,
          latMax
        );

        // Fetch US states GeoJSON from public CDN
        const geoData: any = await json(
          'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
        );

        // Draw US states from GeoJSON
        if (geoData && geoData.features) {
          geoData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
              const statePath = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
              );
              let pathData = '';

              const drawCoordinates = (
                coords: any,
                isFirst: boolean = true
              ) => {
                if (
                  Array.isArray(coords[0]) &&
                  typeof coords[0][0] === 'number'
                ) {
                  // This is a simple polygon
                  coords.forEach((point: number[], i: number) => {
                    const [lon, lat] = point;
                    const projected = project(lon, lat);
                    if (i === 0 && isFirst) {
                      pathData += `M ${projected.x} ${projected.y} `;
                    } else {
                      pathData += `L ${projected.x} ${projected.y} `;
                    }
                  });
                  pathData += 'Z ';
                } else {
                  // This is a multi-polygon or nested structure
                  coords.forEach((subCoords: any, i: number) => {
                    drawCoordinates(subCoords, i === 0 && isFirst);
                  });
                }
              };

              if (feature.geometry.type === 'Polygon') {
                drawCoordinates(feature.geometry.coordinates[0]);
              } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach((polygon: any) => {
                  drawCoordinates(polygon[0]);
                });
              }

              statePath.setAttribute('d', pathData);
              statePath.setAttribute('fill', '#f0f4f8');
              statePath.setAttribute('stroke', '#1976d2');
              statePath.setAttribute('stroke-width', '1');
              svg.appendChild(statePath);
            }
          });
        }

        // Plot earthquake points
        data.forEach((earthquake) => {
          const lon = earthquake.longitude;
          const lat = earthquake.latitude;
          const mag = earthquake.mag || 0;

          if (
            lon >= lonMin &&
            lon <= lonMax &&
            lat >= latMin &&
            lat <= latMax
          ) {
            const { x, y } = project(lon, lat);

            // Size based on magnitude
            const radius = Math.max(2, mag * 2);

            const color = getMagnitudeColor(mag);

            const circle = createSVGElement('circle', {
              cx: x.toString(),
              cy: y.toString(),
              r: radius.toString(),
              fill: color,
              'fill-opacity': '0.6',
              stroke: '#000',
              'stroke-width': '0.5',
            }) as SVGCircleElement;
            circle.style.cursor = 'pointer';
            circle.style.transition = 'all 0.2s ease';

            // Add hover interaction
            circle.addEventListener('mouseenter', (e) => {
              circle.setAttribute('fill-opacity', '1');
              circle.setAttribute('stroke-width', '2');
              if (mapRef.current) {
                const pos = getRelativeMousePosition(e, mapRef.current);
                setHoverInfo({ ...pos, data: earthquake });
              }
            });

            circle.addEventListener('mousemove', (e) => {
              if (mapRef.current) {
                const pos = getRelativeMousePosition(e, mapRef.current);
                setHoverInfo({ ...pos, data: earthquake });
              }
            });

            circle.addEventListener('mouseleave', () => {
              circle.setAttribute('fill-opacity', '0.6');
              circle.setAttribute('stroke-width', '0.5');
              setHoverInfo(null);
            });

            // Store reference to data point
            dataPointsRef.current.set(circle, earthquake);

            svg.appendChild(circle);
          }
        });

        // Add legend (fixed position, not transformed)
        const legendX = width - 130;
        const legendY = height - 100;

        const legendGroup = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g'
        );
        legendGroup.setAttribute('class', 'fixed-legend');

        // Legend background
        const legendBg = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        legendBg.setAttribute('x', (legendX - 5).toString());
        legendBg.setAttribute('y', (legendY - 5).toString());
        legendBg.setAttribute('width', '120');
        legendBg.setAttribute('height', '80');
        legendBg.setAttribute('fill', 'white');
        legendBg.setAttribute('fill-opacity', '0.9');
        legendBg.setAttribute('stroke', '#000');
        legendGroup.appendChild(legendBg);

        // Legend title
        const legendTitle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );
        legendTitle.setAttribute('x', legendX.toString());
        legendTitle.setAttribute('y', (legendY + 10).toString());
        legendTitle.setAttribute('font-size', '12');
        legendTitle.setAttribute('font-weight', 'bold');
        legendTitle.textContent = 'Magnitude';
        legendGroup.appendChild(legendTitle);

        // Legend items
        const legendItems = [
          { label: '< 3.0', color: '#4caf50', y: legendY + 30 },
          { label: '3.0 - 5.0', color: '#ff9800', y: legendY + 50 },
          { label: '> 5.0', color: '#f44336', y: legendY + 70 },
        ];

        legendItems.forEach((item) => {
          const circle = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'circle'
          );
          circle.setAttribute('cx', (legendX + 5).toString());
          circle.setAttribute('cy', item.y.toString());
          circle.setAttribute('r', '5');
          circle.setAttribute('fill', item.color);
          legendGroup.appendChild(circle);

          const text = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
          );
          text.setAttribute('x', (legendX + 15).toString());
          text.setAttribute('y', (item.y + 4).toString());
          text.setAttribute('font-size', '11');
          text.textContent = item.label;
          legendGroup.appendChild(text);
        });

        svg.appendChild(legendGroup);
        mapRef.current!.appendChild(svg);

        // Add brush selection event handlers after SVG is in DOM
        const handleMouseDown = (e: MouseEvent) => {
          if (!mapRef.current) return;
          const { x, y } = getRelativeMousePosition(e, mapRef.current);
          brushingRef.current = true;
          brushSelectionRef.current = {
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
          };
          setBrushing(true);
          setBrushSelection({ startX: x, startY: y, currentX: x, currentY: y });
        };

        const handleMouseMove = (e: MouseEvent) => {
          if (
            brushingRef.current &&
            brushSelectionRef.current &&
            mapRef.current
          ) {
            const { x, y } = getRelativeMousePosition(e, mapRef.current);
            brushSelectionRef.current = {
              ...brushSelectionRef.current,
              currentX: x,
              currentY: y,
            };
            setBrushSelection({ ...brushSelectionRef.current });
          }
        };

        const handleMouseUp = () => {
          if (
            brushingRef.current &&
            brushSelectionRef.current &&
            mapRef.current
          ) {
            // Get SVG position relative to container to adjust coordinates
            const svgRect = svg.getBoundingClientRect();
            const containerRect = mapRef.current.getBoundingClientRect();
            const svgOffsetX = svgRect.left - containerRect.left;
            const svgOffsetY = svgRect.top - containerRect.top;

            // Calculate selected points (adjusting for SVG offset)
            const minX =
              Math.min(
                brushSelectionRef.current.startX,
                brushSelectionRef.current.currentX
              ) - svgOffsetX;
            const maxX =
              Math.max(
                brushSelectionRef.current.startX,
                brushSelectionRef.current.currentX
              ) - svgOffsetX;
            const minY =
              Math.min(
                brushSelectionRef.current.startY,
                brushSelectionRef.current.currentY
              ) - svgOffsetY;
            const maxY =
              Math.max(
                brushSelectionRef.current.startY,
                brushSelectionRef.current.currentY
              ) - svgOffsetY;

            const selected: string[] = [];
            dataPointsRef.current.forEach((earthquake, circle) => {
              const cx = parseFloat(circle.getAttribute('cx') || '0');
              const cy = parseFloat(circle.getAttribute('cy') || '0');
              const radius = parseFloat(circle.getAttribute('r') || '0');

              // Check if circle intersects with selection box (including radius)
              const intersects =
                cx + radius >= minX &&
                cx - radius <= maxX &&
                cy + radius >= minY &&
                cy - radius <= maxY;

              if (intersects) {
                selected.push(earthquake.id);
              }
            });

            if (onBrushSelect) {
              onBrushSelect(selected);
            }
          }
          brushingRef.current = false;
          brushSelectionRef.current = null;
          setBrushing(false);
          setBrushSelection(null);
        };

        svg.addEventListener('mousedown', handleMouseDown);
        svg.addEventListener('mousemove', handleMouseMove);
        svg.addEventListener('mouseup', handleMouseUp);
        svg.addEventListener('mouseleave', handleMouseUp);

        return () => {
          svg.removeEventListener('mousedown', handleMouseDown);
          svg.removeEventListener('mousemove', handleMouseMove);
          svg.removeEventListener('mouseup', handleMouseUp);
          svg.removeEventListener('mouseleave', handleMouseUp);
        };
      } catch (error) {
        // console.error('Error loading map data:', error);
        // Fallback to simple rectangle if map loading fails
        const containerWidth = mapRef.current!.clientWidth || 800;
        const width = containerWidth;
        const height = 500;
        const svg = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.backgroundColor = '#e3f2fd';

        const outline = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        outline.setAttribute('x', '0');
        outline.setAttribute('y', '0');
        outline.setAttribute('width', width.toString());
        outline.setAttribute('height', height.toString());
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', '#1976d2');
        outline.setAttribute('stroke-width', '2');
        svg.appendChild(outline);

        mapRef.current!.appendChild(svg);
      }
    };

    const cleanup = loadMapAndData();

    // Cleanup event listeners on unmount
    return () => {
      setHoverInfo(null);
      dataPointsRef.current.clear();
      cleanup?.then((fn) => fn?.());
    };
  }, [data]);

  // Highlight selected points
  useEffect(() => {
    dataPointsRef.current.forEach((earthquake, circle) => {
      if (selectedIds.includes(earthquake.id)) {
        circle.setAttribute('stroke', '#000');
        circle.setAttribute('stroke-width', '3');
      } else {
        circle.setAttribute('stroke', '#000');
        circle.setAttribute('stroke-width', '0.5');
      }
    });
  }, [selectedIds]);

  // Calculate tooltip position to keep it within bounds
  const getTooltipPosition = () => {
    if (!hoverInfo || !mapRef.current || !tooltipRef.current) {
      return null;
    }

    const mapRect = mapRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Check if tooltip has been measured (width > 0)
    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      return null;
    }

    const offset = 10;
    let left = hoverInfo.x + offset;
    let top = hoverInfo.y + offset;

    // Check right boundary
    if (left + tooltipRect.width > mapRect.width) {
      left = hoverInfo.x - tooltipRect.width - offset;
    }

    // Check bottom boundary
    if (top + tooltipRect.height > mapRect.height) {
      top = hoverInfo.y - tooltipRect.height - offset;
    }

    // Ensure it doesn't go negative
    left = Math.max(offset, left);
    top = Math.max(offset, top);

    return { left, top };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Paper sx={{ padding: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Earthquake Map - United States
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Showing {data?.length || 0} earthquakes
      </Typography>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
        }}
      >
        <Box
          ref={mapRef}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
        {brushSelection && brushing && (
          <Box
            sx={{
              position: 'absolute',
              left: Math.min(brushSelection.startX, brushSelection.currentX),
              top: Math.min(brushSelection.startY, brushSelection.currentY),
              width: Math.abs(brushSelection.currentX - brushSelection.startX),
              height: Math.abs(brushSelection.currentY - brushSelection.startY),
              border: '2px dashed #1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
        )}
        {hoverInfo && (
          <Card
            ref={tooltipRef}
            sx={{
              position: 'absolute',
              left: tooltipPosition?.left ?? 0,
              top: tooltipPosition?.top ?? 0,
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: 3,
              minWidth: 250,
              maxWidth: 300,
              opacity: tooltipPosition ? 1 : 0,
              transition: 'opacity 0.1s ease-in-out',
            }}
          >
            <CardContent
              sx={{ padding: 2, '&:last-child': { paddingBottom: 2 } }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {hoverInfo.data.place || 'Unknown Location'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2">
                  <strong>Magnitude:</strong>{' '}
                  {hoverInfo.data.mag?.toFixed(2) || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Depth:</strong>{' '}
                  {hoverInfo.data.depth?.toFixed(1) || 'N/A'} km
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong>{' '}
                  {hoverInfo.data.latitude?.toFixed(4)},{' '}
                  {hoverInfo.data.longitude?.toFixed(4)}
                </Typography>
                {hoverInfo.data.time && (
                  <Typography variant="body2">
                    <strong>Time:</strong>{' '}
                    {new Date(hoverInfo.data.time).toLocaleString()}
                  </Typography>
                )}
                {hoverInfo.data.type && (
                  <Typography variant="body2">
                    <strong>Type:</strong> {hoverInfo.data.type}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Paper>
  );
};
