FROM node:10.15.3

RUN apt update && apt install -y ffmpeg

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node . .

EXPOSE 80
EXPOSE 443

CMD ["node", "src/app.js"]
