import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import FileUpload from './components/FileUpload';
import ValidationResults from './components/ValidationResults';
import DetailedValidationResults from './components/DetailedValidationResults';
import WorkerStatus from './components/WorkerStatus';
import ValidationHistory from './components/ValidationHistory';
import ValidationProgress from './components/ValidationProgress';
import { useValidationWorker } from './hooks/useValidationWorker';
import { useLocalStorage } from './hooks/useLocalStorage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [validationHistory, setValidationHistory] = useLocalStorage('ifc-validation-history', []);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const {
    worker,
    isWorkerReady,
    workerError,
    initializationProgress,
    initializeWorker
  } = useValidationWorker();

  useEffect(() => {
    initializeWorker();
  }, [initializeWorker]);

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const formatTimeEstimate = useCallback((seconds) => {
    if (seconds < 1) return 'weniger als 1 Sekunde';
    if (seconds < 60) return `${Math.round(seconds)} Sekunden`;
    return `${Math.round(seconds / 60)} Minuten`;
  }, []);

  const handleValidationProgress = useCallback((progressData) => {
    setValidationProgress({
      ...progressData,
      formattedTimeLeft: progressData.estimatedTimeLeft 
        ? formatTimeEstimate(progressData.estimatedTimeLeft)
        : null
    });
  }, [formatTimeEstimate]);

  const handleFileValidation = useCallback(async (files) => {
    if (!isWorkerReady || !worker) {
      showSnackbar('Worker ist noch nicht bereit.', 'warning');
      return;
    }

    setIsValidating(true);
    setValidationResults(null);
    setValidationProgress(null);

    try {
      const validationPromises = files.map(async (file, index) => {
        const startTime = Date.now();
        setCurrentFileName(file.name);
        
        // Simuliere Progress da Callbacks nicht über Worker klonbar
        const progressStages = [
          { stage: 'starting', progress: 0 },
          { stage: 'syntax_validation', progress: 15 },
          { stage: 'header_validation', progress: 35 },
          { stage: 'schema_validation', progress: 50 },
          { stage: 'normative_rules', progress: 65 },
          { stage: 'industry_practices', progress: 80 },
          { stage: 'finalizing', progress: 95 }
        ];
        
        // Schätze Validierungszeit basierend auf Dateigröße
        const estimatedTime = Math.max(0.5, Math.min(30, file.size / 50000));
        const stageInterval = (estimatedTime * 1000) / progressStages.length;
        
        // Starte Progress-Simulation
        const progressPromise = (async () => {
          for (const stageData of progressStages) {
            handleValidationProgress({
              ...stageData,
              estimatedTimeLeft: estimatedTime * (1 - stageData.progress / 100),
              currentFile: file.name,
              fileIndex: index + 1,
              totalFiles: files.length
            });
            await new Promise(resolve => setTimeout(resolve, stageInterval));
          }
        })();
        
        // Starte Validierung parallel zu Progress-Simulation
        const resultPromise = worker.validateIFCFile(file, file.name);
        
        // Warte auf beide: Progress-Simulation und Validierungsergebnis
        const [result] = await Promise.all([resultPromise, progressPromise]);

        // Zeige Completion
        handleValidationProgress({
          stage: 'completed',
          progress: 100,
          estimatedTimeLeft: 0,
          currentFile: file.name,
          fileIndex: index + 1,
          totalFiles: files.length
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Lese IFC-Content für Code-Viewer
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        const validationEntry = {
          id: Date.now() + Math.random(),
          filename: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
          duration: duration,
          result: result,
          isValid: result.is_valid,
          ifcContent: fileContent,
          validationTime: result.validation_time,
          estimatedTime: result.estimated_time
        };

        // Füge zur History hinzu
        setValidationHistory(prev => [validationEntry, ...prev.slice(0, 19)]);

        return validationEntry;
      });

      const results = await Promise.all(validationPromises);
      setValidationResults(results);

      const validCount = results.filter(r => r.isValid).length;
      const totalCount = results.length;
      
      // Zusammenfassung der Validierungszeit
      const totalActualTime = results.reduce((sum, r) => sum + r.validationTime, 0);
      const totalEstimatedTime = results.reduce((sum, r) => sum + r.estimatedTime, 0);
      const timeAccuracy = totalEstimatedTime > 0 
        ? Math.round((Math.min(totalActualTime, totalEstimatedTime) / Math.max(totalActualTime, totalEstimatedTime)) * 100)
        : 100;
      
      if (validCount === totalCount) {
        showSnackbar(
          `Alle ${totalCount} Datei(en) sind gültig! ` +
          `Validiert in ${totalActualTime.toFixed(1)}s (${timeAccuracy}% Zeitschätzungsgenauigkeit)`, 
          'success'
        );
      } else {
        const totalErrors = results.reduce((sum, r) => sum + r.result.summary.errors, 0);
        const totalWarnings = results.reduce((sum, r) => sum + r.result.summary.warnings, 0);
        showSnackbar(
          `${validCount} von ${totalCount} Datei(en) sind gültig. ` +
          `${totalErrors} Fehler, ${totalWarnings} Warnungen gefunden.`, 
          'warning'
        );
      }

    } catch (error) {
      console.error('Validierung fehlgeschlagen:', error);
      showSnackbar(`Validierung fehlgeschlagen: ${error.message}`, 'error');
    } finally {
      setIsValidating(false);
      setValidationProgress(null);
      setCurrentFileName('');
    }
  }, [isWorkerReady, worker, showSnackbar, setValidationHistory, handleValidationProgress]);

  const clearHistory = useCallback(() => {
    setValidationHistory([]);
    showSnackbar('Verlauf gelöscht', 'info');
  }, [setValidationHistory, showSnackbar]);

  const clearResults = useCallback(() => {
    setValidationResults(null);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            IFC Validation WASM
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
            Vollständige lokale IFC-Validierung mit WebAssembly
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            STEP-Syntax • Header • Schema • Normative Regeln • Industry Practices
          </Typography>
          
          <WorkerStatus 
            isReady={isWorkerReady}
            error={workerError}
            progress={initializationProgress}
          />
        </Box>

        {!isWorkerReady && !workerError && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 2 }} />
              <Typography variant="h6">Worker wird initialisiert...</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {initializationProgress?.stage === 'loading_pyodide' && 'Lade WebAssembly Runtime...'}
              {initializationProgress?.stage === 'loading_packages' && 'Installiere Python-Packages...'}
              {initializationProgress?.stage === 'loading_validation_code' && 'Lade Validierungslogik...'}
              {initializationProgress?.stage === 'ready' && 'Fertig!'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={initializationProgress?.progress || 0} 
            />
          </Paper>
        )}

        {workerError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">Worker-Fehler</Typography>
            <Typography variant="body2">{workerError}</Typography>
          </Alert>
        )}

        {isWorkerReady && (
          <>
            <FileUpload
              onFilesSelected={handleFileValidation}
              disabled={isValidating}
              isValidating={isValidating}
            />

            {/* Validation Progress Display */}
            {isValidating && validationProgress && (
              <ValidationProgress
                progress={validationProgress}
                currentFileName={currentFileName}
              />
            )}

            {validationResults && (
              <DetailedValidationResults
                results={validationResults}
                onClear={clearResults}
              />
            )}

            <ValidationHistory
              history={validationHistory}
              onClear={clearHistory}
            />
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App; 