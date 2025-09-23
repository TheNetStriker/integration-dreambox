FROM node:20.16 AS node-build

WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY src/ ./src/
RUN npm install && npm run build

FROM node:20.16

# Set working directory
WORKDIR /app

# Copy compiled javascript
COPY --from=node-build /usr/src/app/dist/src/ ./src/
COPY --from=node-build /usr/src/app/node_modules/ ./node_modules/
COPY package.json .
COPY driver.json .

# Expose the integration port (default 9988)
EXPOSE 9988

# Run the driver
CMD ["node", "src/driver.js"]