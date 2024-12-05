FROM node:20
WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
RUN npm install
COPY . .
ENV PORT 8080
EXPOSE 8080
CMD [ "npm", "run", "start"]