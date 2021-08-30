FROM alpine

# install features not available in base alpine distro
RUN apk --no-cache add \
  bash \
  lastpass-cli

WORKDIR /tupaia
