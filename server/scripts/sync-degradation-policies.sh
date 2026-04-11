#!/bin/bash
# sync-degradation-policies.sh
# Pulls latest degradation policies from Git and syncs to MongoDB
# Tracks policy version evolution

echo "========================================="
echo "  Git Policy Sync Script"
echo "  $(date)"
echo "========================================="

MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/graceful_degradation"}
POLICIES_DIR=${POLICIES_DIR:-"./policies"}

echo ""
echo "[1/4] Pulling latest policies from Git..."
git pull origin main -- policies/ 2>/dev/null || echo "  (Using local policies)"
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
echo "✓ Current commit: $GIT_COMMIT"

echo ""
echo "[2/4] Reading policy files..."
POLICY_COUNT=$(ls -1 $POLICIES_DIR/*.json 2>/dev/null | wc -l)
echo "✓ Found $POLICY_COUNT policy files"

echo ""
echo "[3/4] Importing policies to MongoDB..."
for file in $POLICIES_DIR/*.json; do
  [ -f "$file" ] || continue
  mongoimport --uri "$MONGO_URI" \
    --collection degradation_policies \
    --type json \
    --file "$file" \
    --mode upsert 2>/dev/null
  echo "  ✓ Imported: $(basename $file)"
done

echo ""
echo "[4/4] Verifying sync..."
mongosh "$MONGO_URI" --quiet --eval '
  const policies = db.degradation_policies.find({ active: true }).toArray();
  print(`✓ Active policies: ${policies.length}`);
  policies.forEach(p => {
    print(`  - ${p.name} (${p.version}) by ${p.author}`);
  });
' 2>/dev/null

echo ""
echo "========================================="
echo "  Policy sync complete! Commit: $GIT_COMMIT"
echo "========================================="
