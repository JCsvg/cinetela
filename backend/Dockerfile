FROM php:8.4-cli-alpine
WORKDIR /app

# Driver do PostgreSQL para o PDO (a imagem oficial não traz)
RUN apk add --no-cache libpq-dev \
    && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock* ./
RUN composer install --no-interaction

COPY . .

EXPOSE 8000
# PORT é definida por hospedagens como o Render; local, o padrão é 8000
# O último argumento é o roteador: toda requisição passa pelo index.php
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t public public/index.php"]
