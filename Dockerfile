FROM node:18-alpine as build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 8080
CMD ["npm", "start"]