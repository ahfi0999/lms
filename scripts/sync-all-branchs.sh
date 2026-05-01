#!/usr/bin/env bash

# Sync all branchs with development
git checkout development
git pull

git checkout qa
git pull
git merge development

git checkout production
git pull
git merge qa

git push --all

# Return to development
git checkout development
git pull

echo "✅ - Sync all branchs with development"
exit 1
