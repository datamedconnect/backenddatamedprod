FROM node:18-alpine as build

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 8080
CMD ["npm", "start"]