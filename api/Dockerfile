FROM node:20-alpine

WORKDIR /app

# deps nativas
RUN apk add --no-cache libc6-compat

# corepack p/ yarn/pnpm
RUN corepack enable

COPY package*.json yarn.lock* ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
