FROM apify/actor-node:20
COPY package*.json ./
RUN npm install --omit=dev --omit=optional && echo "Dependencies installed."
COPY . ./
CMD ["npm", "start"]
