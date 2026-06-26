import re

filepath = 'src/components/operations/OperationsPage.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { useTranslation } from 'react-i18next';"
if import_stmt not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt + "\n", content, count=1)

# Add hook inside the component
# Match `export const OperationsPage: React.FC = () => {`
hook_stmt = "  const { t } = useTranslation();"
if hook_stmt.strip() not in content:
    content = re.sub(r"(export const OperationsPage: React\.FC = \(\) => {\n)",
                     r"\1" + hook_stmt + "\n", content, count=1)

# Replacements
replacements = {
    r"Activités Opérationnelles": r"{t('operations.pageTitle')}",
    r">Gérez vos tâches récurrentes et ponctuelles hors projet<": r">{t('operations.pageDesc')}<",
    r"Nouvelle Récurrente": r"{t('operations.newRecurringBtn')}",
    r"Nouvelle Ponctuelle": r"{t('operations.newOneOffBtn')}",
    r"'Récurrente'": r"t('operations.newRecurringBtnMobile')",
    r"'Ponctuelle'": r"t('operations.newOneOffBtnMobile')",
    r">Total<": r">{t('operations.metricTotal')}<",
    r">À faire<": r">{t('operations.metricTodo')}<",
    r">Non commencées<": r">{t('operations.metricTodoDesc')}<",
    r">En cours<": r">{t('operations.metricInProgress')}<",
    r">Actives<": r"{(t('operations.metricInProgressDesc'))}<",
    r">Terminées<": r">{t('operations.metricCompleted')}<",
    r">Complétées<": r">{t('operations.metricCompletedDesc')}<",
    r"placeholder=\"Rechercher une activité\.\.\.\"": r"placeholder={t('operations.searchPlaceholder')}",
    r"placeholder=\"Type\"": r"placeholder={t('operations.filterType')}",
    r">Tous les types<": r">{t('operations.filterAllTypes')}<",
    r">Récurrentes<": r">{t('operations.filterRecurring')}<",
    r">Ponctuelles<": r">{t('operations.filterOneOff')}<",
    r"placeholder=\"Statut\"": r"placeholder={t('operations.filterStatus')}",
    r">Tous les statuts<": r">{t('operations.filterAllStatus')}<",
    r">Actives<": r">{t('operations.filterActive')}<",
    r">Inactives<": r">{t('operations.filterInactive')}<",
    r"Chargement des activités\.\.\.": r"{t('operations.loading')}",
    r"Erreur lors du chargement": r"{t('operations.loadError')}",
    r">Réessayer<": r">{t('operations.retryBtn')}<",
    r">Aucune activité trouvée<": r">{t('operations.noActivity')}<",
    r"Créez votre première activité récurrente ou ponctuelle": r"{t('operations.createFirstActivity')}",
    r">Créer une récurrente<": r">{t('operations.createRecurringBtn')}<",
    r">Créer une ponctuelle<": r">{t('operations.createOneOffBtn')}<",
    r"Mode Cards temporairement désactivé": r"{t('operations.cardsDisabledTitle')}",
    r"Utilisez le mode Tableau pour gérer vos tâches opérationnelles": r"{t('operations.cardsDisabledDesc')}",
    r">Basculer en mode Tableau<": r">{t('operations.switchToTableBtn')}<",
}

for old, new_s in replacements.items():
    content = re.sub(old, new_s, content)

# Some specific replacements need edge cases fixes
# e.g `>{(t('operations.metricInProgressDesc'))}<` is ugly, change {(t('operations.metricInProgressDesc'))} to {t('operations.metricInProgressDesc')}
content = content.replace("{(t('operations.metricInProgressDesc'))}", "{t('operations.metricInProgressDesc')}")

# `{'Nouvelle Récurrente'}` in the ternary `isMobile ? 'Récurrente' : 'Nouvelle Récurrente'`
content = content.replace("""isMobile ? t('operations.newRecurringBtnMobile') : {t('operations.pageTitle')}""", """isMobile ? t('operations.newRecurringBtnMobile') : t('operations.newRecurringBtn')""")
content = content.replace("""isMobile ? t('operations.newOneOffBtnMobile') : {t('operations.newOneOffBtn')}""", """isMobile ? t('operations.newOneOffBtnMobile') : t('operations.newOneOffBtn')""")

# Another check for `{t('operations.pageTitle')}` in string where it was just text
# `<h1>{t('operations.pageTitle')}</h1>` => good
# Let's fix the ternary manually
content = re.sub(r"isMobile \? t\('operations\.newRecurringBtnMobile'\) : \{t\('operations\.[^']+'\)\}", r"isMobile ? t('operations.newRecurringBtnMobile') : t('operations.newRecurringBtn')", content)
content = re.sub(r"isMobile \? t\('operations\.newRecurringBtnMobile'\) : Nouvelle Récurrente", r"isMobile ? t('operations.newRecurringBtnMobile') : t('operations.newRecurringBtn')", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

