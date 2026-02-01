#!/bin/bash

# Test the professor hierarchy endpoint
curl -X GET "http://localhost:3000/api/prof/hierarchy" \
  -H "Cookie: next-auth.session-token=test" \
  -H "Content-Type: application/json" \
  2>&1
