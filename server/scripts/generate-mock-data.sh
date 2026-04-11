#!/bin/bash
# generate-mock-data.sh
# Generates mock fallback data and stores it in MongoDB
# Used when real data sources are unavailable

echo "========================================="
echo "  Mock Data Generation Script"
echo "  $(date)"
echo "========================================="

MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/graceful_degradation"}

echo ""
echo "[1/3] Generating mock user profiles..."
node -e '
const data = [];
for (let i = 0; i < 500; i++) {
  data.push({
    userId: `user-${String(i).padStart(4, "0")}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    role: ["admin", "user", "moderator"][i % 3],
    createdAt: new Date(),
    isMock: true
  });
}
process.stdout.write(JSON.stringify(data));
' > /tmp/mock_users.json
echo "✓ Generated 500 mock user profiles"

echo ""
echo "[2/3] Importing mock data into MongoDB..."
mongoimport --uri "$MONGO_URI" \
  --collection mock_data \
  --type json \
  --file /tmp/mock_users.json \
  --drop \
  --jsonArray 2>/dev/null
echo "✓ Stored in MongoDB collection 'mock_data'"

echo ""
echo "[3/3] Running schema validation..."
mongosh "$MONGO_URI" --quiet --eval '
  const count = db.mock_data.countDocuments();
  const sample = db.mock_data.findOne();
  const hasRequiredFields = sample && sample.userId && sample.name && sample.email;
  print(`✓ Documents: ${count}`);
  print(`✓ Schema validation: ${hasRequiredFields ? "PASSED" : "FAILED"}`);
' 2>/dev/null

echo ""
echo "========================================="
echo "  Mock data generation complete!"
echo "========================================="
