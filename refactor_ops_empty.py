import re

filepath = 'src/components/operations/OperationsEmptyState.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { useTranslation } from 'react-i18next';"
if import_stmt not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt + "\n", content, count=1)

# Add hook inside the component
hook_stmt = "  const { t } = useTranslation();"
if hook_stmt.strip() not in content:
    content = re.sub(r"(export const OperationsEmptyState: React\.FC<OperationsEmptyStateProps> = \({.*?}\) => {\n)",
                     r"\g<1>" + hook_stmt + "\n", content, flags=re.DOTALL)

# Replacements
replacements = {
    r">Activités Opérationnelles<": r">{t('operations.pageTitle')}<",
    r">Automatisez vos tâches récurrentes et planifiez vos opérations ponctuelles hors projet<": r">{t('operations.emptyHeroDesc')}<",
    r">Activités Récurrentes<": r">{t('operations.emptyRecurringTitle')}<",
    r">Génération automatique de tâches selon une planification \(quotidienne,\n\s*hebdomadaire, mensuelle\)<": r">{t('operations.emptyRecurringDesc')}<",
    r">Réunions d'équipe hebdomadaires<": r">{t('operations.emptyRecurringItem1')}<",
    r">Rapports mensuels automatiques<": r">{t('operations.emptyRecurringItem2')}<",
    r">Audits de sécurité trimestriels<": r">{t('operations.emptyRecurringItem3')}<",
    r"Créer une activité récurrente": r"{t('operations.createRecurringBtn')}",
    r">Activités Ponctuelles<": r">{t('operations.emptyOneOffTitle')}<",
    r">Création manuelle d'une tâche unique à une date précise<": r">{t('operations.emptyOneOffDesc')}<",
    r">Événement spécial ponctuel<": r">{t('operations.emptyOneOffItem1')}<",
    r">Formation unique planifiée<": r">{t('operations.emptyOneOffItem2')}<",
    r">Audit exceptionnel à date fixe<": r">{t('operations.emptyOneOffItem3')}<",
    r"Créer une activité ponctuelle": r"{t('operations.createOneOffBtn')}",
    r">Fonctionnalités Clés<": r">{t('operations.featuresTitle')}<",
    r">Génération Automatique<": r">{t('operations.featAutoTitle')}<",
    r">Les tâches récurrentes sont générées automatiquement chaque jour par le système<": r">{t('operations.featAutoDesc')}<",
    r">Actions Prédéfinies<": r">{t('operations.featActionsTitle')}<",
    r">Créez des checklists qui seront automatiquement clonées sur chaque tâche<": r">{t('operations.featActionsDesc')}<",
    r">Statistiques Détaillées<": r">{t('operations.featStatsTitle')}<",
    r">Suivez le taux de complétion et les performances de vos activités<": r">{t('operations.featStatsDesc')}<",
    r"Besoin d'aide pour démarrer \?": r"{t('operations.needHelp')}",
    r">Consultez la documentation<": r">{t('operations.docsLink')}<",
}

for old, new_s in replacements.items():
    content = re.sub(old, new_s, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

