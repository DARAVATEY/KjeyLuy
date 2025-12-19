FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Add your API key here so Vite can see it during build
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=AIzaSyBHjDxlAwcvwjBfkRj99mnSXE6-MvH61Aw
RUN npm run build

FROM nginx:stable-alpine
# Configure port 8080 for Cloud Run
RUN sed -i 's/listen.*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
# Configure routing for React SPA
RUN sed -i 's/index  index.html index.htm;/try_files $uri $uri\/ \/index.html;/g' /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
