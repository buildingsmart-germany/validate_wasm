import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugIcon
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to send this to an error reporting service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // Example error reporting (replace with your service)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error Report:', errorReport);
    
    // You could send this to Sentry, LogRocket, or another service
    // Example:
    // Sentry.captureException(error, { extra: errorInfo });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BugIcon sx={{ fontSize: 64, color: 'error.main', mb: 3 }} />
            
            <Typography variant="h4" gutterBottom color="error">
              Etwas ist schiefgelaufen
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Ein unerwarteter Fehler ist in der Applikation aufgetreten.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Fehlerdetails:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
                size="large"
              >
                Seite neu laden
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
                size="large"
              >
                Erneut versuchen
              </Button>
            </Box>

            <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
              Wenn das Problem weiterhin besteht, versuchen Sie:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mt: 1 }}>
              <Typography component="li" variant="body2">
                Browser-Cache leeren
              </Typography>
              <Typography component="li" variant="body2">
                Einen anderen Browser verwenden
              </Typography>
              <Typography component="li" variant="body2">
                JavaScript und WebAssembly aktivieren
              </Typography>
              <Typography component="li" variant="body2">
                Browser aktualisieren
              </Typography>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Component Stack (Development):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Alert>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 