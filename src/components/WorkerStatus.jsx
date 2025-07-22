import React from 'react';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Typography
} from '@mui/material';
import {
  CheckCircle as ReadyIcon,
  Error as ErrorIcon,
  HourglassEmpty as LoadingIcon
} from '@mui/icons-material';

function WorkerStatus({ isReady, error, progress }) {
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon />
          <Typography variant="body1">Worker-Fehler: {error}</Typography>
        </Box>
      </Alert>
    );
  }

  if (!isReady) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LoadingIcon />
          <Typography variant="body1">
            Worker wird initialisiert... {progress?.progress || 0}%
          </Typography>
        </Box>
        {progress && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {getStageMessage(progress.stage)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress.progress || 0} 
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Chip
        icon={<ReadyIcon />}
        label="WebAssembly Runtime bereit"
        color="success"
        variant="outlined"
      />
    </Box>
  );
}

function getStageMessage(stage) {
  switch (stage) {
    case 'loading_pyodide':
      return 'Lade WebAssembly Runtime (Pyodide)...';
    case 'loading_packages':
      return 'Installiere Python-Packages...';
    case 'loading_validation_code':
      return 'Lade IFC-Validierungslogik...';
    case 'ready':
      return 'Bereit!';
    default:
      return 'Initialisierung...';
  }
}

export default WorkerStatus; 