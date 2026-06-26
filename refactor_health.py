import re

filepath = 'src/components/hr/HealthSafety.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { useTranslation } from 'react-i18next';"
if import_stmt not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt + "\n", content, count=1)

# Add hook inside the component
hook_stmt = "  const { t } = useTranslation();"
if hook_stmt.strip() not in content:
    content = re.sub(r"(export const HealthSafety = \(\) => {\n)",
                     r"\g<1>" + hook_stmt + "\n", content, flags=re.DOTALL)

# Replacements
replacements = {
    r">Chargement\.\.\.<": r">{t('common.loading')}<",
    r">Erreur: \{error\}<": r">{t('common.error')}: {error}<",
    r">Santé & Sécurité<": r">{t('healthSafety.title')}<",
    r">Gestion des incidents, formation et conformité<": r">{t('healthSafety.subtitle')}<",
    r"Nouveau document\n": r"{t('healthSafety.newDocBtn')}\n",
    r">Déclarer incident<": r">{t('healthSafety.reportIncidentBtn')}<",
    r">Incidents totaux<": r">{t('healthSafety.totalIncidents')}<",
    r">Incidents ouverts<": r">{t('healthSafety.openIncidents')}<",
    r">Incidents critiques<": r">{t('healthSafety.criticalIncidents')}<",
    r">Actions en cours<": r">{t('healthSafety.pendingActions')}<",
    r">Formation en retard<": r">{t('healthSafety.overdueTraining')}<",
    r">Documents actifs<": r">{t('healthSafety.activeDocs')}<",
    r">\s*Incidents\s*</TabsTrigger>": r">{t('healthSafety.tabIncidents')}</TabsTrigger>",
    r">\s*Documents\s*</TabsTrigger>": r">{t('healthSafety.tabDocs')}</TabsTrigger>",
    r">\s*Formations\s*</TabsTrigger>": r">{t('healthSafety.tabTraining')}</TabsTrigger>",
    r">Aucun incident déclaré<": r">{t('healthSafety.noIncidentTitle')}<",
    r">Commencez par déclarer votre premier incident\.<": r">{t('healthSafety.noIncidentDesc')}<",
    r"\{incident\.location\} • Déclaré par \{incident\.reportedBy\} le \{' '\}\n\s*\{new Date\(incident\.reportedDate\)\.toLocaleDateString\(\)\}": r"{t('healthSafety.incidentReportedBy', { name: incident.reportedBy, date: new Date(incident.reportedDate).toLocaleDateString() })}",
    r"Employé concerné: \{incident\.affectedEmployee\}": r"{t('healthSafety.incidentAffected', { name: incident.affectedEmployee })}",
    r">Actions correctives<": r">{t('healthSafety.incidentActions')}<",
    r"Responsable: \{action\.responsiblePerson\} • Échéance: \{' '\}\n\s*\{new Date\(action\.dueDate\)\.toLocaleDateString\(\)\}": r"{t('healthSafety.actionResponsible', { name: action.responsiblePerson, date: new Date(action.dueDate).toLocaleDateString() })}",
    r">Marquer résolu<": r">{t('healthSafety.markResolvedBtn')}<",
    r">Ajouter action<": r">{t('healthSafety.addActionBtn')}<",
    r">Aucun document<": r">{t('healthSafety.noDocTitle')}<",
    r">Ajoutez des documents de sécurité et conformité\.<": r">{t('healthSafety.noDocDesc')}<",
    r"\{document\.category\} • Version \{document\.version\}": r"{document.category} • {t('healthSafety.docVersion', { version: document.version })}",
    r">Publié le:<": r">{t('healthSafety.docPublishedOn')}<",
    r">Expire le:<": r">{t('healthSafety.docExpiresOn')}<",
    r">Télécharger<": r">{t('healthSafety.downloadBtn')}<",
    r">Voir<": r">{t('healthSafety.viewBtn')}<",
    r"'Document non disponible'": r"t('healthSafety.docNotAvailable')",
    r"'Aucun fichier associé à ce document\.'": r"t('healthSafety.docNotAvailableDesc')",
    r"'Aperçu non disponible'": r"t('healthSafety.previewNotAvailable')",
    r">Aucune formation<": r">{t('healthSafety.noTrainingTitle')}<",
    r">Planifiez des formations de sécurité pour vos employés\.<": r">{t('healthSafety.noTrainingDesc')}<",
    r">Date formation:<": r">{t('healthSafety.trainingDate')}<",
    r">Score:<": r">{t('healthSafety.trainingScore')}<",
    r">Certificat<": r">{t('healthSafety.certificateBtn')}<",
}

for old, new_s in replacements.items():
    content = re.sub(old, new_s, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

