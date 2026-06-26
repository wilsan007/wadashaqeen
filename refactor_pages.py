import re

def insert_translation(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    import_stmt = "import { useTranslation } from 'react-i18next';"
    if import_stmt not in content:
        content = re.sub(r"(import React.*?;\n)", r"\1" + import_stmt + "\n", content, count=1)

    # Add hook inside the component
    hook_stmt = "  const { t } = useTranslation();"
    if hook_stmt.strip() not in content:
        # Match function definition
        content = re.sub(r"(export default function \w+\(\) {\n)",
                         r"\1" + hook_stmt + "\n", content, count=1)
    return content

# ProjectPage
filepath_pp = 'src/pages/ProjectPage.tsx'
content_pp = insert_translation(filepath_pp)
replacements_pp = {
    r">Gestion de Projet<": r">{t('projectPage.gestionBtn')}<",
    r">Gestion des Tâches<": r">{t('projectPage.tasksBtn')}<", 
    # the rest are already translated or we can translate the descriptions using projectsBloc/dashboard if we wanted
    # wait we only have the required strings in i18n
}
for old, new_s in replacements_pp.items():
    content_pp = re.sub(old, new_s, content_pp)

# In ProjectPage we also want to translate Dashboard et outils..., but we can use existing `dashboard.projectsDesc` or similar. Let's just fix the ones we mapped.

with open(filepath_pp, 'w', encoding='utf-8') as f:
    f.write(content_pp)


# TaskManagementPage
filepath_tmp = 'src/pages/TaskManagementPage.tsx'
content_tmp = insert_translation(filepath_tmp)
replacements_tmp = {
    r">Gestion des Tâches<": r">{t('taskManagement.title')}<",
    r">Pilotez vos projets, suivez vos performances et collaborez efficacement avec votre\s*équipe\.<": r">{t('taskManagement.subtitle')}<",
    r">Mes Tâches<": r">{t('tasks.myTasks')}<",
    r">Nouvelle Tâche<": r">{t('tasks.createTask')}<",
}
for old, new_s in replacements_tmp.items():
    content_tmp = re.sub(old, new_s, content_tmp)

with open(filepath_tmp, 'w', encoding='utf-8') as f:
    f.write(content_tmp)

