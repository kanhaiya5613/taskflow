FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run seed
EXPOSE 4000
CMD ["node", "src/server.js"]
