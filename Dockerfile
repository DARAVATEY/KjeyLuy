FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure GEMINI_API_KEY is available here if needed for the build
RUN npm run build

FROM nginx:stable-alpine
# Set port to 8080 for Cloud Run compatibility
RUN sed -i 's/listen.*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
# Route all traffic to index.html to support React Router
RUN sed -i 's/index  index.html index.htm;/try_files $uri $uri\/ \/index.html;/g' /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
