import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const LAST_UPDATED = '06 mai 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            Conditions générales d&apos;utilisation
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Titre */}
        <div className="mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
            <FileText className="h-3 w-3" />
            Conditions générales d&apos;utilisation
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-zinc-400">
            Dernière mise à jour : <time dateTime="2026-05-06">{LAST_UPDATED}</time>
          </p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-zinc-300">

          {/* 1 */}
          <Section title="1. Objet et acceptation">
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et
              l&apos;utilisation de la plateforme SaaS{' '}
              <strong className="text-zinc-100">Wadashaqayn</strong>, accessible à l&apos;adresse{' '}
              <a
                href="https://wadashaqayn.org"
                className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
              >
                https://wadashaqayn.org
              </a>
              , éditée par la société Wadashaqayn, sise à Djibouti, République de Djibouti
              (ci-après &laquo;&nbsp;l&apos;Éditeur&nbsp;&raquo;).
            </p>
            <p>
              En créant un compte ou en utilisant les services Wadashaqayn, vous (l&apos;
              &laquo;&nbsp;Utilisateur&nbsp;&raquo;) acceptez sans réserve les présentes CGU. Si
              vous agissez au nom d&apos;une organisation, vous déclarez être habilité à engager
              cette organisation.
            </p>
            <p>
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Description du service">
            <p>
              Wadashaqayn est une plateforme SaaS multi-tenant offrant les modules suivants :
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-100">Gestion de projets</strong> : planification
                Gantt, suivi des tâches, dépendances, collaboration en temps réel.
              </li>
              <li>
                <strong className="text-zinc-100">Ressources Humaines</strong> : gestion des
                employés, congés, absences, paie, notes de frais, formations et évaluations.
              </li>
              <li>
                <strong className="text-zinc-100">Analytics</strong> : tableaux de bord,
                indicateurs de performance et rapports d&apos;activité.
              </li>
              <li>
                <strong className="text-zinc-100">Collaboration</strong> : messagerie interne,
                notifications, calendrier partagé.
              </li>
            </ul>
            <p>
              L&apos;Éditeur se réserve le droit de modifier, suspendre ou arrêter tout ou partie
              des fonctionnalités, avec notification préalable dans la mesure du possible.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Accès et compte utilisateur">
            <Subsection title="3.1 Création du compte">
              <p>
                L&apos;accès au service nécessite la création d&apos;un compte par invitation ou
                inscription directe (tenant owner). Vous vous engagez à fournir des informations
                exactes et à les maintenir à jour.
              </p>
            </Subsection>
            <Subsection title="3.2 Sécurité du compte">
              <p>
                Vous êtes seul responsable de la confidentialité de vos identifiants et de toutes
                les actions effectuées depuis votre compte. En cas de compromission suspectée,
                vous devez immédiatement nous contacter à{' '}
                <a
                  href="mailto:security@wadashaqayn.org"
                  className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
                >
                  security@wadashaqayn.org
                </a>
                .
              </p>
            </Subsection>
            <Subsection title="3.3 Multi-tenant">
              <p>
                Chaque organisation (tenant) dispose d&apos;un espace isolé. Les données d&apos;un
                tenant ne sont accessibles qu&apos;aux utilisateurs expressément invités par
                l&apos;administrateur de ce tenant.
              </p>
            </Subsection>
          </Section>

          {/* 4 */}
          <Section title="4. Conditions d'abonnement et facturation">
            <Subsection title="4.1 Plans tarifaires">
              <p>
                Wadashaqayn propose différents plans d&apos;abonnement dont les tarifs et les
                fonctionnalités sont détaillés sur{' '}
                <a
                  href="https://wadashaqayn.org/#pricing"
                  className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
                >
                  la page Tarifs
                </a>
                . Les prix sont indiqués hors taxes et peuvent être modifiés avec un préavis de
                30 jours.
              </p>
            </Subsection>
            <Subsection title="4.2 Paiement">
              <p>
                Les abonnements sont facturés mensuellement ou annuellement selon le plan choisi.
                Le paiement est dû à l&apos;avance. Tout retard de paiement peut entraîner la
                suspension du service après un délai de grâce de 7 jours calendaires.
              </p>
            </Subsection>
            <Subsection title="4.3 Remboursements">
              <p>
                Sauf disposition légale contraire, aucun remboursement n&apos;est accordé pour
                les périodes entamées. En cas de résiliation anticipée d&apos;un abonnement
                annuel, le solde de la période restante peut être remboursé au prorata, à la
                discrétion de l&apos;Éditeur.
              </p>
            </Subsection>
          </Section>

          {/* 5 */}
          <Section title="5. Utilisation acceptable">
            <p>En utilisant Wadashaqayn, vous vous engagez à ne pas :</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Violer des lois ou réglementations applicables (nationales ou internationales).
              </li>
              <li>
                Transmettre, stocker ou diffuser du contenu illégal, diffamatoire, pornographique,
                haineux ou portant atteinte aux droits de tiers.
              </li>
              <li>
                Tenter d&apos;accéder sans autorisation aux systèmes, comptes ou données
                d&apos;autres utilisateurs ou tenants.
              </li>
              <li>
                Introduire des virus, malwares, ou tout code malveillant dans la plateforme.
              </li>
              <li>
                Faire du reverse engineering, décompiler ou tenter d&apos;extraire le code source
                de l&apos;application.
              </li>
              <li>
                Utiliser le service à des fins de scraping, d&apos;envoi de spam ou de toute
                activité portant atteinte à la disponibilité du service.
              </li>
              <li>
                Usurper l&apos;identité d&apos;une personne physique ou morale.
              </li>
            </ul>
            <p>
              Tout manquement grave peut entraîner la suspension ou la résiliation immédiate du
              compte, sans préjudice des actions légales que l&apos;Éditeur se réserve le droit
              d&apos;engager.
            </p>
          </Section>

          {/* 6 */}
          <Section title="6. Propriété intellectuelle">
            <p>
              La plateforme Wadashaqayn, son code source, son interface, ses marques, logos et
              tout contenu éditorial sont la propriété exclusive de l&apos;Éditeur ou de ses
              concédants de licence. Toute reproduction, modification ou exploitation sans
              autorisation écrite préalable est strictement interdite.
            </p>
            <p>
              Les données et contenus créés par l&apos;Utilisateur (projets, documents, données
              RH) restent sa propriété. En utilisant le service, l&apos;Utilisateur accorde à
              l&apos;Éditeur une licence limitée, non exclusive et révocable, strictement
              nécessaire à la fourniture du service.
            </p>
          </Section>

          {/* 7 */}
          <Section title="7. Disponibilité du service">
            <p>
              L&apos;Éditeur s&apos;efforce de maintenir le service disponible 24h/24 et 7j/7,
              avec un objectif de disponibilité de <strong className="text-zinc-100">99,5 %</strong>{' '}
              par mois (hors maintenances planifiées).
            </p>
            <p>
              Des interruptions ponctuelles peuvent survenir pour maintenance, mises à jour ou
              événements hors du contrôle de l&apos;Éditeur (force majeure, pannes
              d&apos;infrastructure tierce). L&apos;Éditeur ne peut être tenu responsable des
              pertes consécutives à une interruption de service.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Limitation de responsabilité">
            <p>
              Dans les limites autorisées par la loi applicable, l&apos;Éditeur ne saurait être
              tenu responsable :
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                De dommages indirects, accessoires, punitifs ou consécutifs résultant de
                l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le service.
              </li>
              <li>
                De la perte de données due à une mauvaise utilisation, à un sinistre ou à une
                action de l&apos;Utilisateur.
              </li>
              <li>
                Des actions ou omissions de sous-traitants tiers agissant en dehors des
                instructions de l&apos;Éditeur.
              </li>
            </ul>
            <p>
              La responsabilité totale de l&apos;Éditeur est en tout état de cause limitée aux
              montants payés par l&apos;Utilisateur au cours des 12 derniers mois précédant
              l&apos;événement générateur.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Résiliation">
            <Subsection title="9.1 Résiliation par l'Utilisateur">
              <p>
                L&apos;Utilisateur peut résilier son abonnement à tout moment depuis les
                paramètres de son compte ou en contactant{' '}
                <a
                  href="mailto:support@wadashaqayn.org"
                  className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
                >
                  support@wadashaqayn.org
                </a>
                . La résiliation prend effet à la fin de la période de facturation en cours.
              </p>
            </Subsection>
            <Subsection title="9.2 Résiliation par l'Éditeur">
              <p>
                L&apos;Éditeur peut résilier le compte en cas de manquement grave aux présentes
                CGU, de non-paiement persistant, ou pour toute raison légitime avec un préavis
                de 30 jours (sauf faute grave).
              </p>
            </Subsection>
            <Subsection title="9.3 Effets de la résiliation">
              <p>
                À la résiliation, l&apos;accès au service est coupé. Un délai de 30 jours est
                accordé pour exporter les données. Passé ce délai, les données sont supprimées
                définitivement dans un délai de 90 jours.
              </p>
            </Subsection>
          </Section>

          {/* 10 */}
          <Section title="10. Protection des données personnelles">
            <p>
              Le traitement des données personnelles dans le cadre du service est décrit dans
              notre{' '}
              <Link
                to="/privacy"
                className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
              >
                Politique de Confidentialité
              </Link>
              , qui fait partie intégrante des présentes CGU.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Modification des CGU">
            <p>
              L&apos;Éditeur se réserve le droit de modifier les présentes CGU. Toute
              modification sera notifiée par e-mail avec un préavis minimum de{' '}
              <strong className="text-zinc-100">15 jours</strong>. La poursuite de
              l&apos;utilisation du service après ce délai vaut acceptation des nouvelles
              conditions.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Droit applicable et résolution des litiges">
            <p>
              Les présentes CGU sont soumises au{' '}
              <strong className="text-zinc-100">droit djiboutien</strong>, complété par le droit
              français dans les matières non couvertes par la législation djiboutienne. En cas de
              litige, les parties s&apos;efforceront de trouver une solution amiable.
            </p>
            <p>
              À défaut, tout litige relatif à l&apos;interprétation ou à l&apos;exécution des
              présentes sera soumis aux tribunaux compétents de{' '}
              <strong className="text-zinc-100">Djibouti</strong>, sauf disposition légale
              contraire d&apos;ordre public applicable au consommateur.
            </p>
          </Section>

          {/* 13 */}
          <Section title="13. Contact">
            <address className="not-italic rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
              <strong className="text-zinc-100">Wadashaqayn</strong>
              <br />
              Djibouti, République de Djibouti
              <br />
              Support :{' '}
              <a
                href="mailto:support@wadashaqayn.org"
                className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
              >
                support@wadashaqayn.org
              </a>
              <br />
              Mentions légales :{' '}
              <a
                href="mailto:legal@wadashaqayn.org"
                className="text-purple-400 underline underline-offset-2 hover:text-purple-300"
              >
                legal@wadashaqayn.org
              </a>
            </address>
          </Section>

        </div>

        {/* Footer liens */}
        <footer className="mt-16 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/" className="transition-colors hover:text-zinc-300">
              Accueil
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-zinc-300">
              Politique de confidentialité
            </Link>
            <a
              href="mailto:support@wadashaqayn.org"
              className="transition-colors hover:text-zinc-300"
            >
              Contact
            </a>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} Wadashaqayn. Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  );
}

// ─── Composants utilitaires ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100 border-l-2 border-purple-500 pl-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}
