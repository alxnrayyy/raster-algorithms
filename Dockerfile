# Используем легковесный nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем HTML, CSS и JS файлы в папку nginx
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Открываем порт 80
EXPOSE 80

# nginx уже запускается автоматически, но можно явно указать
CMD ["nginx", "-g", "daemon off;"]