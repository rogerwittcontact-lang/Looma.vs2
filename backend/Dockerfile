FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./

RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY backend/ .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
