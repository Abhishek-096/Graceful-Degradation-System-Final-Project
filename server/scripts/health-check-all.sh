#!/bin/bash
# health-check-all.sh
# Pings all Unix socket connections for fast failure detection
# Reports status of each downstream service

echo "========================================="
echo "  Unix Socket Health Check"
echo "  $(date)"
echo "========================================="

SOCKET_DIR=${SOCKET_DIR:-"/var/run/degradation"}
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/graceful_degradation"}

SOCKETS=(
  "user-api.sock:User API"
  "mongodb.sock:MongoDB Primary"
  "redis.sock:Redis Cache"
  "rabbitmq.sock:RabbitMQ"
  "s3.sock:S3 Storage"
  "auth.sock:Auth Service"
)

echo ""
echo "Checking socket connections..."
echo ""

HEALTHY=0
FAILED=0

for entry in "${SOCKETS[@]}"; do
  IFS=':' read -r sock_name service_name <<< "$entry"
  sock_path="$SOCKET_DIR/$sock_name"
  
  START=$(date +%s%N)
  
  if [ -S "$sock_path" ] 2>/dev/null; then
    RESPONSE=$(echo "PING" | socat - UNIX-CONNECT:"$sock_path" 2>/dev/null)
    END=$(date +%s%N)
    LATENCY=$(( (END - START) / 1000000 ))
    
    if [ "$RESPONSE" = "PONG" ]; then
      echo "  ✓ $sock_name: PONG (${LATENCY}ms) - $service_name"
      HEALTHY=$((HEALTHY + 1))
    else
      echo "  ✗ $sock_name: NO RESPONSE - $service_name"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "  ✗ $sock_name: SOCKET NOT FOUND - $service_name"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "========================================="
echo "  Results: $HEALTHY healthy, $FAILED failed"
echo "========================================="

# Update MongoDB with health check results
mongosh "$MONGO_URI" --quiet --eval "
  db.activity_logs.insertOne({
    type: 'socket-event',
    message: 'Health check complete: $HEALTHY healthy, $FAILED failed',
    severity: $FAILED > 0 ? 'warning' : 'info',
    createdAt: new Date()
  });
" 2>/dev/null
