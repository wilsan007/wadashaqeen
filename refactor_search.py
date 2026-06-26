import re

filepath = 'src/components/tasks/AdvancedTaskSearch.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { useTranslation } from 'react-i18next';"
if import_stmt not in content:
    content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt + "\n", content, count=1)

# Add hook inside the component
hook_stmt = "  const { t } = useTranslation();"
if hook_stmt.strip() not in content:
    content = re.sub(r"(export const AdvancedTaskSearch: React\.FC = \(\) => {\n)",
                     r"\1" + hook_stmt + "\n", content, count=1)

# Replacements
replacements = {
    r">Explorateur<": r">{t('taskSearch.explorerTitle')}<",
    r">Recherche avancée et filtres intelligents<": r">{t('taskSearch.explorerDesc')}<",
    r"placeholder=\"Rechercher une tâche, un bug, une feature\.\.\.\"": r"placeholder={t('taskSearch.searchPlaceholder')}",
    r">Filtres Actifs<": r">{t('taskSearch.activeFilters')}<",
    r">Statut<": r">{t('taskSearch.statusLabel')}<",
    r"status === 'todo' \? 'À faire' : status === 'doing' \? 'En cours' : 'Terminé'": r"status === 'todo' ? t('taskSearch.statusTodo') : status === 'doing' ? t('taskSearch.statusDoing') : t('taskSearch.statusDone')",
    r">Priorité<": r">{t('taskSearch.priorityLabel')}<",
    r">Projet<": r">{t('taskSearch.projectLabel')}<",
    r"placeholder=\"Tous les projets\"": r"placeholder={t('taskSearch.allProjects')}",
    r">Tous les projets<": r">{t('taskSearch.allProjects')}<",
    r">En retard uniquement<": r">{t('taskSearch.overdueOnly')}<",
    r">Réinitialiser les filtres<": r">{t('taskSearch.resetFilters')}<",
    r"\{filteredTasks\.length\} résultat\{filteredTasks\.length > 1 \? 's' : ''\}": r"{filteredTasks.length === 1 ? t('taskSearch.resultsCount', { count: 1 }) : t('taskSearch.resultsCountPlural', { count: filteredTasks.length })}",
    r">Supprimer \(\{selectedTasks\.size\}\)<": r">{t('taskSearch.deleteSelected', { count: selectedTasks.size })}<",
    r">Terminer \(\{selectedTasks\.size\}\)<": r">{t('taskSearch.completeSelected', { count: selectedTasks.size })}<",
    r">Aucun résultat<": r">{t('taskSearch.noResultsTitle')}<",
    r">Essayez de modifier vos filtres<": r">{t('taskSearch.noResultsDesc')}<",
    r">Supprimer \{selectedTasks\.size\} tâche\(s\) \?<": r">{t('taskSearch.confirmDeleteTitle', { count: selectedTasks.size })}<",
    r">Cette action est irréversible\. Les tâches sélectionnées seront définitivement supprimées\.<": r">{t('taskSearch.confirmDeleteDesc')}<",
}

for old, new_s in replacements.items():
    content = re.sub(old, new_s, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

