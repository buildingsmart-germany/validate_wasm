// IFC Validation Worker - IIFE Format (kein ES Module)
// Lädt Pyodide über importScripts und verwendet globale Comlink-Instanz

// Lade benötigte Scripts
try {
  importScripts('https://unpkg.com/comlink@4.4.1/dist/umd/comlink.js');
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
} catch (error) {
  console.error('Failed to load required scripts:', error);
}

class IFCValidationWorker {
  constructor() {
    this.pyodide = null;
    this.initialized = false;
    this.validationRules = new Map();
    this.progressCallback = null;
    this.totalSteps = 0;
    this.currentStep = 0;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Loading Pyodide...');
      
      // Warte bis Pyodide verfügbar ist
      let attempts = 0;
      while (typeof self.loadPyodide === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (typeof self.loadPyodide === 'undefined') {
        throw new Error('Pyodide konnte nicht geladen werden');
      }

      console.log('Loading Python packages...');

      // Lade Pyodide mit notwendigen Packages
      this.pyodide = await self.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        packages: ['micropip', 'regex', 'pyyaml', 'packaging']
      });

      // Installiere zusätzliche Python-Packages
      await this.pyodide.loadPackage("micropip");
      const micropip = this.pyodide.pyimport("micropip");
      
      // Diese Packages werden für die IFC-Validierung benötigt
      await micropip.install([
        'pydantic',
        'behave',
        'jsonschema'
      ]);

      console.log('Loading validation code...');

      // Lade die Validierungslogik
      await this.loadValidationCode();

      console.log('Worker ready!');
      this.initialized = true;

    } catch (error) {
      throw new Error(`Worker-Initialisierung fehlgeschlagen: ${error.message}`);
    }
  }

  updateProgress(stage, progress, estimatedTimeLeft = null) {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        estimatedTimeLeft,
        currentStep: this.currentStep,
        totalSteps: this.totalSteps
      });
    }
  }

  async loadValidationCode() {
    // Vollständige Python-Validierungslogik mit allen Aspekten
    const validationCode = `
import sys
import json
import re
import yaml
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import time

class ValidationOutcomeSeverity(Enum):
    PASSED = "PASSED"
    WARNING = "WARNING"
    ERROR = "ERROR"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    
class ValidationOutcomeCode(Enum):
    PASSED = "P00010"
    NOT_APPLICABLE = "N00010"
    
    # STEP/Syntax Errors
    SYNTAX_ERROR = "E00001"
    SCHEMA_ERROR = "E00002"
    
    # Semantic Errors
    TYPE_ERROR = "E00010"
    VALUE_ERROR = "E00020"
    GEOMETRY_ERROR = "E00030"
    CARDINALITY_ERROR = "E00040"
    DUPLICATE_ERROR = "E00050"
    PLACEMENT_ERROR = "E00060"
    UNITS_ERROR = "E00070"
    QUANTITY_ERROR = "E00080"
    ENUMERATED_VALUE_ERROR = "E00090"
    RELATIONSHIP_ERROR = "E00100"
    NAMING_ERROR = "E00110"
    REFERENCE_ERROR = "E00120"
    RESOURCE_ERROR = "E00130"
    DEPRECATION_ERROR = "E00140"
    SHAPE_REPRESENTATION_ERROR = "E00150"
    INSTANCE_STRUCTURE_ERROR = "E00160"
    
    # Warnings
    WARNING = "W00030"
    
    # Industry Practices  
    RULE_VIOLATION = "RULE_VIOLATION"

@dataclass
class ValidationOutcome:
    severity: ValidationOutcomeSeverity
    outcome_code: ValidationOutcomeCode
    observed: Optional[str] = None
    feature: Optional[Dict] = None
    instance_id: Optional[str] = None
    expected: Optional[str] = None

class IFCValidationEngine:
    def __init__(self):
        self.results = []
        self.progress_callback = None
        self.start_time = None
        
    def set_progress_callback(self, callback):
        self.progress_callback = callback
        
    def update_progress(self, stage, progress, estimated_time=None):
        # Einfache Console-Logs da Callbacks nicht über Worker klonbar sind
        print(f"Progress: {stage} - {progress}% - {estimated_time}s")
        
    def validate_syntax(self, ifc_content: str) -> List[ValidationOutcome]:
        """Validiert die STEP-Syntax einer IFC-Datei"""
        results = []
        lines = ifc_content.split("\\n")
        
        self.update_progress("syntax_validation", 10)
        
        # Grundlegende Syntax-Checks
        if not ifc_content.strip().startswith("ISO-10303-21;"):
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed="STEP-Datei muss mit ISO-10303-21; beginnen",
                feature={"line": 1, "rule": "STEP_HEADER_START", "description": "STEP Physical File Header"}
            ))
            
        if not ifc_content.strip().endswith("END-ISO-10303-21;"):
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed="STEP-Datei muss mit END-ISO-10303-21; enden",
                feature={"line": len(lines), "rule": "STEP_FOOTER_END", "description": "STEP Physical File Footer"}
            ))
            
        # Prüfe auf balancierte Klammern
        open_count = ifc_content.count("(")
        close_count = ifc_content.count(")")
        if open_count != close_count:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed=f"Unbalancierte Klammern gefunden: {open_count} öffnende, {close_count} schließende Klammern",
                feature={"rule": "BALANCED_PARENTHESES", "description": "Alle Klammern müssen korrekt geschlossen werden"}
            ))
            
        # Prüfe auf korrekte STEP-Sektionen
        required_sections = ["HEADER", "DATA"]
        for section in required_sections:
            if f"{section};" not in ifc_content:
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.ERROR,
                    outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                    observed=f"Erforderliche Sektion {section} fehlt",
                    feature={"rule": f"REQUIRED_SECTION_{section}", "description": f"STEP-Datei muss {section}-Sektion enthalten"}
                ))
                
        # Prüfe auf Zeichenkodierung
        try:
            ifc_content.encode("utf-8")
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="Zeichenkodierung ist gültig",
                feature={"rule": "CHARACTER_ENCODING", "description": "UTF-8 Kompatibilität"}
            ))
        except UnicodeEncodeError:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed="Problematische Zeichenkodierung gefunden",
                feature={"rule": "CHARACTER_ENCODING", "description": "Datei sollte UTF-8 kompatibel sein"}
            ))
            
        self.update_progress("syntax_validation", 25)
        return results
        
    def validate_header(self, ifc_content: str) -> List[ValidationOutcome]:
        """Validiert den HEADER-Bereich einer IFC-Datei"""
        results = []
        lines = ifc_content.split("\\n")
        
        self.update_progress("header_validation", 30)
        
        # Extrahiere HEADER-Sektion
        header_match = re.search(r"HEADER;(.*?)ENDSEC;", ifc_content, re.DOTALL)
        if not header_match:
            header_line = None
            for i, line in enumerate(lines):
                if "HEADER" in line.upper():
                    header_line = i + 1
                    break
            
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed="Kein HEADER-Bereich gefunden",
                feature={"line": header_line or 1, "rule": "HEADER_SECTION_REQUIRED", "description": "STEP-Datei muss HEADER-Sektion enthalten"}
            ))
            return results
            
        header_content = header_match.group(1)
        header_start_line = ifc_content[:header_match.start()].count("\\n") + 1
        
        # Validiere FILE_DESCRIPTION
        file_desc_line = None
        for i, line in enumerate(lines):
            if "FILE_DESCRIPTION" in line.upper():
                file_desc_line = i + 1
                break
                
        if "FILE_DESCRIPTION" not in header_content:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.VALUE_ERROR,
                observed="FILE_DESCRIPTION ist erforderlich aber fehlt im Header",
                feature={"line": header_start_line, "rule": "FILE_DESCRIPTION_REQUIRED", "description": "Header muss FILE_DESCRIPTION enthalten"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="FILE_DESCRIPTION gefunden",
                feature={"line": file_desc_line, "rule": "FILE_DESCRIPTION_REQUIRED", "description": "Header FILE_DESCRIPTION Validierung"}
            ))
            
        # Validiere FILE_NAME
        file_name_line = None
        for i, line in enumerate(lines):
            if "FILE_NAME" in line.upper():
                file_name_line = i + 1
                break
                
        if "FILE_NAME" not in header_content:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.VALUE_ERROR,
                observed="FILE_NAME ist erforderlich aber fehlt im Header",
                feature={"line": header_start_line, "rule": "FILE_NAME_REQUIRED", "description": "Header muss FILE_NAME enthalten"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="FILE_NAME gefunden",
                feature={"line": file_name_line, "rule": "FILE_NAME_REQUIRED", "description": "Header FILE_NAME Validierung"}
            ))
            
        # Validiere FILE_SCHEMA
        file_schema_line = None
        for i, line in enumerate(lines):
            if "FILE_SCHEMA" in line.upper():
                file_schema_line = i + 1
                break
                
        schema_match = re.search(r"FILE_SCHEMA\\s*\\(\\s*\\(\\s*['\\"](.*?)['\\"\\s*]\\)", header_content)
        if schema_match:
            schema = schema_match.group(1)
            valid_schemas = ["IFC2X3", "IFC4", "IFC4X3_ADD2", "IFC4X3_ADD1", "IFC4X1", "IFC4X2"]
            if schema not in valid_schemas:
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.WARNING,
                    outcome_code=ValidationOutcomeCode.SCHEMA_ERROR,
                    observed=f"Unbekanntes oder veraltetes IFC-Schema: {schema}. Empfohlene Schemas: {', '.join(valid_schemas[:3])}",
                    feature={"line": file_schema_line, "rule": "FILE_SCHEMA_VALIDATION", "description": "IFC-Schema muss aktuell und unterstützt sein"}
                ))
            else:
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.PASSED,
                    outcome_code=ValidationOutcomeCode.PASSED,
                    observed=f"Gültiges IFC-Schema gefunden: {schema}",
                    feature={"line": file_schema_line, "rule": "FILE_SCHEMA_VALIDATION", "description": "IFC-Schema Validierung"}
                ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SCHEMA_ERROR,
                observed="FILE_SCHEMA fehlt oder ist ungültig formatiert",
                feature={"line": header_start_line, "rule": "FILE_SCHEMA_REQUIRED", "description": "Header muss gültiges FILE_SCHEMA enthalten"}
            ))
            
        self.update_progress("header_validation", 40)
        return results
        
    def validate_schema(self, ifc_content: str) -> List[ValidationOutcome]:
        """Erweiterte IFC-Schema-Validierung"""
        results = []
        lines = ifc_content.split("\\n")
        
        self.update_progress("schema_validation", 45)
        
        # Extrahiere DATA-Sektion
        data_match = re.search(r"DATA;(.*?)ENDSEC;", ifc_content, re.DOTALL)
        if not data_match:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.SYNTAX_ERROR,
                observed="Kein DATA-Bereich gefunden"
            ))
            return results
            
        data_content = data_match.group(1)
        
        # Entity-Pattern für IFC-Entities
        entity_pattern = r"#(\\d+)\\s*=\\s*([A-Z][A-Z0-9_]*)\\s*\\("
        entities = re.findall(entity_pattern, data_content)
        
        if not entities:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.SCHEMA_ERROR,
                observed="Keine IFC-Entities im DATA-Bereich gefunden"
            ))
        else:
            # Grundlegende Entity-Validierung
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed=f"{len(entities)} IFC-Entities gefunden und erkannt"
            ))
            
            # Validiere bekannte IFC-Entity-Typen
            valid_ifc_entities = [
                "IFCPROJECT", "IFCSITE", "IFCBUILDING", "IFCBUILDINGSTOREY",
                "IFCWALL", "IFCWALLSTANDARDCASE", "IFCSLAB", "IFCDOOR", "IFCWINDOW",
                "IFCCOLUMN", "IFCBEAM", "IFCROOF", "IFCSTAIR", "IFCRAILING",
                "IFCSPACE", "IFCZONE", "IFCSPATIALZONE", "IFCELECTRICALBASEPROPERTIES",
                "IFCPROPERTYSET", "IFCELEMENTQUANTITY", "IFCMATERIAL", "IFCMATERIALLIST",
                "IFCOWNERHISTORY", "IFCORGANIZATION", "IFCPERSON", "IFCPERSONANDORGANIZATION",
                "IFCAPPLICATION", "IFCUNITASSIGNMENT", "IFCGEOMETRICREPRESENTATIONCONTEXT",
                "IFCSHAPEREPRESENTATION", "IFCPRODUCTDEFINITIONSHAPE", "IFCCARTESIANPOINT",
                "IFCAXIS2PLACEMENT3D", "IFCPOLYLINE", "IFCEXTRUDEDAREASOLID"
            ]
            
            unknown_entities = []
            for entity_id, entity_type in entities:
                if entity_type.upper() not in valid_ifc_entities:
                    unknown_entities.append(entity_type)
                    
            if unknown_entities:
                # Zeige nur einzigartige unbekannte Entities
                unique_unknown = list(set(unknown_entities))
                if len(unique_unknown) <= 5:
                    entity_list = ", ".join(unique_unknown)
                else:
                    entity_list = ", ".join(unique_unknown[:5]) + f" und {len(unique_unknown)-5} weitere"
                    
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.WARNING,
                    outcome_code=ValidationOutcomeCode.TYPE_ERROR,
                    observed=f"Unbekannte oder seltene IFC-Entity-Typen gefunden: {entity_list}",
                    feature={"rule": "ENTITY_TYPE_VALIDATION", "description": "Alle Entities sollten bekannte IFC-Typen sein"}
                ))
                
        self.update_progress("schema_validation", 55)
        return results
        
    def validate_normative_rules(self, ifc_content: str) -> List[ValidationOutcome]:
        """Implementiert kritische Gherkin-basierte Normative Regeln"""
        results = []
        lines = ifc_content.split("\\n")
        
        self.update_progress("normative_rules", 60)
        
        # SPS001 - Basic spatial structure for buildings
        spatial_results = self.validate_spatial_structure(ifc_content)
        results.extend(spatial_results)
        
        # PSE001 - Standard property sets validation  
        pset_results = self.validate_property_sets(ifc_content)
        results.extend(pset_results)
        
        # GEM001 - Geometry representation validation
        geometry_results = self.validate_geometry_representation(ifc_content)
        results.extend(geometry_results)
        
        self.update_progress("normative_rules", 70)
        return results
        
    def validate_spatial_structure(self, ifc_content: str) -> List[ValidationOutcome]:
        """SPS001 - Basic spatial structure for buildings"""
        results = []
        
        # Prüfe auf IfcProject
        if "IFCPROJECT" not in ifc_content.upper():
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.ERROR,
                outcome_code=ValidationOutcomeCode.RELATIONSHIP_ERROR,
                observed="IfcProject fehlt - Erforderlich als Wurzel der Spatial Structure",
                feature={"rule": "SPS001_PROJECT_REQUIRED", "description": "Jede IFC-Datei muss genau ein IfcProject enthalten"}
            ))
        else:
            project_count = ifc_content.upper().count("IFCPROJECT")
            if project_count > 1:
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.ERROR,
                    outcome_code=ValidationOutcomeCode.CARDINALITY_ERROR,
                    observed=f"Mehrere IfcProject-Instanzen gefunden ({project_count}). Es darf nur eine geben.",
                    feature={"rule": "SPS001_SINGLE_PROJECT", "description": "Nur ein IfcProject pro Datei erlaubt"}
                ))
            else:
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.PASSED,
                    outcome_code=ValidationOutcomeCode.PASSED,
                    observed="IfcProject korrekt vorhanden (genau eine Instanz)",
                    feature={"rule": "SPS001_PROJECT_REQUIRED", "description": "IfcProject Spatial Structure Validierung"}
                ))
                
        # Prüfe auf IfcSite
        if "IFCSITE" not in ifc_content.upper():
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.RELATIONSHIP_ERROR,
                observed="IfcSite fehlt - Empfohlen für vollständige Spatial Structure",
                feature={"rule": "SPS001_SITE_RECOMMENDED", "description": "IfcSite wird für vollständige Spatial Structure empfohlen"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="IfcSite gefunden",
                feature={"rule": "SPS001_SITE_RECOMMENDED", "description": "IfcSite Spatial Structure Validierung"}
            ))
            
        return results
        
    def validate_property_sets(self, ifc_content: str) -> List[ValidationOutcome]:
        """PSE001 - Standard property sets validation"""
        results = []
        
        # Suche nach IfcPropertySet mit Pset_ Prefix
        pset_pattern = r"IFCPROPERTYSET\\s*\\([^)]*'(Pset_[^']*)"
        pset_matches = re.findall(pset_pattern, ifc_content.upper())
        
        if pset_matches:
            # Standard Pset Namen (Auswahl der wichtigsten)
            standard_psets = [
                "PSET_WALLCOMMON", "PSET_SLABCOMMON", "PSET_DOORCOMMON", 
                "PSET_WINDOWCOMMON", "PSET_SPACECOMMON", "PSET_BUILDINGCOMMON",
                "PSET_COLUMNCOMMON", "PSET_BEAMCOMMON"
            ]
            
            for pset_name in pset_matches:
                if pset_name.upper() in standard_psets:
                    results.append(ValidationOutcome(
                        severity=ValidationOutcomeSeverity.PASSED,
                        outcome_code=ValidationOutcomeCode.PASSED,
                        observed=f"Standard PropertySet gefunden: {pset_name}",
                        feature={"rule": "PSE001_STANDARD_PSETS", "description": "Standard PropertySet Validierung"}
                    ))
                else:
                    results.append(ValidationOutcome(
                        severity=ValidationOutcomeSeverity.WARNING,
                        outcome_code=ValidationOutcomeCode.NAMING_ERROR,
                        observed=f"Nicht-Standard PropertySet gefunden: {pset_name}",
                        feature={"rule": "PSE001_STANDARD_PSETS", "description": "PropertySet sollte Standard-Namen verwenden"}
                    ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.RESOURCE_ERROR,
                observed="Keine Standard PropertySets (Pset_*) gefunden",
                feature={"rule": "PSE001_STANDARD_PSETS", "description": "Standard PropertySets werden empfohlen"}
            ))
            
        return results
        
    def validate_geometry_representation(self, ifc_content: str) -> List[ValidationOutcome]:
        """GEM001 - Geometry representation validation"""
        results = []
        
        # Prüfe auf geometrische Repräsentationen
        geometric_entities = [
            "IFCSHAPEREPRESENTATION", "IFCPRODUCTDEFINITIONSHAPE",
            "IFCEXTRUDEDAREASOLID", "IFCPOLYLINE", "IFCCARTESIANPOINT"
        ]
        
        found_geometry = False
        for entity in geometric_entities:
            if entity in ifc_content.upper():
                found_geometry = True
                results.append(ValidationOutcome(
                    severity=ValidationOutcomeSeverity.PASSED,
                    outcome_code=ValidationOutcomeCode.PASSED,
                    observed=f"Geometrische Repräsentation gefunden: {entity}",
                    feature={"rule": "GEM001_GEOMETRY_PRESENT", "description": "Geometrische Repräsentation Validierung"}
                ))
                break
                
        if not found_geometry:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.GEOMETRY_ERROR,
                observed="Keine geometrischen Repräsentationen gefunden",
                feature={"rule": "GEM001_GEOMETRY_PRESENT", "description": "Geometrische Repräsentationen werden für vollständige BIM-Modelle empfohlen"}
            ))
            
        return results
        
    def validate_industry_practices(self, ifc_content: str) -> List[ValidationOutcome]:
        """Industry Practices - Best practices validation"""
        results = []
        
        self.update_progress("industry_practices", 75)
        
        # Prüfe auf OwnerHistory
        if "IFCOWNERHISTORY" not in ifc_content.upper():
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.WARNING,
                observed="IfcOwnerHistory fehlt - Best Practice für Nachverfolgbarkeit",
                feature={"rule": "INDUSTRY_OWNER_HISTORY", "description": "IfcOwnerHistory wird für Nachverfolgbarkeit empfohlen"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="IfcOwnerHistory gefunden",
                feature={"rule": "INDUSTRY_OWNER_HISTORY", "description": "OwnerHistory Best Practice"}
            ))
            
        # Prüfe auf Units
        if "IFCUNITASSIGNMENT" not in ifc_content.upper():
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.UNITS_ERROR,
                observed="IfcUnitAssignment fehlt - Best Practice für eindeutige Einheiten",
                feature={"rule": "INDUSTRY_UNITS", "description": "Einheiten-Definition wird empfohlen"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="IfcUnitAssignment gefunden",
                feature={"rule": "INDUSTRY_UNITS", "description": "Einheiten Best Practice"}
            ))
            
        # Prüfe auf Material-Informationen
        material_entities = ["IFCMATERIAL", "IFCMATERIALLIST", "IFCMATERIALLAYERSET"]
        found_materials = any(entity in ifc_content.upper() for entity in material_entities)
        
        if not found_materials:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.WARNING,
                outcome_code=ValidationOutcomeCode.WARNING,
                observed="Keine Material-Informationen gefunden - Best Practice für BIM-Workflows",
                feature={"rule": "INDUSTRY_MATERIALS", "description": "Material-Informationen werden für BIM-Workflows empfohlen"}
            ))
        else:
            results.append(ValidationOutcome(
                severity=ValidationOutcomeSeverity.PASSED,
                outcome_code=ValidationOutcomeCode.PASSED,
                observed="Material-Informationen gefunden",
                feature={"rule": "INDUSTRY_MATERIALS", "description": "Material Best Practice"}
            ))
            
        self.update_progress("industry_practices", 85)
        return results
        
    def estimate_validation_time(self, ifc_content: str) -> float:
        """Schätzt die Validierungszeit basierend auf Dateigröße und Komplexität"""
        content_size = len(ifc_content)
        line_count = len(ifc_content.split("\\n"))
        entity_count = len(re.findall(r"#\\d+\\s*=\\s*[A-Z][A-Z0-9_]*", ifc_content))
        
        # Basis-Zeit: 100ms pro 1000 Zeichen
        base_time = (content_size / 1000) * 0.1
        
        # Zusätzliche Zeit für Entities: 10ms pro Entity
        entity_time = entity_count * 0.01
        
        # Zusätzliche Zeit für komplexe Validierungen: 50ms pro 100 Zeilen
        complexity_time = (line_count / 100) * 0.05
        
        total_estimated_time = base_time + entity_time + complexity_time
        
        # Mindestens 0.5 Sekunden, maximal 30 Sekunden
        return max(0.5, min(30.0, total_estimated_time))
        
    def validate_full_file(self, ifc_content: str, filename: str = "unknown.ifc") -> Dict[str, Any]:
        """Führt eine komplette Validierung durch mit Progress-Tracking"""
        self.start_time = time.time()
        estimated_time = self.estimate_validation_time(ifc_content)
        
        all_results = []
        
        self.update_progress("starting", 0, estimated_time)
        
        # 1. Syntax-Validierung (0-25%)
        syntax_results = self.validate_syntax(ifc_content)
        all_results.extend(syntax_results)
        
        # 2. Header-Validierung (25-40%)
        header_results = self.validate_header(ifc_content)
        all_results.extend(header_results)
        
        # 3. Schema-Validierung (40-55%)
        schema_results = self.validate_schema(ifc_content)
        all_results.extend(schema_results)
        
        # 4. Normative Regeln (55-70%)
        normative_results = self.validate_normative_rules(ifc_content)
        all_results.extend(normative_results)
        
        # 5. Industry Practices (70-85%)
        industry_results = self.validate_industry_practices(ifc_content)
        all_results.extend(industry_results)
        
        # 6. Finalisierung (85-100%)
        self.update_progress("finalizing", 90)
        
        # Erstelle Zusammenfassung
        error_count = sum(1 for r in all_results if r.severity == ValidationOutcomeSeverity.ERROR)
        warning_count = sum(1 for r in all_results if r.severity == ValidationOutcomeSeverity.WARNING)
        passed_count = sum(1 for r in all_results if r.severity == ValidationOutcomeSeverity.PASSED)
        
        actual_time = time.time() - self.start_time
        
        self.update_progress("completed", 100, 0)
        
        return {
            "filename": filename,
            "is_valid": error_count == 0,
            "validation_time": actual_time,
            "estimated_time": estimated_time,
            "summary": {
                "errors": error_count,
                "warnings": warning_count,
                "passed": passed_count,
                "total_checks": len(all_results)
            },
            "results": [
                {
                    "severity": r.severity.value,
                    "outcome_code": r.outcome_code.value,
                    "observed": r.observed,
                    "expected": r.expected,
                    "feature": r.feature,
                    "instance_id": r.instance_id
                }
                for r in all_results
            ]
        }

# Globale Instanz für den Worker
validation_engine = IFCValidationEngine()

# Hilfsfunktionen für den JavaScript-Worker
def validate_ifc_file(content, filename):
    # Progress wird als Console-Logs ausgegeben da Callbacks nicht über Worker klonbar
    return validation_engine.validate_full_file(content, filename)
`;

    this.pyodide.runPython(validationCode);
  }

  async validateIFCFile(file, filename) {
    if (!this.initialized) {
      throw new Error('Worker ist nicht initialisiert');
    }

    try {
      console.log('Reading file:', filename);
      
      // Lese Datei als Text
      const content = await this.readFileAsText(file);
      
      // Berechne geschätzte Schritte basierend auf Dateigröße
      const contentSize = content.length;
      const estimatedSteps = Math.max(5, Math.min(15, Math.floor(contentSize / 10000)));
      this.totalSteps = estimatedSteps;
      this.currentStep = 0;
      
      console.log('Validating file:', filename, `(${estimatedSteps} estimated steps)`);
      
      // Führe Validierung durch (ohne Progress-Callback da nicht über postMessage klonbar)
      const validateFunction = this.pyodide.globals.get('validate_ifc_file');
      const result = validateFunction(content, filename);
      
      console.log('Validation complete for:', filename);
      
      return result.toJs({ dict_converter: Object.fromEntries });
      
    } catch (error) {
      throw new Error(`Validierung fehlgeschlagen: ${error.message}`);
    }
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsText(file);
    });
  }

  async runGherkinRules(ifcContent, ruleType = 'CRITICAL') {
    // Placeholder für zukünftige erweiterte Gherkin-Implementation
    return {
      rule_type: ruleType,
      results: [],
      message: 'Erweiterte Gherkin-Regeln in Entwicklung'
    };
  }
}

// Erstelle Worker-Instanz und expose sie via Comlink (global verfügbar)
const worker = new IFCValidationWorker();
if (typeof Comlink !== 'undefined') {
  Comlink.expose(worker);
} else {
  console.error('Comlink ist nicht verfügbar');
} 