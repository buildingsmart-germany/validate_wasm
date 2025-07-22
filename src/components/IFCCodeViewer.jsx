import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  ZoomIn as ZoomInIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const IFCCodeViewer = ({ ifcContent, validationResults, filename }) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedLine, setCopiedLine] = useState(null);

  if (!ifcContent || !validationResults) {
    return null;
  }

  // Erstelle Mapping von Zeilennummern zu Fehlern
  const createLineErrorMap = () => {
    const lineErrors = new Map();
    
    validationResults.forEach(result => {
      if (result.feature?.line) {
        const lineNum = result.feature.line;
        if (!lineErrors.has(lineNum)) {
          lineErrors.set(lineNum, []);
        }
        lineErrors.get(lineNum).push(result);
      }
    });
    
    return lineErrors;
  };

  // Extrahiere relevante Code-Snippets um Fehler herum
  const extractErrorSnippets = () => {
    const lines = ifcContent.split('\n');
    const lineErrors = createLineErrorMap();
    const snippets = [];
    
    lineErrors.forEach((errors, lineNum) => {
      const startLine = Math.max(0, lineNum - 3);
      const endLine = Math.min(lines.length - 1, lineNum + 2);
      
      const codeLines = [];
      for (let i = startLine; i <= endLine; i++) {
        codeLines.push({
          number: i + 1,
          content: lines[i] || '',
          hasError: i + 1 === lineNum,
          errors: i + 1 === lineNum ? errors : []
        });
      }
      
      snippets.push({
        errorLine: lineNum,
        errors: errors,
        lines: codeLines,
        severity: Math.max(...errors.map(e => e.severity === 'ERROR' ? 3 : e.severity === 'WARNING' ? 2 : 1))
      });
    });
    
    return snippets.sort((a, b) => a.errorLine - b.errorLine);
  };

  // Kopiere Code-Zeile
  const copyLine = (content, lineNum) => {
    navigator.clipboard.writeText(content);
    setCopiedLine(lineNum);
    setTimeout(() => setCopiedLine(null), 2000);
  };

  // Finde Header- und Data-Sektionen
  const findSections = () => {
    const lines = ifcContent.split('\n');
    const sections = {};
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('HEADER;')) {
        sections.header = { start: index + 1, line: line };
      } else if (line.trim().startsWith('DATA;')) {
        sections.data = { start: index + 1, line: line };
      } else if (line.trim().startsWith('END-ISO-10303-21;')) {
        sections.end = { start: index + 1, line: line };
      }
    });
    
    return sections;
  };

  const errorSnippets = extractErrorSnippets();
  const sections = findSections();
  const hasErrors = validationResults.some(r => r.severity === 'ERROR');

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 3: return '#ffebee'; // ERROR
      case 2: return '#fff3e0'; // WARNING  
      default: return '#e3f2fd'; // INFO
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 3: return <ErrorIcon color="error" />;
      case 2: return <WarningIcon color="warning" />;
      default: return null;
    }
  };

  return (
    <Paper sx={{ mt: 2, mb: 2 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: hasErrors ? '#ffebee' : '#e8f5e8' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <ZoomInIcon />
            <Typography variant="h6">
              IFC-Code Anzeige
            </Typography>
            <Chip 
              label={`${errorSnippets.length} Problemstellen`}
              size="small"
              color={hasErrors ? 'error' : 'warning'}
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Zeigt Code-Ausschnitte rund um identifizierte Probleme. 
            Rote Zeilen enthalten Fehler, gelbe Zeilen Warnungen.
          </Alert>

          {/* IFC-Datei Struktur-Übersicht */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Datei-Struktur Übersicht
          </Typography>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              📄 {filename}<br/>
              📊 {ifcContent.split('\n').length} Zeilen insgesamt<br/>
              🏗️ HEADER: Zeile {sections.header?.start || '?'}<br/>
              📦 DATA: Zeile {sections.data?.start || '?'}<br/>
              🔚 END: Zeile {sections.end?.start || '?'}
            </Typography>
          </Box>

          {/* Fehler-Snippets */}
          {errorSnippets.length === 0 ? (
            <Alert severity="success">
              🎉 Keine Code-Probleme gefunden, die spezifische Zeilen betreffen!
            </Alert>
          ) : (
            errorSnippets.map((snippet, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: getSeverityColor(snippet.severity),
                  border: `1px solid ${snippet.severity === 3 ? '#f44336' : '#ff9800'}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getSeverityIcon(snippet.severity)}
                  <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                    Problem in Zeile {snippet.errorLine}
                  </Typography>
                </Box>

                {/* Fehler-Beschreibungen */}
                {snippet.errors.map((error, errorIndex) => (
                  <Alert 
                    key={errorIndex} 
                    severity={error.severity === 'ERROR' ? 'error' : 'warning'}
                    sx={{ mb: 1, fontSize: '0.875rem' }}
                  >
                    <strong>{error.feature?.rule || error.outcome_code}:</strong> {error.observed}
                  </Alert>
                ))}

                {/* Code-Snippet */}
                <Paper sx={{ p: 1, bgcolor: '#ffffff', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {snippet.lines.map((line, lineIndex) => (
                    <Box 
                      key={lineIndex}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        py: 0.5,
                        px: 1,
                        bgcolor: line.hasError ? 
                          (line.errors[0]?.severity === 'ERROR' ? '#ffebee' : '#fff3e0') : 
                          'transparent',
                        borderLeft: line.hasError ? 
                          `4px solid ${line.errors[0]?.severity === 'ERROR' ? '#f44336' : '#ff9800'}` : 
                          '4px solid transparent',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <Typography 
                        component="span" 
                        sx={{ 
                          minWidth: '40px', 
                          color: 'text.secondary',
                          fontWeight: line.hasError ? 'bold' : 'normal'
                        }}
                      >
                        {line.number}:
                      </Typography>
                      <Typography 
                        component="span" 
                        sx={{ 
                          flex: 1, 
                          ml: 1,
                          fontWeight: line.hasError ? 'bold' : 'normal',
                          color: line.hasError ? '#d32f2f' : 'text.primary'
                        }}
                      >
                        {line.content || ' '}
                      </Typography>
                      <Tooltip title={copiedLine === line.number ? "Kopiert!" : "Zeile kopieren"}>
                        <IconButton
                          size="small"
                          onClick={() => copyLine(line.content, line.number)}
                          sx={{ ml: 1 }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Paper>
              </Paper>
            ))
          )}

          {/* Hilfetipps */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Tipps zur Fehlerbehebung:
            </Typography>
            <Typography variant="body2">
              • <strong>STEP-Syntax-Fehler:</strong> Überprüfen Sie Klammern, Anführungszeichen und Semikolons<br/>
              • <strong>Header-Probleme:</strong> Vervollständigen Sie FILE_DESCRIPTION, FILE_NAME und FILE_SCHEMA<br/>
              • <strong>Schema-Fehler:</strong> Stellen Sie sicher, dass IFC-Entities korrekt geschrieben sind<br/>
              • <strong>Zeilen-Navigation:</strong> Nutzen Sie die Zeilennummern für die Bearbeitung in Ihrem IFC-Editor
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default IFCCodeViewer; 