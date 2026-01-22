FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN corepack enable

COPY package*.json ./
COPY yarn.lock* ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
