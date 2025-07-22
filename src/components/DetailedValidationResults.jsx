import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import IFCCodeViewer from './IFCCodeViewer';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  FileCopy as FileIcon
} from '@mui/icons-material';

// Status-zu-Farbe Mapping (wie in der Original-App)
const statusToColor = {
  'VALID': '#90EE90',
  'INVALID': '#FFB6C1', 
  'NOT_APPLICABLE': '#D3D3D3',
  'WARNING': '#FFD700'
};

const severityToColor = {
  'ERROR': '#ffebee',
  'WARNING': '#fff3e0', 
  'PASSED': '#e8f5e8',
  'INFO': '#e3f2fd'
};

const severityIcons = {
  'ERROR': <ErrorIcon color="error" />,
  'WARNING': <WarningIcon color="warning" />,
  'PASSED': <ValidIcon color="success" />,
  'INFO': <InfoIcon color="info" />
};

function DetailedValidationResults({ results, onClear }) {
  const [tabValue, setTabValue] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  if (!results || results.length === 0) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : null);
  };

  const generateDetailedReport = (validationResult) => {
    // Sichere Zugriff auf die Validierungsergebnisse
    const report = validationResult.result || {};
    const results = report.results || [];
    
    return {
      file: {
        name: report.filename || validationResult.filename,
        size: validationResult.fileSize,
        duration: validationResult.duration,
        timestamp: validationResult.timestamp,
        isValid: report.is_valid || validationResult.isValid
      },
      summary: report.summary || { errors: 0, warnings: 0, passed: 0, total_checks: 0 },
      categories: {
        syntax: results.filter(r => r.outcome_code === 'E00001' || r.feature?.rule?.includes('STEP_')),
        header: results.filter(r => 
          r.feature?.rule?.includes('HEADER') || 
          r.feature?.rule?.includes('FILE_') ||
          r.feature?.rule?.includes('CHARACTER_ENCODING')
        ),
        schema: results.filter(r => 
          r.outcome_code === 'E00002' || 
          r.outcome_code === 'E00010' ||
          r.feature?.rule?.includes('SCHEMA') ||
          r.feature?.rule?.includes('ENTITY_TYPE')
        ),
        normative: results.filter(r => 
          r.feature?.rule?.includes('SPS001') ||
          r.feature?.rule?.includes('PSE001') ||
          r.feature?.rule?.includes('GEM001') ||
          r.outcome_code === 'E00040' ||
          r.outcome_code === 'E00100'
        ),
        industry: results.filter(r => 
          r.feature?.rule?.includes('INDUSTRY_') ||
          r.outcome_code === 'W00030' ||
          r.outcome_code === 'E00070' ||
          r.outcome_code === 'E00110'
        ),
        passed: results.filter(r => r.severity === 'PASSED')
      }
    };
  };

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

  const DetailedFileInfo = ({ report, validationResult }) => (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell colSpan={2} sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
              Datei-Informationen
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Dateiname</TableCell>
            <TableCell>{report.file.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Dateigröße</TableCell>
            <TableCell>{formatFileSize(report.file.size)}</TableCell>
          </TableRow>
          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Validierungsdauer</TableCell>
                <TableCell>
                  {formatDuration(report.file.duration)}
                  {validationResult.validationTime && (
                    <span style={{ color: 'gray', fontSize: '0.8em' }}>
                      {' '}(tatsächlich: {validationResult.validationTime.toFixed(1)}s)
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Zeitschätzung</TableCell>
                <TableCell>
                  {validationResult.estimatedTime 
                    ? `${validationResult.estimatedTime.toFixed(1)}s geschätzt` 
                    : 'Keine Schätzung verfügbar'}
                  {validationResult.validationTime && validationResult.estimatedTime && (
                    <span style={{ 
                      color: Math.abs(validationResult.validationTime - validationResult.estimatedTime) < 1 ? 'green' : 'orange',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      ({Math.round((Math.min(validationResult.validationTime, validationResult.estimatedTime) / 
                        Math.max(validationResult.validationTime, validationResult.estimatedTime)) * 100)}% Genauigkeit)
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Validierungszeitpunkt</TableCell>
                <TableCell>{new Date(report.file.timestamp).toLocaleString('de-DE')}</TableCell>
              </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Gesamtstatus</TableCell>
            <TableCell>
              <Chip
                icon={report.file.isValid ? <ValidIcon /> : <ErrorIcon />}
                label={report.file.isValid ? 'Gültige IFC-Datei' : 'Ungültige IFC-Datei'}
                color={report.file.isValid ? 'success' : 'error'}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const ValidationSummary = ({ summary }) => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Validierungsübersicht
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<ErrorIcon />}
          label={`${summary.errors} Fehler`}
          color={summary.errors > 0 ? 'error' : 'default'}
          variant={summary.errors > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<WarningIcon />}
          label={`${summary.warnings} Warnungen`}
          color={summary.warnings > 0 ? 'warning' : 'default'}
          variant={summary.warnings > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<ValidIcon />}
          label={`${summary.passed} Erfolgreich`}
          color={summary.passed > 0 ? 'success' : 'default'}
          variant={summary.passed > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<InfoIcon />}
          label={`${summary.total_checks} Gesamt-Checks`}
          color="info"
          variant="outlined"
        />
      </Box>
    </Paper>
  );

  const CategoryReport = ({ title, items, color = 'primary', description }) => (
    <Accordion 
      expanded={expandedAccordion === title} 
      onChange={handleAccordionChange(title)}
      sx={{ mb: 1 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          bgcolor: items.length > 0 ? severityToColor[items[0]?.severity] || 'grey.100' : 'grey.100'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          {items.length > 0 && severityIcons[items[0]?.severity]}
          <Typography variant="h6" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Chip 
            label={items.length} 
            size="small" 
            color={items.length > 0 ? (items[0]?.severity === 'ERROR' ? 'error' : items[0]?.severity === 'WARNING' ? 'warning' : 'success') : 'default'}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {description && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {description}
          </Alert>
        )}
        
        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Keine Probleme in dieser Kategorie gefunden.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Schweregrad</TableCell>
                  <TableCell>Regeltyp</TableCell>
                  <TableCell>Beschreibung</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        icon={severityIcons[item.severity]}
                        label={item.severity}
                        size="small"
                        color={item.severity === 'ERROR' ? 'error' : item.severity === 'WARNING' ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.feature?.rule || item.outcome_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.feature?.description || 'Keine Beschreibung verfügbar'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {item.observed || 'Keine Details verfügbar'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const currentResult = results[tabValue];
  const report = generateDetailedReport(currentResult);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Detaillierter Validierungsbericht
        </Typography>
        <Button onClick={onClear} startIcon={<ClearIcon />}>
          Berichte löschen
        </Button>
      </Box>

      {/* File Tabs */}
      {results.length > 1 && (
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          {results.map((result, index) => (
            <Tab 
              key={index}
              label={result.filename}
              icon={result.isValid ? <ValidIcon color="success" /> : <ErrorIcon color="error" />}
            />
          ))}
        </Tabs>
      )}

      {/* File Information */}
      <DetailedFileInfo report={report} validationResult={currentResult} />

      {/* Summary */}
      <ValidationSummary summary={report.summary} />

      {/* IFC Code Viewer */}
      <IFCCodeViewer 
        ifcContent={currentResult.ifcContent}
        validationResults={report.categories ? Object.values(report.categories).flat() : []}
        filename={currentResult.filename}
      />

      {/* Kategorisierte Berichte */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Detaillierte Validierungsergebnisse
      </Typography>

      <CategoryReport
        title="STEP-Syntax Validierung"
        items={report.categories.syntax}
        description="Überprüfung der grundlegenden STEP Physical File Syntax gemäß ISO 10303-21 Standard: Header/Footer, Klammern-Balance, Sektionen."
      />

      <CategoryReport
        title="IFC-Header Validierung"
        items={report.categories.header}
        description="Validierung der Header-Informationen: FILE_DESCRIPTION, FILE_NAME, FILE_SCHEMA und Zeichenkodierung."
      />

      <CategoryReport
        title="IFC-Schema Validierung"
        items={report.categories.schema}
        description="Prüfung der IFC-Entity-Strukturen, Typen-Validierung und EXPRESS Schema-Konformität."
      />

      <CategoryReport
        title="Normative Regeln (buildingSMART)"
        items={report.categories.normative}
        description="Gherkin-basierte buildingSMART Regeln: SPS001 (Spatial Structure), PSE001 (Property Sets), GEM001 (Geometry)."
      />

      <CategoryReport
        title="Industry Practices"
        items={report.categories.industry}
        description="Best Practices für BIM-Workflows: OwnerHistory, UnitAssignment, Material-Informationen und Naming Conventions."
      />

      <CategoryReport
        title="Erfolgreich validiert"
        items={report.categories.passed}
        description="Alle erfolgreich durchgeführten Validierungsschritte und bestandenen Tests."
      />

      {/* Verbesserungsvorschläge */}
      {!report.file.isValid && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Empfehlungen zur Fehlerbehebung:
          </Typography>
          <List dense>
            {report.summary.errors > 0 && (
              <ListItem>
                <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                <ListItemText primary="Beheben Sie zunächst alle kritischen Fehler (ERROR)" />
              </ListItem>
            )}
            {report.categories.syntax.length > 0 && (
              <ListItem>
                <ListItemIcon><FileIcon /></ListItemIcon>
                <ListItemText primary="Überprüfen Sie die STEP-Dateistruktur mit einem IFC-Editor" />
              </ListItem>
            )}
            {report.categories.header.length > 0 && (
              <ListItem>
                <ListItemIcon><InfoIcon /></ListItemIcon>
                <ListItemText primary="Vervollständigen Sie die Header-Informationen in Ihrer Authoring-Software" />
              </ListItem>
            )}
          </List>
        </Alert>
      )}
    </Paper>
  );
}

export default DetailedValidationResults; 