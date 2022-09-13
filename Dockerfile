FROM node:16.13.2
WORKDIR /server
COPY package.json yarn.lock ./
# COPY yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
CMD ["node", "build/src/main.js"]