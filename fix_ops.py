import re

filepath = 'src/components/operations/OperationsEmptyState.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the ones that didn't match
replacements = {
    r"Les tâches récurrentes sont générées automatiquement chaque jour par le système": r"{t('operations.featAutoDesc')}",
    r"Créez des checklists qui seront automatiquement clonées sur chaque tâche": r"{t('operations.featActionsDesc')}",
    r"Suivez le taux de complétion et les performances de vos activités": r"{t('operations.featStatsDesc')}",
    r"Consultez la documentation": r"{t('operations.docsLink')}"
}

for old, new_s in replacements.items():
    content = re.sub(old, new_s, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

