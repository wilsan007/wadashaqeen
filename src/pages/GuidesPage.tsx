import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Clock, X, CheckCircle2, ArrowRight } from 'lucide-react';

// ─── Guide Content DB ────────────────────────────────────────────────────────

interface Step {
    title: string;
    content: string;
}

interface GuideData {
    title: string;
    duration: string;
    level: string;
    emoji: string;
    intro: string;
    steps: Step[];
    tip?: string;
}

const guideContent: Record<string, GuideData> = {
    'Configurer votre premier projet en 10 min': {
        title: 'Configurer votre premier projet en 10 min',
        duration: '10 min',
        level: 'Débutant',
        emoji: '🚀',
        intro: 'Suivez ces étapes simples pour créer et configurer votre premier projet sur Wadashaqayn. En 10 minutes, votre équipe sera opérationnelle.',
        steps: [
            {
                title: 'Accéder à la section Projets',
                content: 'Depuis le tableau de bord, cliquez sur "Projets" dans le menu latéral gauche. Si c\'est votre première visite, une page de bienvenue s\'affiche — cliquez sur "Créer mon premier projet".',
            },
            {
                title: 'Renseigner les informations du projet',
                content: 'Donnez un nom clair à votre projet (ex : "Lancement site web Q2"). Ajoutez une description optionnelle, une date de début et une date de fin. Choisissez une couleur pour identifier rapidement le projet dans vos listes.',
            },
            {
                title: 'Ajouter les membres de l\'équipe',
                content: 'Dans l\'onglet "Membres", tapez l\'email de vos collaborateurs pour les inviter. Définissez leur rôle : Chef de projet, Contributeur ou Observateur. Un email d\'invitation leur sera automatiquement envoyé.',
            },
            {
                title: 'Créer vos premières tâches',
                content: 'Allez dans l\'onglet "Tâches" et cliquez sur "+ Nouvelle tâche". Donnez un titre, assignez un responsable et définissez une date d\'échéance. Répétez pour chaque tâche principale du projet.',
            },
            {
                title: 'Choisir votre vue de travail',
                content: 'Basculez entre la vue Liste, Kanban ou Gantt selon vos préférences. La vue Kanban est idéale pour les workflows agiles, le Gantt pour la planification temporelle.',
            },
        ],
        tip: 'Astuce : Commencez par créer 5 à 10 tâches principales, puis décomposez-les en sous-tâches. Cela rend le projet clair et gérable dès le départ.',
    },

    'Inviter et gérer votre équipe': {
        title: 'Inviter et gérer votre équipe',
        duration: '7 min',
        level: 'Débutant',
        emoji: '👥',
        intro: 'Découvrez comment ajouter des membres à votre organisation, définir leurs rôles et gérer leurs accès facilement.',
        steps: [
            {
                title: 'Aller dans les paramètres de l\'organisation',
                content: 'Cliquez sur votre avatar en haut à droite, puis sur "Paramètres". Dans le menu de gauche, sélectionnez "Membres & Rôles".',
            },
            {
                title: 'Inviter un nouveau membre',
                content: 'Cliquez sur "Inviter un membre". Saisissez l\'adresse email de la personne. Un email d\'invitation avec un lien d\'activation lui sera envoyé automatiquement. Le lien expire après 48 heures.',
            },
            {
                title: 'Attribuer un rôle',
                content: 'Choisissez le rôle approprié : Administrateur (accès total), Manager (gestion des projets et équipes), Employé (accès à ses propres tâches et modules). Vous pouvez changer le rôle à tout moment.',
            },
            {
                title: 'Gérer les accès aux modules',
                content: 'Pour chaque membre, vous pouvez activer ou désactiver l\'accès aux modules spécifiques : RH, Projets, Finances, etc. Cela permet un contrôle précis des données visibles par chaque utilisateur.',
            },
            {
                title: 'Désactiver un compte',
                content: 'Si un employé quitte l\'organisation, cliquez sur les 3 points (...) à côté de son nom et choisissez "Désactiver le compte". Il ne pourra plus se connecter mais ses données et historique sont conservés.',
            },
        ],
        tip: 'Astuce : Créez des groupes (ex : "Équipe RH", "Équipe Commerciale") pour gérer les permissions de façon groupée et gagner du temps.',
    },

    'Paramétrer les permissions et rôles': {
        title: 'Paramétrer les permissions et rôles',
        duration: '12 min',
        level: 'Intermédiaire',
        emoji: '🔒',
        intro: 'Apprenez à configurer des rôles personnalisés pour contrôler précisément ce que chaque membre peut voir et faire dans votre organisation.',
        steps: [
            {
                title: 'Comprendre les rôles par défaut',
                content: 'Wadashaqayn propose 3 rôles de base : Super Administrateur (contrôle total), Administrateur (gestion des membres et paramètres), Manager (gestion de projets et équipes), Employé (accès limité à ses modules).',
            },
            {
                title: 'Créer un rôle personnalisé',
                content: 'Dans Paramètres > Rôles, cliquez sur "+ Nouveau rôle". Donnez-lui un nom (ex : "Comptable"), une description, et sélectionnez précisément quelles actions ce rôle peut effectuer dans chaque module.',
            },
            {
                title: 'Configurer les permissions par module',
                content: 'Pour chaque module (Projets, RH, Finance, etc.), définissez les droits : Lire, Créer, Modifier, Supprimer. Un comptable n\'aura, par exemple, accès qu\'aux modules Finances et Notes de frais.',
            },
            {
                title: 'Assigner le rôle aux membres',
                content: 'Dans Membres & Rôles, sélectionnez un membre et changez son rôle depuis la liste déroulante. Le changement prend effet immédiatement — lors de sa prochaine action, il verra les nouvelles permissions.',
            },
            {
                title: 'Tester les permissions',
                content: 'Utilisez la fonctionnalité "Voir en tant que..." pour simuler ce qu\'un rôle voit dans l\'interface. Cela vous permet de vérifier que les accès sont correctement configurés avant de déployer largement.',
            },
        ],
        tip: 'Bonne pratique : Appliquez le principe du "moindre privilège" — donnez à chaque rôle uniquement les accès nécessaires à ses missions.',
    },

    'Maîtriser la vue Gantt': {
        title: 'Maîtriser la vue Gantt',
        duration: '15 min',
        level: 'Intermédiaire',
        emoji: '📅',
        intro: 'La vue Gantt est l\'outil idéal pour visualiser l\'avancement d\'un projet sur une ligne du temps. Apprenez à en tirer le maximum.',
        steps: [
            {
                title: 'Accéder à la vue Gantt',
                content: 'Depuis un projet, cliquez sur l\'icône Gantt dans la barre de vues en haut à droite. Le Gantt affiche toutes vos tâches sous forme de barres horizontales sur un axe temporel.',
            },
            {
                title: 'Naviguer dans le Gantt',
                content: 'Utilisez la molette de la souris pour zoomer (jour/semaine/mois/trimestre). Faites glisser horizontalement pour naviguer dans le temps. Cliquez sur une barre pour voir les détails de la tâche.',
            },
            {
                title: 'Déplacer et redimensionner les tâches',
                content: 'Faites glisser une barre pour déplacer la tâche dans le temps. Tirez les extrémités pour modifier la durée. Les modifications sont sauvegardées automatiquement et synchronisées pour toute l\'équipe.',
            },
            {
                title: 'Créer des dépendances',
                content: 'Pour créer une dépendance (une tâche qui ne peut démarrer qu\'après une autre), survolez la fin d\'une barre jusqu\'à voir une flèche, puis faites glisser vers la tâche suivante. La dépendance apparaît comme une flèche entre les deux barres.',
            },
            {
                title: 'Utiliser les jalons',
                content: 'Les jalons (milestones) sont des points clés sans durée. Cliquez sur "+ Jalon" pour en créer un. Ils apparaissent comme des losanges sur le Gantt et signalent les échéances importantes du projet.',
            },
        ],
        tip: 'Astuce : Utilisez le chemin critique (le chemin le plus long de dépendances) pour identifier quelles tâches, si elles prennent du retard, feront déraper tout le projet.',
    },

    'Organiser vos tâches en Kanban': {
        title: 'Organiser vos tâches en Kanban',
        duration: '8 min',
        level: 'Débutant',
        emoji: '🎯',
        intro: 'Le Kanban est parfait pour visualiser le flux de travail de votre équipe. Découvrez comment organiser et optimiser vos tâches en colonnes.',
        steps: [
            {
                title: 'Accéder à la vue Kanban',
                content: 'Dans un projet, cliquez sur l\'icône Kanban (tableau avec colonnes) dans la barre de vues. Par défaut, trois colonnes s\'affichent : À faire, En cours, Terminé.',
            },
            {
                title: 'Personnaliser les colonnes',
                content: 'Cliquez sur "+ Ajouter une colonne" pour créer de nouveaux statuts adaptés à votre workflow (ex : "En révision", "Bloqué", "Validé"). Renommez ou supprimez les colonnes existantes selon vos besoins.',
            },
            {
                title: 'Déplacer les cartes',
                content: 'Faites glisser une carte de tâche d\'une colonne à une autre pour changer son statut. Vous pouvez aussi cliquer sur la carte et changer le statut depuis le menu déroulant dans le panneau de détails.',
            },
            {
                title: 'Filtrer et regrouper',
                content: 'Utilisez les filtres (par assigné, par priorité, par date) pour n\'afficher que les tâches pertinentes. Regroupez les cartes par assigné pour voir la charge de travail de chaque membre.',
            },
            {
                title: 'Limiter le travail en cours (WIP)',
                content: 'Pour les équipes agiles, définissez une limite WIP sur chaque colonne (ex : max 3 tâches "En cours"). Cela évite les goulots d\'étranglement et améliore la fluidité du flux de travail.',
            },
        ],
        tip: 'Conseil agile : Organisez des "stand-up" quotidiens de 15 min en regardant le Kanban. Chaque membre dit ce qu\'il a fait, ce qu\'il va faire, et les éventuels blocages.',
    },

    'Créer des rapports de projet': {
        title: 'Créer des rapports de projet',
        duration: '10 min',
        level: 'Intermédiaire',
        emoji: '📊',
        intro: 'Générez des rapports clairs pour suivre l\'avancement de vos projets et communiquer avec vos parties prenantes.',
        steps: [
            {
                title: 'Accéder à la section Rapports',
                content: 'Depuis un projet, cliquez sur l\'onglet "Rapports" ou accédez à la section globale "Analytics" depuis le menu latéral pour les rapports multi-projets.',
            },
            {
                title: 'Choisir un modèle de rapport',
                content: 'Sélectionnez parmi les modèles disponibles : Rapport d\'avancement (% de tâches terminées), Rapport de charge (qui fait quoi), Rapport de délais (retards et alertes), Rapport budgétaire (si applicable).',
            },
            {
                title: 'Configurer la période et les filtres',
                content: 'Définissez la période du rapport (semaine, mois, trimestre). Filtrez par projet, équipe, ou membre. Les graphiques et tableaux se mettent à jour en temps réel selon vos sélections.',
            },
            {
                title: 'Personnaliser les graphiques',
                content: 'Ajoutez ou retirez des métriques selon vos besoins. Changez le type de graphique (barres, courbes, camembert). Réorganisez les blocs par glisser-déposer pour créer la mise en page idéale.',
            },
            {
                title: 'Exporter et partager',
                content: 'Exportez le rapport en PDF pour vos réunions ou en CSV pour une analyse dans Excel. Partagez un lien de rapport en lecture seule avec des parties prenantes externes, sans qu\'ils aient besoin de compte.',
            },
        ],
        tip: 'Astuce : Programmez l\'envoi automatique de rapports hebdomadaires par email à vos managers depuis les paramètres de notification.',
    },

    'Gérer les congés et absences': {
        title: 'Gérer les congés et absences',
        duration: '10 min',
        level: 'Débutant',
        emoji: '🌴',
        intro: 'Apprenez à configurer et gérer les demandes de congés et d\'absences de votre équipe de façon simple et transparente.',
        steps: [
            {
                title: 'Configurer les types d\'absence',
                content: 'Dans RH > Paramètres > Types d\'absence, créez les catégories adaptées à votre organisation : Congés annuels, Congé maladie, Congé sans solde, RTT, Télétravail, etc. Définissez pour chacun le mode de décompte et les règles d\'approbation.',
            },
            {
                title: 'Définir les soldes de congés',
                content: 'Dans RH > Soldes de congés, configurez le solde initial de chaque employé pour l\'année en cours. Vous pouvez faire des ajustements manuels (jours bonus, report de l\'année précédente).',
            },
            {
                title: 'Soumettre une demande (côté employé)',
                content: 'L\'employé va dans Mon Espace > Mes Absences, clique sur "+ Demande d\'absence", choisit le type, les dates et ajoute une note optionnelle. La demande est soumise au responsable pour validation.',
            },
            {
                title: 'Approuver ou refuser une demande',
                content: 'Le manager reçoit une notification et peut approuver ou refuser depuis RH > Demandes en attente. En cas de refus, un commentaire peut être ajouté pour expliquer la décision à l\'employé.',
            },
            {
                title: 'Consulter le planning des absences',
                content: 'Dans RH > Planning, visualisez toutes les absences de l\'équipe sur un calendrier. Idéal pour éviter que trop de personnes soient absentes simultanément sur des périodes clés.',
            },
        ],
        tip: 'Conseil : Activez les notifications automatiques pour que les managers soient alertés 3 jours avant l\'expiration d\'une demande en attente.',
    },

    'Configurer les feuilles de temps': {
        title: 'Configurer les feuilles de temps',
        duration: '12 min',
        level: 'Intermédiaire',
        emoji: '⏱️',
        intro: 'Les feuilles de temps permettent à vos équipes de saisir leurs heures travaillées par projet et par tâche. Voici comment configurer et utiliser cet outil.',
        steps: [
            {
                title: 'Activer le module Timesheets',
                content: 'Dans Paramètres > Modules, assurez-vous que "Feuilles de temps" est activé. Définissez la semaine de travail standard (jours ouvrés et horaires) qui servira de référence pour les calculs.',
            },
            {
                title: 'Configurer les projets timables',
                content: 'Pour chaque projet, indiquez si le suivi du temps est requis pour les membres. Vous pouvez définir un budget d\'heures maximum par projet pour recevoir des alertes si ce budget est dépassé.',
            },
            {
                title: 'Saisir ses heures (côté employé)',
                content: 'L\'employé accède à Mon Espace > Mes Feuilles de temps. Il sélectionne la semaine, clique sur une case horaire et renseigne le projet, la tâche et le nombre d\'heures. Il peut aussi utiliser le chronomètre intégré.',
            },
            {
                title: 'Soumettre la feuille de temps',
                content: 'En fin de semaine, l\'employé clique sur "Soumettre pour validation". Le manager reçoit une notification. Une fois validée, la feuille est verrouillée et alimente les rapports de productivité.',
            },
            {
                title: 'Analyser les données de temps',
                content: 'Dans Analytics > Temps, visualisez la répartition des heures par projet, par membre et par période. Exportez ces données pour la facturation client ou la gestion de la paie des équipes au forfait.',
            },
        ],
        tip: 'Astuce : Encouragez vos équipes à saisir leurs heures chaque jour plutôt qu\'en fin de semaine pour plus de précision et moins d\'oublis.',
    },

    'Évaluer les performances': {
        title: 'Évaluer les performances',
        duration: '15 min',
        level: 'Avancé',
        emoji: '🏆',
        intro: 'Mettez en place un système d\'évaluation des performances structuré et transparent pour accompagner la croissance de vos équipes.',
        steps: [
            {
                title: 'Créer des critères d\'évaluation',
                content: 'Dans RH > Performances > Critères, définissez les axes d\'évaluation adaptés à votre organisation : Résultats, Compétences, Comportements, Leadership. Pour chaque axe, créez des indicateurs précis et mesurables.',
            },
            {
                title: 'Configurer les cycles d\'évaluation',
                content: 'Définissez la fréquence d\'évaluation (semestrielle, annuelle) et les dates des campagnes. Le système enverra automatiquement les formulaires aux managers et employés à la bonne période.',
            },
            {
                title: 'Compléter l\'auto-évaluation (employé)',
                content: 'Chaque employé reçoit un formulaire d\'auto-évaluation. Il note ses propres performances sur chaque critère et décrit ses réalisations de la période. Cette étape favorise la réflexivité et prépare l\'entretien.',
            },
            {
                title: 'Réaliser l\'évaluation manager',
                content: 'Le manager complète sa propre évaluation de l\'employé en parallèle. Le système compare les deux évaluations et met en évidence les convergences et divergences de perception.',
            },
            {
                title: 'Conduire l\'entretien et valider',
                content: 'Utilisez le rapport comparatif lors de l\'entretien individuel. Définissez ensemble les objectifs pour la prochaine période. Validez l\'évaluation finale dans le système — elle devient visible par les deux parties.',
            },
        ],
        tip: 'Conseil RH : Associez les évaluations à des plans de développement individuels (formations, évolutions) pour motiver vos collaborateurs sur le long terme.',
    },

    'Créer un tableau de bord personnalisé': {
        title: 'Créer un tableau de bord personnalisé',
        duration: '12 min',
        level: 'Intermédiaire',
        emoji: '📈',
        intro: 'Construisez un tableau de bord sur mesure qui affiche exactement les KPIs et métriques dont vous avez besoin pour piloter votre activité.',
        steps: [
            {
                title: 'Accéder à la création de dashboard',
                content: 'Depuis la section Analytics, cliquez sur "+ Nouveau tableau de bord". Donnez-lui un nom parlant (ex : "Dashboard RH Mensuel", "Suivi Projets Q2") et choisissez qui peut le voir : vous seul, votre équipe, ou toute l\'organisation.',
            },
            {
                title: 'Ajouter des widgets',
                content: 'Cliquez sur "+ Widget" pour ajouter des blocs de visualisation. Choisissez parmi : graphique à barres, courbe, camembert, compteur, tableau de données, carte de chaleur. Chaque widget peut être relié à une source de données différente.',
            },
            {
                title: 'Configurer chaque widget',
                content: 'Pour chaque widget, sélectionnez la métrique à afficher (tâches complétées, heures travaillées, budget consommé...), la période (7 jours, 30 jours, personnalisée), et les filtres (par projet, par équipe).',
            },
            {
                title: 'Organiser la mise en page',
                content: 'Faites glisser les widgets pour les réorganiser. Redimensionnez-les en tirant leurs coins. Créez un layout logique : KPIs clés en haut, graphiques d\'évolution au milieu, tableaux de détails en bas.',
            },
            {
                title: 'Définir le tableau de bord par défaut',
                content: 'Cliquez sur "⭐ Définir par défaut" pour que ce dashboard s\'affiche à chaque connexion. Partagez-le avec votre équipe en cliquant sur "Partager" et en sélectionnant les membres destinataires.',
            },
        ],
        tip: 'Conseil : Créez un dashboard pour chaque audience — un dashboard opérationnel pour les managers, un dashboard stratégique pour la direction.',
    },

    'Exporter et partager des rapports': {
        title: 'Exporter et partager des rapports',
        duration: '8 min',
        level: 'Débutant',
        emoji: '📤',
        intro: 'Apprenez à exporter vos données et à partager vos rapports avec des collègues ou des parties prenantes externes.',
        steps: [
            {
                title: 'Exporter en PDF',
                content: 'Sur n\'importe quel rapport ou tableau de bord, cliquez sur l\'icône d\'export (↓) en haut à droite. Choisissez "PDF". Le système génère un fichier PDF formaté avec votre logo et les données actuelles. Parfait pour les présentations.',
            },
            {
                title: 'Exporter en CSV/Excel',
                content: 'Choisissez "CSV" ou "Excel" pour récupérer les données brutes dans un format exploitable. Vous pourrez ensuite effectuer des analyses supplémentaires dans un tableur ou importer les données dans un autre outil.',
            },
            {
                title: 'Générer un lien de partage',
                content: 'Cliquez sur "Partager un lien". Le système génère un lien unique en lecture seule valable 30 jours. Les destinataires peuvent consulter le rapport sans avoir de compte Wadashaqayn.',
            },
            {
                title: 'Envoyer par email',
                content: 'Cliquez sur "Envoyer par email". Saisissez les adresses des destinataires et ajoutez un message personnalisé. Le rapport est joint en PDF ou intégré directement dans l\'email selon votre choix.',
            },
            {
                title: 'Programmer les envois automatiques',
                content: 'Dans les paramètres du rapport, activez "Envoi automatique". Choisissez la fréquence (hebdomadaire, mensuelle) et les destinataires. Ils recevront automatiquement le rapport mis à jour sans aucune action de votre part.',
            },
        ],
        tip: 'Sécurité : Les liens de partage peuvent être révoqués à tout moment depuis les paramètres de partage. Pensez-y pour les rapports sensibles.',
    },

    'Analyser la productivité de l\'équipe': {
        title: 'Analyser la productivité de l\'équipe',
        duration: '15 min',
        level: 'Avancé',
        emoji: '🔬',
        intro: 'Utilisez les outils analytiques avancés de Wadashaqayn pour mesurer, comprendre et améliorer la productivité de votre équipe.',
        steps: [
            {
                title: 'Accéder aux rapports de productivité',
                content: 'Dans Analytics > Productivité, trouvez les tableaux de bord dédiés à la performance d\'équipe. Ces rapports agrègent les données de tâches, feuilles de temps, et objectifs pour une vue complète.',
            },
            {
                title: 'Analyser le taux de complétion',
                content: 'Le taux de complétion (tâches terminées / tâches planifiées) est l\'indicateur de base. Suivez son évolution dans le temps et comparez les équipes ou les projets pour identifier les zones de sous-performance.',
            },
            {
                title: 'Étudier la vélocité',
                content: 'La vélocité mesure combien de travail l\'équipe accomplit par sprint ou par semaine. Un graphique de vélocité stable indique une équipe fiable. Des pics et creux importants signalent des problèmes d\'estimation ou de charge.',
            },
            {
                title: 'Identifier les goulots d\'étranglement',
                content: 'Le rapport "Flux de travail" montre combien de temps les tâches passent dans chaque statut. Si beaucoup de tâches s\'accumulent en "En révision", cela indique un goulot d\'étranglement à ce stade du processus.',
            },
            {
                title: 'Mettre en place des plans d\'action',
                content: 'À partir des insights, créez des plans d\'action concrets : redistribuer la charge, ajuster les processus, former les membres sur les points faibles identifiés. Réévaluez dans 4 semaines pour mesurer l\'impact.',
            },
        ],
        tip: 'Important : Les données de productivité sont des outils d\'aide à la décision, pas de surveillance. Partagez les résultats avec vos équipes dans un esprit de co-amélioration.',
    },
};

// ─── Guide Modal ──────────────────────────────────────────────────────────────

function GuideModal({ guide, onClose }: { guide: GuideData; onClose: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const isLast = currentStep === guide.steps.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{guide.emoji}</span>
                        <div>
                            <h2 className="font-bold text-white leading-tight">{guide.title}</h2>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {guide.duration}</span>
                                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">{guide.level}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Intro (only on step 0) */}
                    {currentStep === 0 && (
                        <p className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-200">
                            {guide.intro}
                        </p>
                    )}

                    {/* Current step */}
                    <div className="mb-6">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-white">
                                {currentStep + 1}
                            </div>
                            <h3 className="font-semibold text-white">{guide.steps[currentStep].title}</h3>
                        </div>
                        <p className="ml-11 text-sm leading-relaxed text-gray-300">
                            {guide.steps[currentStep].content}
                        </p>
                    </div>

                    {/* Step indicators */}
                    <div className="ml-11 flex gap-2">
                        {guide.steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentStep(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === currentStep
                                        ? 'w-6 bg-cyan-400'
                                        : i < currentStep
                                            ? 'w-2 bg-cyan-600 cursor-pointer'
                                            : 'w-2 bg-slate-600 cursor-pointer hover:bg-slate-500'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Tip (on last step) */}
                    {isLast && guide.tip && (
                        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <p className="text-sm leading-relaxed text-emerald-300">
                                💡 <span className="font-medium">Conseil : </span>{guide.tip.replace(/^(Astuce|Conseil.*?) : /, '')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 p-4">
                    <button
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Précédent
                    </button>

                    <span className="text-xs text-gray-500">
                        Étape {currentStep + 1} / {guide.steps.length}
                    </span>

                    {isLast ? (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 transition-all"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Terminé
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep((s) => s + 1)}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 transition-all"
                        >
                            Suivant
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Guide Card ───────────────────────────────────────────────────────────────

interface GuideItem {
    title: string;
    duration: string;
    level: string;
}

function GuideCard({
    guide,
    accent,
    color,
    onOpen,
}: {
    guide: GuideItem;
    accent: string;
    color: string;
    onOpen: () => void;
}) {
    return (
        <div
            className={`group cursor-pointer rounded-2xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${color}`}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full border border-current/30 bg-current/10 px-3 py-1 text-xs font-medium ${accent}`}>
                    {guide.level}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {guide.duration}
                </span>
            </div>
            <h3 className="mb-2 font-semibold text-white leading-snug">{guide.title}</h3>
            <div className={`flex items-center gap-1 text-xs ${accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Lire le guide <ChevronRight className="h-3 w-3" />
            </div>
        </div>
    );
}

// ─── Guide Groups ─────────────────────────────────────────────────────────────

const groups = [
    {
        category: 'Démarrage',
        color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        accent: 'text-cyan-400',
        items: [
            { title: 'Configurer votre premier projet en 10 min', duration: '10 min', level: 'Débutant' },
            { title: 'Inviter et gérer votre équipe', duration: '7 min', level: 'Débutant' },
            { title: 'Paramétrer les permissions et rôles', duration: '12 min', level: 'Intermédiaire' },
        ],
    },
    {
        category: 'Gestion de Projets',
        color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        accent: 'text-purple-400',
        items: [
            { title: 'Maîtriser la vue Gantt', duration: '15 min', level: 'Intermédiaire' },
            { title: 'Organiser vos tâches en Kanban', duration: '8 min', level: 'Débutant' },
            { title: 'Créer des rapports de projet', duration: '10 min', level: 'Intermédiaire' },
        ],
    },
    {
        category: 'Ressources Humaines',
        color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
        accent: 'text-emerald-400',
        items: [
            { title: 'Gérer les congés et absences', duration: '10 min', level: 'Débutant' },
            { title: 'Configurer les feuilles de temps', duration: '12 min', level: 'Intermédiaire' },
            { title: 'Évaluer les performances', duration: '15 min', level: 'Avancé' },
        ],
    },
    {
        category: 'Analytiques & Rapports',
        color: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
        accent: 'text-orange-400',
        items: [
            { title: 'Créer un tableau de bord personnalisé', duration: '12 min', level: 'Intermédiaire' },
            { title: 'Exporter et partager des rapports', duration: '8 min', level: 'Débutant' },
            { title: "Analyser la productivité de l'équipe", duration: '15 min', level: 'Avancé' },
        ],
    },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuidesPage() {
    const [activeGuide, setActiveGuide] = useState<GuideData | null>(null);

    const openGuide = (title: string) => {
        const data = guideContent[title];
        if (data) setActiveGuide(data);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-gray-100">
            {/* Header */}
            <div className="border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl">
                <div className="container mx-auto flex items-center gap-4 px-4 py-4">
                    <Link to="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Accueil</span>
                    </Link>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm text-gray-400">Guides</span>
                </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),transparent_70%)]" />
                <div className="relative container mx-auto px-4">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
                        📖 Guides pas à pas
                    </div>
                    <h1 className="mb-4 text-4xl font-extrabold md:text-6xl">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Guides pratiques
                        </span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-gray-400">
                        Des tutoriels pas à pas pour tirer le meilleur de Wadashaqayn, quel que soit votre niveau.
                        <br />
                        <span className="text-sm text-gray-500">Cliquez sur un guide pour le consulter.</span>
                    </p>
                </div>
            </div>

            {/* Guides */}
            <div className="container mx-auto px-4 py-16 space-y-12">
                {groups.map((group) => (
                    <div key={group.category}>
                        <h2 className="mb-6 text-xl font-bold text-white">{group.category}</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {group.items.map((guide) => (
                                <GuideCard
                                    key={guide.title}
                                    guide={guide}
                                    accent={group.accent}
                                    color={group.color}
                                    onOpen={() => openGuide(guide.title)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Wadashaqayn ·{' '}
                <Link to="/privacy" className="hover:text-cyan-400">Confidentialité</Link>{' · '}
                <Link to="/terms" className="hover:text-cyan-400">CGU</Link>
            </footer>

            {/* Modal */}
            {activeGuide && (
                <GuideModal guide={activeGuide} onClose={() => setActiveGuide(null)} />
            )}
        </div>
    );
}
