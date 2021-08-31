FROM alpine

# install features not available in base alpine distro
RUN apk --no-cache add \
  bash \
  lastpass-cli

WORKDIR /tupaia

RUN mkdir -p ./scripts/bash
COPY scripts/bash/. ./scripts/bash

RUN mkdir -p ./packages/devops/scripts/ci
COPY packages/devops/scripts/ci/. ./packages/devops/scripts/ci

RUN ./packages/devops/scripts/ci/makePlaceholderPackageFolders.sh
