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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

function ValidationResults({ results, onClear }) {
  const [expandedFile, setExpandedFile] = useState(null);

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

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'PASSED':
        return <ValidIcon color="success" />;
      case 'WARNING':
        return <WarningIcon color="warning" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'PASSED':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleFileExpand = (fileId) => {
    setExpandedFile(expandedFile === fileId ? null : fileId);
  };

  if (!results || results.length === 0) {
    return null;
  }

  const totalFiles = results.length;
  const validFiles = results.filter(r => r.isValid).length;
  const totalErrors = results.reduce((sum, r) => sum + r.result.summary.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.result.summary.warnings, 0);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Validierungsergebnisse
        </Typography>
        <Button onClick={onClear} startIcon={<ClearIcon />}>
          Ergebnisse löschen
        </Button>
      </Box>

      {/* Summary */}
      <Alert 
        severity={validFiles === totalFiles ? 'success' : 'warning'} 
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle1">
          {validFiles} von {totalFiles} Datei(en) sind gültig
        </Typography>
        <Typography variant="body2">
          Gesamt: {totalErrors} Fehler, {totalWarnings} Warnungen
        </Typography>
      </Alert>

      {/* Results Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datei</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Fehler</TableCell>
              <TableCell align="center">Warnungen</TableCell>
              <TableCell align="center">Größe</TableCell>
              <TableCell align="center">Dauer</TableCell>
              <TableCell align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <React.Fragment key={result.id}>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {result.filename}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={result.isValid ? <ValidIcon /> : <ErrorIcon />}
                      label={result.isValid ? 'Gültig' : 'Ungültig'}
                      color={result.isValid ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.result.summary.errors}
                      color={result.result.summary.errors > 0 ? 'error' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.result.summary.warnings}
                      color={result.result.summary.warnings > 0 ? 'warning' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatFileSize(result.fileSize)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDuration(result.duration)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() => handleFileExpand(result.id)}
                      endIcon={<ExpandMoreIcon 
                        sx={{ 
                          transform: expandedFile === result.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }} 
                      />}
                    >
                      {expandedFile === result.id ? 'Weniger' : 'Mehr'}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Details */}
                {expandedFile === result.id && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ bgcolor: 'grey.50', p: 0 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Detaillierte Ergebnisse für {result.filename}
                        </Typography>
                        
                        {result.result.results.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Keine detaillierten Ergebnisse verfügbar
                          </Typography>
                        ) : (
                          <List dense>
                            {result.result.results.map((item, index) => (
                              <React.Fragment key={index}>
                                <ListItem>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                                    {getSeverityIcon(item.severity)}
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Chip
                                          label={item.severity}
                                          color={getSeverityColor(item.severity)}
                                          size="small"
                                        />
                                        <Chip
                                          label={item.outcome_code}
                                          variant="outlined"
                                          size="small"
                                        />
                                      </Box>
                                      <Typography variant="body2">
                                        {item.observed || 'Keine Details verfügbar'}
                                      </Typography>
                                      {item.instance_id && (
                                        <Typography variant="caption" color="text.secondary">
                                          Instance ID: {item.instance_id}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </ListItem>
                                {index < result.result.results.length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default ValidationResults; 