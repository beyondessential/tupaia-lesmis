#!/bin/bash
set -x

PACKAGE=$1

if [ -f "/root/tupaia/deployment_exists" ]; then
    echo "Deployment for ${CI_BRANCH} exists, building ${PACKAGE}"
    CI=false yarn workspace @tupaia/${PACKAGE} build # set CI to false to ignore warnings https://github.com/facebook/create-react-app/issues/3657
else
    echo "No deployment exists for ${CI_BRANCH}, skipping build"
fi
