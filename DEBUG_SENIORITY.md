# Debug - Test des Périodes de Gel

## Problème 1: Prime d'Ancienneté pas visible

**Cause**: Le query `fetchBulletins` ne récupérait pas `date_embauche` de l'employé

**Solution**: Modifié le select pour inclure:

```typescript
.select('*, employe:paie_employes(nom_complet, fonction, date_embauche)')
```

## Problème 2: Périodes de gel non fonctionnelles

**À vérifier**:

1. La table `periodes_gel_anciennete` existe dans la base de données
2. Les permissions RLS sont correctes
3. Le service `addFreezePeriod` fonctionne

**Test manuel à faire**:

```sql
-- Vérifier que la table existe
SELECT * FROM periodes_gel_anciennete WHERE tenant_id = 'YOUR_TENANT_ID';

-- Tester l'insertion
INSERT INTO periodes_gel_anciennete (tenant_id, date_debut, date_fin, motif)
VALUES ('YOUR_TENANT_ID', '2024-01-01', '2024-06-30', 'Test');
```

**Actions prises**:

- Ajouté log console dans fetchBulletins pour déboguer
- Ajouté date_embauche dans la requête
- Logs console dans SeniorityBonusConfig pour voir les erreurs d'ajout

**Prochaines étapes**:

1. Vérifier dans la console que `bulletin.prime_anciennete` est bien présent
2. Vérifier que `bulletin.employe.date_embauche` est présent
3. Vérifier les logs d'erreur lors de l'ajout de période de gel
