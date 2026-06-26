import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const LAST_UPDATED = '06 mai 2026';

export default function PrivacyPage() {
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
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            Politique de confidentialité
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Titre */}
        <div className="mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
            <Shield className="h-3 w-3" />
            Confidentialité &amp; Protection des données
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Politique de Confidentialité
          </h1>
          <p className="text-zinc-400">
            Dernière mise à jour : <time dateTime="2026-05-06">{LAST_UPDATED}</time>
          </p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-zinc-300">

          {/* 1 */}
          <Section title="1. Qui sommes-nous ?">
            <p>
              <strong className="text-zinc-100">Wadashaqayn</strong> est une plateforme SaaS de
              gestion des ressources humaines et de projets, éditée par la société Wadashaqayn,
              dont le siège social est situé à <strong className="text-zinc-100">Djibouti,
                République de Djibouti</strong>.
            </p>
            <p>
              La plateforme est accessible à l&apos;adresse{' '}
              <a
                href="https://wadashaqayn.org"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                https://wadashaqayn.org
              </a>
              .
            </p>
            <p>
              En tant que responsable du traitement, Wadashaqayn s&apos;engage à traiter vos
              données personnelles dans le respect de la vie privée et de la réglementation
              applicable, notamment le Règlement Général sur la Protection des Données (RGPD)
              de l&apos;Union Européenne.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Données collectées">
            <p>Nous collectons les catégories de données suivantes :</p>

            <Subsection title="2.1 Données d'identification et de contact">
              <ul className="list-disc space-y-1 pl-5">
                <li>Nom complet et prénom</li>
                <li>Adresse e-mail professionnelle</li>
                <li>Numéro de téléphone (optionnel)</li>
                <li>Intitulé du poste et département</li>
              </ul>
            </Subsection>

            <Subsection title="2.2 Données professionnelles et RH">
              <ul className="list-disc space-y-1 pl-5">
                <li>Matricule employé, date d&apos;embauche, ancienneté</li>
                <li>Informations de paie et avantages (si module Paie activé)</li>
                <li>Absences, congés, présences et demandes administratives</li>
                <li>Formations suivies, certifications et compétences</li>
                <li>Entretiens annuels et évaluations de performance</li>
              </ul>
            </Subsection>

            <Subsection title="2.3 Données de projets et tâches">
              <ul className="list-disc space-y-1 pl-5">
                <li>Projets créés ou assignés, tâches et commentaires</li>
                <li>Pièces jointes téléversées (documents, images)</li>
                <li>Historique des modifications et journaux d&apos;activité</li>
              </ul>
            </Subsection>

            <Subsection title="2.4 Données techniques et de navigation">
              <ul className="list-disc space-y-1 pl-5">
                <li>Adresse IP et informations de session</li>
                <li>Type de navigateur et système d&apos;exploitation</li>
                <li>Pages consultées, heure et durée des visites</li>
                <li>Journaux d&apos;erreurs et de performance applicative</li>
              </ul>
            </Subsection>

            <p>
              Nous ne collectons pas de données dites « sensibles » (origine raciale, convictions
              religieuses, données de santé, etc.) sauf consentement explicite et nécessité
              fonctionnelle avérée (ex. gestion des arrêts maladie avec accord préalable).
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Utilisation des données des services Google (Exigences OAuth)">
            <p>
              L'utilisation et le transfert à toute autre application d'informations reçues des
              API Google respecteront la{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                Politique relative aux données utilisateur des services API de Google
              </a>
              , y compris les exigences d'utilisation restreinte.
            </p>

            <Subsection title="3.1 Données Google auxquelles nous accédons">
              <p>
                Si vous choisissez de connecter votre compte Google à Wadashaqayn (par exemple, pour
                l'authentification OAuth), nous accédons uniquement aux informations strictement
                nécessaires au fonctionnement de l'intégration. Cela inclut votre nom,
                votre adresse e-mail et votre photo de profil de compte Google.
              </p>
            </Subsection>

            <Subsection title="3.2 Utilisation des données Google">
              <p>
                Ces données Google sont utilisées exclusivement pour vous fournir les
                fonctionnalités de la plateforme Wadashaqayn (en l'occurrence, vous authentifier
                et créer votre session en toute sécurité). Nous n'utilisons en aucun cas
                ces données pour vous proposer des publicités ciblées ou pour des finalités tierces.
              </p>
            </Subsection>

            <Subsection title="3.3 Partage des données Google">
              <p>
                <strong className="text-zinc-100">Nous ne partageons, ne vendons et ne louons
                  aucune de vos données Google</strong> à des tiers ou des partenaires externes à des
                fins marketing ou commerciales. Les seules exceptions concernent le respect
                des obligations légales (processus juridique valide).
              </p>
            </Subsection>

            <Subsection title="3.4 Stockage et protection des données Google">
              <p>
                Vos données provenant de Google, comme toutes vos autres données personnelles,
                sont chiffrées en transit (HTTPS/TLS 1.3) et au repos (AES-256) de manière
                sécurisée.
              </p>
            </Subsection>

            <Subsection title="3.5 Conservation et suppression des données Google">
              <p>
                Nous conservons ces données temporelles uniquement le temps nécessaire ou
                tant que votre compte Wadashaqayn restera actif. Vous pouvez à tout moment :
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Révoquer l'accès à vos données directement via la page des paramètres de votre
                  compte Google ({' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    myaccount.google.com/permissions
                  </a>
                  ).
                </li>
                <li>
                  Demander la suppression de toutes vos données hébergées en nous contactant à{' '}
                  <a href="mailto:privacy@wadashaqayn.org" className="text-blue-400">privacy@wadashaqayn.org</a>.
                </li>
              </ul>
            </Subsection>
          </Section>

          {/* 4 */}
          <Section title="4. Finalités du traitement">
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-100">Fourniture du service</strong> : création et
                gestion de votre compte, accès aux modules RH, projets et analytics.
              </li>
              <li>
                <strong className="text-zinc-100">Administration RH</strong> : gestion des
                salariés, congés, paie, formations et évaluations pour le compte du tenant
                (entreprise cliente).
              </li>
              <li>
                <strong className="text-zinc-100">Sécurité</strong> : authentification,
                contrôle d&apos;accès basé sur les rôles, détection de fraudes et journaux
                d&apos;audit.
              </li>
              <li>
                <strong className="text-zinc-100">Communications</strong> : notifications
                transactionnelles (invitations, alertes), support technique et informations sur
                les mises à jour importantes.
              </li>
              <li>
                <strong className="text-zinc-100">Amélioration du produit</strong> : analyse
                d&apos;usage agrégée et anonymisée pour améliorer les fonctionnalités.
              </li>
              <li>
                <strong className="text-zinc-100">Obligations légales</strong> : conservation
                des données requise par les réglementations applicables.
              </li>
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Base légale du traitement">
            <p>Nos traitements reposent sur les bases légales suivantes :</p>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="px-4 py-2 text-left font-semibold text-zinc-200">Traitement</th>
                    <th className="px-4 py-2 text-left font-semibold text-zinc-200">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {[
                    ['Création de compte & fourniture du service', 'Exécution du contrat (Art. 6.1.b RGPD)'],
                    ['Gestion RH (paie, absences, performance)', 'Exécution du contrat / Obligation légale (Art. 6.1.b et 6.1.c)'],
                    ['Journaux de sécurité & audit', 'Intérêt légitime (Art. 6.1.f)'],
                    ['Amélioration du produit (données anonymes)', 'Intérêt légitime (Art. 6.1.f)'],
                    ['Communications marketing', 'Consentement (Art. 6.1.a)'],
                  ].map(([t, b]) => (
                    <tr key={t} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-2 text-zinc-300">{t}</td>
                      <td className="px-4 py-2 text-zinc-400">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 6 */}
          <Section title="6. Hébergement et sous-traitants">
            <p>
              La plateforme est hébergée sur l&apos;infrastructure de{' '}
              <strong className="text-zinc-100">Supabase</strong> (base de données PostgreSQL,
              authentification, stockage de fichiers), dont les serveurs sont situés dans
              l&apos;Union Européenne (région <code className="rounded bg-zinc-800 px-1 text-blue-400">eu-west-1</code>).
            </p>
            <p>Nos principaux sous-traitants sont :</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-100">Supabase Inc.</strong> — Base de données,
                authentification et stockage (DPA disponible sur demande)
              </li>
              <li>
                <strong className="text-zinc-100">Vercel / Cloudflare</strong> — CDN et
                distribution de l&apos;interface web
              </li>
            </ul>
            <p>
              Tout transfert de données hors UE est encadré par des clauses contractuelles types
              (CCT) conformes au RGPD.
            </p>
          </Section>

          {/* 7 */}
          <Section title="7. Durée de conservation">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-zinc-100">Données de compte actif</strong> : conservées
                pendant toute la durée de la relation contractuelle.
              </li>
              <li>
                <strong className="text-zinc-100">Données RH</strong> : 5 ans après la fin du
                contrat de travail (obligations légales djiboutiennes et françaises).
              </li>
              <li>
                <strong className="text-zinc-100">Journaux de sécurité</strong> : 12 mois.
              </li>
              <li>
                <strong className="text-zinc-100">Après résiliation du compte</strong> : 30 jours
                de grâce, puis suppression définitive sous 90 jours (sauf obligation légale).
              </li>
            </ul>
          </Section>

          {/* 8 */}
          <Section title="8. Vos droits (RGPD)">
            <p>
              Conformément au RGPD, vous disposez des droits suivants sur vos données
              personnelles :
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-zinc-100">Droit d&apos;accès</strong> : obtenir une
                copie des données vous concernant.
              </li>
              <li>
                <strong className="text-zinc-100">Droit de rectification</strong> : corriger
                des données inexactes ou incomplètes.
              </li>
              <li>
                <strong className="text-zinc-100">Droit à l&apos;effacement</strong> (« droit à
                l&apos;oubli ») : demander la suppression de vos données sous réserve des
                obligations légales.
              </li>
              <li>
                <strong className="text-zinc-100">Droit à la portabilité</strong> : recevoir vos
                données dans un format structuré et lisible par machine.
              </li>
              <li>
                <strong className="text-zinc-100">Droit à la limitation</strong> : suspendre
                temporairement le traitement.
              </li>
              <li>
                <strong className="text-zinc-100">Droit d&apos;opposition</strong> : s&apos;opposer
                au traitement fondé sur l&apos;intérêt légitime.
              </li>
              <li>
                <strong className="text-zinc-100">Droit de retrait du consentement</strong> : à
                tout moment pour les traitements fondés sur le consentement.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, envoyez une demande à{' '}
              <a
                href="mailto:privacy@wadashaqayn.org"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                privacy@wadashaqayn.org
              </a>
              . Nous répondrons dans un délai de <strong className="text-zinc-100">30 jours</strong>.
            </p>
            <p>
              Vous avez également le droit d&apos;introduire une réclamation auprès de
              l&apos;autorité de contrôle compétente.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Cookies et traceurs">
            <p>
              Wadashaqayn utilise des cookies strictement nécessaires au fonctionnement du
              service (session, authentification, préférences d&apos;interface). Aucun cookie
              publicitaire ou de tracking tiers n&apos;est déposé sans votre consentement
              préalable.
            </p>
            <p>
              Vous pouvez gérer vos préférences de cookies via les paramètres de votre
              navigateur.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Sécurité des données">
            <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)</li>
              <li>Authentification multi-facteurs (MFA) disponible pour tous les comptes</li>
              <li>Contrôle d&apos;accès basé sur les rôles (RBAC) avec principe du moindre privilège</li>
              <li>Journaux d&apos;audit complets pour les actions sensibles</li>
              <li>Sauvegardes automatiques quotidiennes avec rétention 7 jours</li>
              <li>Tests de sécurité réguliers et audits de code</li>
            </ul>
          </Section>

          {/* 11 */}
          <Section title="11. Modifications de la politique">
            <p>
              Nous nous réservons le droit de modifier la présente politique à tout moment.
              Toute modification substantielle sera notifiée par e-mail avec un préavis
              d&apos;au moins <strong className="text-zinc-100">15 jours</strong>.
              La poursuite de l&apos;utilisation du service après ce délai vaut acceptation de
              la nouvelle politique.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Contact">
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles,
              contactez notre Délégué à la Protection des Données (DPD) :
            </p>
            <address className="mt-3 not-italic rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
              <strong className="text-zinc-100">Wadashaqayn</strong>
              <br />
              Djibouti, République de Djibouti
              <br />
              E-mail :{' '}
              <a
                href="mailto:privacy@wadashaqayn.org"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                privacy@wadashaqayn.org
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
            <Link to="/terms" className="transition-colors hover:text-zinc-300">
              Conditions générales d&apos;utilisation
            </Link>
            <a
              href="mailto:privacy@wadashaqayn.org"
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
      <h2 className="text-lg font-semibold text-zinc-100 border-l-2 border-blue-500 pl-3">
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
