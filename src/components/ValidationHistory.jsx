import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  IconButton
} from '@mui/material';
import {
  History as HistoryIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

function ValidationHistory({ history, onClear }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">
            Validierungshistorie ({history.length})
          </Typography>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            size="small"
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Button 
          onClick={onClear} 
          startIcon={<ClearIcon />}
          size="small"
          disabled={history.length === 0}
        >
          Verlauf löschen
        </Button>
      </Box>

      <Collapse in={isExpanded}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Zeitpunkt</TableCell>
                <TableCell>Datei</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Fehler</TableCell>
                <TableCell align="center">Warnungen</TableCell>
                <TableCell align="center">Größe</TableCell>
                <TableCell align="center">Dauer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(entry.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {entry.filename}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={entry.isValid ? <ValidIcon /> : <ErrorIcon />}
                      label={entry.isValid ? 'Gültig' : 'Ungültig'}
                      color={entry.isValid ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={entry.result.summary.errors}
                      color={entry.result.summary.errors > 0 ? 'error' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={entry.result.summary.warnings}
                      color={entry.result.summary.warnings > 0 ? 'warning' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatFileSize(entry.fileSize)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDuration(entry.duration)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Paper>
  );
}

export default ValidationHistory; 