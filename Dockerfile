FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass the API key as a build argument
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

FROM nginx:stable-alpine
# Update port to 8080 for Cloud Run
RUN sed -i 's/listen.*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
# Enable SPA routing: redirect all non-file requests to index.html
RUN sed -i 's/index  index.html index.htm;/try_files $uri $uri\/ \/index.html;/g' /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
