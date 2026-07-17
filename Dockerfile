FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads/profils uploads/documents uploads/vehicules

EXPOSE 5000

CMD ["node", "index.js"]
