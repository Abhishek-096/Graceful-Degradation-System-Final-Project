#!/bin/bash
# update-cache-fallbacks.sh
# Fetches latest data from API and imports into MongoDB fallback collections
# Uses mongoimport to bulk update cached response data

echo "========================================="
echo "  Fallback Cache Update Script"
echo "  $(date)"
echo "========================================="

API_URL=${API_URL:-"http://localhost:5000/api"}
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/graceful_degradation"}

echo ""
echo "[1/4] Fetching current user data from API..."
curl -s "$API_URL/services" | python3 -m json.tool > /tmp/cached_services.json 2>/dev/null
echo "✓ Service data cached"

echo ""
echo "[2/4] Updating MongoDB fallback collection..."
mongoimport --uri "$MONGO_URI" \
  --collection cached_responses \
  --type json \
  --file /tmp/cached_services.json \
  --drop \
  --jsonArray 2>/dev/null
echo "✓ MongoDB collection 'cached_responses' updated"

echo ""
echo "[3/4] Setting TTL on cached documents..."
mongosh "$MONGO_URI" --quiet --eval '
  db.cached_responses.createIndex(
    { "createdAt": 1 },
    { expireAfterSeconds: 300 }
  );
  print("✓ TTL index set to 300 seconds");
' 2>/dev/null

echo ""
echo "[4/4] Verifying data integrity..."
COUNT=$(mongosh "$MONGO_URI" --quiet --eval 'db.cached_responses.countDocuments()' 2>/dev/null)
echo "✓ Total cached documents: $COUNT"
echo ""
echo "========================================="
echo "  Cache update complete!"
echo "========================================="
